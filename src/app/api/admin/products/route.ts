import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { sanitizeProductPayload } from '@/lib/product-payload';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');

    const supabase = getAdminSupabase();
    let query = supabase.from('products').select(`
      *,
      category:categories(nome, cor),
      product_files(id, storage_path, tipo)
    `).order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (search) {
      query = query.or(`nome.ilike.%${search}%,codigo_sku.ilike.%${search}%`);
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
    const payload = sanitizeProductPayload(json, 'create');
    const { id: _ignoredId, created_at: _ignoredCreatedAt, updated_at: _ignoredUpdatedAt, ...insertPayload } = payload;
    const supabase = getAdminSupabase();

    // Check SKU uniqueness
    if (insertPayload.codigo_sku) {
      const { data: existingSku } = await supabase.from('products').select('id').eq('codigo_sku', insertPayload.codigo_sku).single();
      if (existingSku) return NextResponse.json({ error: 'SKU já existe.' }, { status: 400 });
    }

    const { data: category } = await supabase.from('categories').select('prefixo').eq('id', insertPayload.category_id).single();
    
    // Auto-generate SKU if omitted
    let finalSku = insertPayload.codigo_sku;
    if (!finalSku && category) {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', insertPayload.category_id);
      const nextNum = (count || 0) + 1;
      finalSku = `${category.prefixo}-${nextNum.toString().padStart(4, '0')}`;
    } else if (!finalSku) {
      finalSku = `PRD-${Date.now().toString().slice(-6)}`;
    }

    const baseInsertPayload = {
      ...insertPayload,
      codigo_sku: finalSku,
      dimensoes: insertPayload.dimensoes || {x:0, y:0, z:0},
      custo_detalhado: insertPayload.custo_detalhado || {},
      custos_adicionais: insertPayload.custos_adicionais || {}
    };

    let { data, error } = await supabase
      .from('products')
      .insert([baseInsertPayload])
      .select()
      .single();

    const isPrimaryKeyCollision = error?.code === '23505' && (error?.message || '').includes('products_pkey');
    if (isPrimaryKeyCollision) {
      const { data: lastRow } = await supabase
        .from('products')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      const fallbackId = Number(lastRow?.id || 0) + 1;
      ({ data, error } = await supabase
        .from('products')
        .insert([{ ...baseInsertPayload, id: fallbackId }])
        .select()
        .single());
    }

    if (error) {
      console.error('POST /api/admin/products failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST /api/admin/products exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
