import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

// GET all items in trash
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    
    // Auto purge expired items first
    await supabase.from('trash').delete().lt('expires_at', new Date().toISOString());

    const { data, error } = await supabase
      .from('trash')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// RESTORE item from trash
export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const supabase = getAdminSupabase();

    // 1. Get trash item
    const { data: trashItem, error: fetchErr } = await supabase.from('trash').select('*').eq('id', id).single();
    if (fetchErr || !trashItem) throw new Error('Item não encontrado na lixeira.');

    const { source_store, payload } = trashItem;

    // 2. Insert back into original table
    const { error: insertErr } = await supabase.from(source_store).insert([payload]);
    if (insertErr) throw new Error(`Falha ao restaurar: ${insertErr.message}`);

    // 3. Remove from trash
    await supabase.from('trash').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
