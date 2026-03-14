import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

// GET all coupons
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new coupon
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();

    // Check code uniqueness
    const { data: existing } = await supabase.from('coupons').select('id').eq('codigo', json.codigo).single();
    if (existing) return NextResponse.json({ error: 'O código do cupom já existe.' }, { status: 400 });

    const payload = {
      ...json,
      codigo: json.codigo.toUpperCase(),
      data_validade: json.data_validade || null,
      categorias: json.categorias?.length > 0 ? json.categorias : null
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
