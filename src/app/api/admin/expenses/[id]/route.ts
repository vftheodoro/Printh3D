import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const expenseId = parseId((await params).id);
    if (!expenseId) {
      return NextResponse.json({ error: 'Gasto inválido.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('expenses')
      .update(await request.json())
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar gasto.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const expenseId = parseId((await params).id);
    if (!expenseId) {
      return NextResponse.json({ error: 'Gasto inválido.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { error } = await supabase.rpc('admin_delete_record_to_trash', {
      p_source_store: 'expenses',
      p_source_id: expenseId,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao excluir gasto.' },
      { status: 500 },
    );
  }
}
