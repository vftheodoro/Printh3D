import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    const { data, error } = await supabase
      .from('expenses')
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
    
    const { data: exp } = await supabase.from('expenses').select('*').eq('id', id).single();
    if (!exp) return NextResponse.json({ error: 'Gasto não encontrado.' }, { status: 404 });

    // Move to trash
    await supabase.from('trash').insert([{
      source_store: 'expenses',
      source_id: exp.id,
      item_name: `Gasto: ${exp.descricao}`,
      payload: exp,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }]);

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
