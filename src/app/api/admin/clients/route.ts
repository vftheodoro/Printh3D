import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const supabase = getAdminSupabase();
    let query = supabase.from('clients').select(`
      *,
      sales(count, valor_venda, valor_devido)
    `).order('created_at', { ascending: false });

    if (search) {
      query = query.or(`nome.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }

    const { data: clients, error } = await query;
    if (error) throw error;
    
    // Transform data to inject computed fields (total spent, debt)
    const processed = clients.map(client => {
      const sales = client.sales || [];
      const stats = sales.reduce((acc: any, curr: any) => ({
        purchases: acc.purchases + 1,
        total_spent: acc.total_spent + Number(curr.valor_venda || 0),
        total_debt: acc.total_debt + Number(curr.valor_devido || 0)
      }), { purchases: 0, total_spent: 0, total_debt: 0 });

      // Clean up sales relation from output
      const { sales: _, ...rest } = client;
      return { ...rest, ...stats };
    });

    return NextResponse.json(processed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();

    const { data, error } = await supabase.from('clients').insert([json]).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
