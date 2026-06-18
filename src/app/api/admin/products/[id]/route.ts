import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { sanitizeProductPayload } from '@/lib/product-payload';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const productId = parseId((await params).id);
    if (!productId) {
      return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(nome, cor), product_files(*)')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar produto.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const productId = parseId((await params).id);
    if (!productId) {
      return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
    }

    const payload = sanitizeProductPayload(await request.json(), 'update');
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('products')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar produto.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const productId = parseId((await params).id);
    if (!productId) {
      return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { error } = await supabase.rpc('admin_delete_record_to_trash', {
      p_source_store: 'products',
      p_source_id: productId,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao excluir produto.' },
      { status: 500 },
    );
  }
}
