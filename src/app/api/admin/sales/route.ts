import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const statusParams = searchParams.get('status');

    const supabase = getAdminSupabase();
    let query = supabase.from('sales').select(`
      *,
      vendedor:admin_users(nome)
    `).order('data_venda', { ascending: false });

    if (search) {
      query = query.or(`cliente.ilike.%${search}%,item_nome.ilike.%${search}%`);
    }

    if (statusParams === 'pending') {
      query = query.gt('valor_devido', 0);
    } else if (statusParams === 'paid') {
      query = query.lte('valor_devido', 0);
    }

    const { data, error } = await query;
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

    // Handle Client Auto-creation if cliente is typed manually
    let finalClienteId = json.cliente_id;
    if (!finalClienteId && json.cliente) {
      const { data: existingClient } = await supabase.from('clients')
        .select('id').ilike('nome', json.cliente).single();
      
      if (existingClient) {
        finalClienteId = existingClient.id;
      } else {
        const { data: newClient } = await supabase.from('clients')
          .insert([{ nome: json.cliente }]).select('id').single();
        if (newClient) finalClienteId = newClient.id;
      }
    }

    const { data, error } = await supabase.from('sales').insert([{
      ...json,
      cliente_id: finalClienteId || null,
      data_venda: json.data_venda || new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
