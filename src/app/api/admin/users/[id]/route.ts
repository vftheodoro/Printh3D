import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const supabase = getAdminSupabase();
    
    // Check unique email
    if (json.email) {
      const { data: existing } = await supabase.from('admin_users').select('id').eq('email', json.email).single();
      if (existing && existing.id !== parseInt(id)) {
        return NextResponse.json({ error: 'E-mail já está em uso.' }, { status: 400 });
      }
    }

    const payload: any = {
      nome: json.nome,
      email: json.email,
      tipo: json.tipo
    };

    if (json.senha) {
       const salt = await bcrypt.genSalt(10);
       payload.senha_hash = await bcrypt.hash(json.senha, salt);
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(payload)
      .eq('id', id)
      .select('id, nome, email, tipo')
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
    
    // Prevent deleting ID 1 (Root Admin)
    if (id === '1') {
      return NextResponse.json({ error: 'O usuário principal (Admin Root) não pode ser excluído.' }, { status: 403 });
    }

    // Check if user is tied to sales
    const { count } = await supabase.from('sales').select('id', { count: 'exact', head: true }).eq('vendedor_id', id);
    if (count && count > 0) {
      return NextResponse.json({ error: `Não é possível excluir. O usuário possui ${count} venda(s) associada(s). Altere o vendedor das vendas primeiro.` }, { status: 400 });
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
