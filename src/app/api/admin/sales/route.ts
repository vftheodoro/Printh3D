import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

function normalizeName(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function insertClientSafely(supabase: ReturnType<typeof getAdminSupabase>, input: any) {
  const payload = { ...input };
  delete payload.id;

  const firstTry = await supabase.from('clients').insert([payload]).select('id').single();
  if (!firstTry.error) {
    return firstTry;
  }

  const isDuplicatePk = firstTry.error.code === '23505' || firstTry.error.message?.includes('clients_pkey');
  if (!isDuplicatePk) {
    return firstTry;
  }

  const { data: lastClient, error: maxErr } = await supabase
    .from('clients')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) {
    return { data: null, error: maxErr };
  }

  const safeId = (Number(lastClient?.id) || 0) + 1;
  return supabase
    .from('clients')
    .insert([{ ...payload, id: safeId }])
    .select('id')
    .single();
}

async function insertSaleSafely(supabase: ReturnType<typeof getAdminSupabase>, input: any) {
  const payload = { ...input };
  delete payload.id;

  const firstTry = await supabase.from('sales').insert([payload]).select().single();
  if (!firstTry.error) {
    return firstTry;
  }

  const isDuplicatePk = firstTry.error.code === '23505' || firstTry.error.message?.includes('sales_pkey');
  if (!isDuplicatePk) {
    return firstTry;
  }

  const { data: lastSale, error: maxErr } = await supabase
    .from('sales')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) {
    return { data: null, error: maxErr };
  }

  const safeId = (Number(lastSale?.id) || 0) + 1;
  return supabase
    .from('sales')
    .insert([{ ...payload, id: safeId }])
    .select()
    .single();
}

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

async function findExistingClientId(supabase: ReturnType<typeof getAdminSupabase>, rawName: string) {
  const name = String(rawName || '').trim();
  if (!name) return null;

  const normalizedInput = normalizeName(name);

  const { data: candidates, error } = await supabase
    .from('clients')
    .select('id, nome')
    .ilike('nome', `%${name}%`)
    .limit(20);

  if (error || !candidates || candidates.length === 0) {
    return null;
  }

  const scored = candidates
    .map((client) => {
      const normalizedClient = normalizeName(client.nome);
      let score = 0;
      if (normalizedClient === normalizedInput) score += 100;
      if (normalizedClient.startsWith(normalizedInput)) score += 40;
      if (normalizedClient.includes(normalizedInput)) score += 20;
      return { id: client.id, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 40) {
    return null;
  }

  const hasTie = scored.length > 1 && scored[1].score === best.score;
  return hasTie ? null : best.id;
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const statusParams = searchParams.get('status');

    const supabase = getAdminSupabase();
    let query = supabase.from('sales').select(`
      *,
      vendedor:admin_users(nome)
    `).order('data_venda', { ascending: false });

    if (search) {
      query = query.or(`cliente.ilike.%${search}%,item_nome.ilike.%${search}%`);
    }

    if (statusParams === 'pending') {
      query = query.gt('valor_devido', 0);
    } else if (statusParams === 'paid') {
      query = query.lte('valor_devido', 0);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();

    // Sanitize cliente_id: convert empty string to null, validate as integer
    let finalClienteId = json.cliente_id ? Number(json.cliente_id) : null;
    if (finalClienteId && !Number.isInteger(finalClienteId)) {
      finalClienteId = null;
    }

    // Auto-find or auto-create client if not explicitly linked
    if (!finalClienteId && json.cliente) {
      const existingClientId = await findExistingClientId(supabase, json.cliente);
      
      if (existingClientId) {
        finalClienteId = existingClientId;
      } else {
        const { data: newClient } = await insertClientSafely(supabase, { nome: json.cliente });
        if (newClient) finalClienteId = newClient.id;
      }
    }

    const enrichedPayload = await enrichSalePayload(supabase, json);

    const { data, error } = await insertSaleSafely(supabase, {
      ...enrichedPayload,
      cliente_id: finalClienteId,
      data_venda: enrichedPayload.data_venda || new Date().toISOString()
    });

    if (error) throw error;

    if (enrichedPayload.cupom_id) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, usos_atuais')
        .eq('id', enrichedPayload.cupom_id)
        .single();

      if (coupon) {
        await supabase
          .from('coupons')
          .update({ usos_atuais: (Number(coupon.usos_atuais) || 0) + 1 })
          .eq('id', coupon.id);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
