import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

// GET all active/inactive promotions joined with product data
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    
    // Join with products to get product name & base price
    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        product:products(nome, preco_venda)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new promotion
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();

    // Ensure date formats are correct or null
    const payload = {
      ...json,
      data_inicio: json.data_inicio ? new Date(json.data_inicio).toISOString() : null,
      data_fim: json.data_fim ? new Date(json.data_fim).toISOString() : null,
    };

    // Transaction-like: Create promotion, then update product's preco_promocional
    const { data: promo, error: promoErr } = await supabase
      .from('promotions')
      .insert([payload])
      .select()
      .single();

    if (promoErr) throw promoErr;

    if (payload.ativo) {
      const { error: prodErr } = await supabase
        .from('products')
        .update({ preco_promocional: payload.preco_promocional })
        .eq('id', payload.product_id);
      if (prodErr) throw prodErr;
    }

    return NextResponse.json(promo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
