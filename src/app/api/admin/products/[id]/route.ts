import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(nome, cor), product_files(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    const { data, error } = await supabase
      .from('products')
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
    
    // Soft delete to Trash can be fully implemented later (Phase 4 final steps)
    // For now, hard delete the product (CASCADE will delete product_files and file references)
    const { data: product } = await supabase.from('products').select('*').eq('id', id).single();
    if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

    // Move to trash
    await supabase.from('trash').insert([{
      source_store: 'products',
      source_id: product.id,
      item_name: product.nome,
      payload: product,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }]);

    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
