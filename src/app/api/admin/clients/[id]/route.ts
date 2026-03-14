import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...json,
        updated_at: new Date().toISOString()
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
    
    // Check if client has sales
    const { count } = await supabase.from('sales').select('id', { count: 'exact', head: true }).eq('cliente_id', id);
    if (count && count > 0) {
      return NextResponse.json({ error: `Não é possível excluir. O cliente possui ${count} venda(s) associada(s). Exclua as vendas primeiro ou edite o nome do cliente na venda.` }, { status: 400 });
    }

    const { error } = await supabase.from('clients').delete().eq('id', id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
