import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    
    // Fetch stats
    const [{ count: productsCount }, { count: categoriesCount }, { count: salesCount }, { count: clientsCount }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('sales').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
    ]);

    // Fetch recent sales
    const { data: recentSales } = await supabase
      .from('sales')
      .select(`
        id, item_nome, cliente, valor_venda, data_venda, tipo_pagamento,
        vendedor:admin_users(nome)
      `)
      .order('data_venda', { ascending: false })
      .limit(5);

    // Sum total sales value
    const { data: salesSum } = await supabase.from('sales').select('valor_venda');
    const totalSalesValue = salesSum?.reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0) || 0;

    return NextResponse.json({
      stats: {
        products: productsCount || 0,
        categories: categoriesCount || 0,
        sales: salesCount || 0,
        clients: clientsCount || 0,
        totalSalesValue
      },
      recentSales: recentSales || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
