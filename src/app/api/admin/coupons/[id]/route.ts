import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    // Check code uniqueness if changing code
    if (json.codigo) {
      const { data: existing } = await supabase.from('coupons').select('id').eq('codigo', json.codigo).single();
      if (existing && existing.id !== parseInt(id)) {
        return NextResponse.json({ error: 'O código do cupom já existe.' }, { status: 400 });
      }
    }

    const payload = {
      ...json,
      ...(json.codigo && { codigo: json.codigo.toUpperCase() }),
      categorias: json.categorias?.length > 0 ? json.categorias : null
    };

    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
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
    
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
