import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    // NEVER select senha_hash for security
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, nome, email, tipo')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();

    // Check unique email
    const { data: existing } = await supabase.from('admin_users').select('id').eq('email', json.email).single();
    if (existing) return NextResponse.json({ error: 'E-mail já está em uso.' }, { status: 400 });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(json.senha, salt);

    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        nome: json.nome,
        email: json.email,
        senha_hash: hashedPassword,
        tipo: json.tipo || 'VENDEDOR'
      }])
      .select('id, nome, email, tipo')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
