import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const payment = searchParams.get('payment');
    const month = searchParams.get('month'); // YYYY-MM format

    const supabase = getAdminSupabase();
    let query = supabase.from('expenses').select('*').order('data_gasto', { ascending: false });

    if (category) query = query.eq('categoria', category);
    if (payment) query = query.eq('tipo_pagamento', payment);
    
    // Manual date filtering for month
    if (month) {
      const year = parseInt(month.split('-')[0]);
      const m = parseInt(month.split('-')[1]);
      const startDate = new Date(year, m - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, m, 0).toISOString().split('T')[0];
      
      query = query.gte('data_gasto', startDate).lte('data_gasto', endDate);
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

    const { data, error } = await supabase.from('expenses').insert([{
      ...json,
      data_gasto: json.data_gasto || new Date().toISOString().split('T')[0]
    }]).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
