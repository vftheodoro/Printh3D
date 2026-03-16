import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

function sanitizeSalePayloadForDb(rawInput: any) {
  return {
    cliente: String(rawInput.cliente || '').trim() || 'Desconhecido',
    item_nome: String(rawInput.item_nome || '').trim() || 'Item sem nome',
    product_id: rawInput.product_id ? Number(rawInput.product_id) : null,
    cupom_id: rawInput.cupom_id ? Number(rawInput.cupom_id) : null,
    desconto_percentual: Number(rawInput.desconto_percentual) || 0,
    valor_venda: Number(rawInput.valor_venda) || 0,
    valor_devido: Number(rawInput.valor_devido) || 0,
    tipo_pagamento: String(rawInput.tipo_pagamento || 'PIX'),
    parcelas: Math.max(1, Number(rawInput.parcelas) || 1),
    data_venda: rawInput.data_venda || new Date().toISOString(),
    lucro: Number(rawInput.lucro) || 0,
    observacoes: rawInput.observacoes ? String(rawInput.observacoes) : null
  };
}

async function enrichSalePayload(supabase: ReturnType<typeof getAdminSupabase>, rawInput: any) {
  const payload = { ...rawInput };
  const quantity = Math.max(1, Number(payload.quantidade) || 1);

  if (payload.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('id, nome, preco_venda, custo_total')
      .eq('id', payload.product_id)
      .single();

    if (product) {
      if (!payload.item_nome) {
        payload.item_nome = quantity > 1 ? `${product.nome} x${quantity}` : product.nome;
      }

      if (!Number.isFinite(Number(payload.valor_venda)) || Number(payload.valor_venda) <= 0) {
        payload.valor_venda = (Number(product.preco_venda) || 0) * quantity;
      }

      const saleValue = Number(payload.valor_venda) || 0;
      const productCost = (Number(product.custo_total) || 0) * quantity;
      payload.lucro = Number((saleValue - productCost).toFixed(2));
    }
  }

  if (payload.cupom_id) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, ativo, tipo_desconto, valor_desconto, data_validade, limite_usos, usos_atuais')
      .eq('id', payload.cupom_id)
      .single();

    if (coupon && coupon.ativo) {
      const now = new Date();
      const expiresAt = coupon.data_validade ? new Date(coupon.data_validade) : null;
      const hasReachedLimit = coupon.limite_usos && (Number(coupon.usos_atuais) || 0) >= coupon.limite_usos;

      if ((!expiresAt || expiresAt >= now) && !hasReachedLimit) {
        const baseValue = Number(payload.valor_venda) || 0;
        const discountRaw = Number(coupon.valor_desconto) || 0;
        const discountAmount = coupon.tipo_desconto === 'percentual'
          ? (baseValue * discountRaw) / 100
          : discountRaw;

        const finalValue = Math.max(0, baseValue - discountAmount);
        payload.desconto_percentual = coupon.tipo_desconto === 'percentual'
          ? discountRaw
          : baseValue > 0
            ? Number(((discountAmount / baseValue) * 100).toFixed(2))
            : 0;
        payload.valor_venda = Number(finalValue.toFixed(2));

        const { data: productForProfit } = payload.product_id
          ? await supabase
            .from('products')
            .select('custo_total')
            .eq('id', payload.product_id)
            .single()
          : { data: null as any };

        const cost = Number(productForProfit?.custo_total) || 0;
        payload.lucro = Number((payload.valor_venda - (cost * quantity)).toFixed(2));
      }
    }
  }

  payload.valor_venda = Number(payload.valor_venda) || 0;
  payload.valor_devido = Number(payload.valor_devido) || 0;

  if (!payload.item_nome || !String(payload.item_nome).trim()) {
    payload.item_nome = 'Item sem nome';
  }

  if (!payload.cliente || !String(payload.cliente).trim()) {
    payload.cliente = 'Desconhecido';
  }

  // Do not persist UI-only helper fields in the sales table.
  delete payload.quantidade;
  delete payload.preco_unitario;
  delete payload.cliente_id;

  return sanitizeSalePayloadForDb(payload);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();

    // Sanitize cliente_id: convert empty string to null, validate as integer
    let finalClienteId = json.cliente_id ? Number(json.cliente_id) : null;
    if (finalClienteId && !Number.isInteger(finalClienteId)) {
      finalClienteId = null;
    }

    const enrichedPayload = await enrichSalePayload(supabase, json);
    
    const { data, error } = await supabase
      .from('sales')
      .update({
        ...enrichedPayload,
        cliente_id: finalClienteId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getAdminSupabase();
    
    const { data: sale } = await supabase.from('sales').select('*').eq('id', id).single();
    if (!sale) return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });

    // Move to trash
    await supabase.from('trash').insert([{
      source_store: 'sales',
      source_id: sale.id,
      item_name: `${sale.cliente} - ${sale.item_nome}`,
      payload: sale,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }]);

    const { error } = await supabase.from('sales').delete().eq('id', id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
