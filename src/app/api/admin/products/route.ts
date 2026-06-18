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
    const insertPayload = sanitizeProductPayload(json, 'create');
    const supabase = getAdminSupabase();

    // Check SKU uniqueness
    if (insertPayload.codigo_sku) {
      const { data: existingSku } = await supabase.from('products').select('id').eq('codigo_sku', insertPayload.codigo_sku).single();
      if (existingSku) return NextResponse.json({ error: 'SKU já existe.' }, { status: 400 });
    }

    const { data: category } = await supabase.from('categories').select('prefixo').eq('id', insertPayload.category_id).single();
    
    // Generate collision-resistant SKUs without relying on count/max queries.
    let finalSku = insertPayload.codigo_sku;
    if (!finalSku && category) {
      finalSku = `${category.prefixo}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    } else if (!finalSku) {
      finalSku = `PRD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    }

    const baseInsertPayload = {
      ...insertPayload,
      codigo_sku: finalSku,
      dimensoes: insertPayload.dimensoes || {
        largura: 0,
        altura: 0,
        profundidade: 0,
      },
      custo_detalhado: insertPayload.custo_detalhado || {},
      custos_adicionais: insertPayload.custos_adicionais || {}
    };

    const { data, error } = await supabase
      .from('products')
      .insert([baseInsertPayload])
      .select()
      .single();

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
