import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    const payload = {
      ...json,
      data_inicio: json.data_inicio ? new Date(json.data_inicio).toISOString() : null,
      data_fim: json.data_fim ? new Date(json.data_fim).toISOString() : null,
    };

    const { data: promo, error } = await supabase
      .from('promotions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Sync product price
    await supabase
      .from('products')
      .update({ preco_promocional: payload.ativo ? payload.preco_promocional : null })
      .eq('id', payload.product_id);

    return NextResponse.json(promo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getAdminSupabase();
    
    // Get product ID before deleting
    const { data: promo } = await supabase.from('promotions').select('product_id').eq('id', id).single();

    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;

    if (promo) {
       await supabase.from('products').update({ preco_promocional: null }).eq('id', promo.product_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
