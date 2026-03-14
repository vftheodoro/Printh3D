import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');

    const supabase = getAdminSupabase();
    let query = supabase.from('products').select(`
      *,
      category:categories(nome, cor),
      cover_file:product_files!cover_file_id(storage_path)
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
    const supabase = getAdminSupabase();

    // Check SKU uniqueness
    if (json.codigo_sku) {
      const { data: existingSku } = await supabase.from('products').select('id').eq('codigo_sku', json.codigo_sku).single();
      if (existingSku) return NextResponse.json({ error: 'SKU já existe.' }, { status: 400 });
    }

    const { data: category } = await supabase.from('categories').select('prefixo').eq('id', json.category_id).single();
    
    // Auto-generate SKU if omitted
    let finalSku = json.codigo_sku;
    if (!finalSku && category) {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', json.category_id);
      const nextNum = (count || 0) + 1;
      finalSku = `${category.prefixo}-${nextNum.toString().padStart(4, '0')}`;
    } else if (!finalSku) {
      finalSku = `PRD-${Date.now().toString().slice(-6)}`;
    }

    const { data, error } = await supabase.from('products').insert([{
      ...json,
      codigo_sku: finalSku,
      dimensoes: json.dimensoes || {x:0, y:0, z:0},
      custo_detalhado: json.custo_detalhado || {},
      custos_adicionais: json.custos_adicionais || {}
    }]).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
