import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    const { data, error } = await supabase
      .from('sales')
      .update(json)
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
