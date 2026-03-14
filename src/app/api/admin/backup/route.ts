import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

const tablesToExport = [
  'settings',
  'admin_users',
  'categories',
  'products',
  'product_files',
  'promotions',
  'coupons',
  'sales',
  'sale_files',
  'clients',
  'expenses',
  'trash'
];

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const backupData: Record<string, any[]> = {};

    for (const table of tablesToExport) {
       const { data, error } = await supabase.from(table).select('*');
       if (error) throw new Error(`Erro ao exportar tabela ${table}: ${error.message}`);
       backupData[table] = data || [];
    }

    const payload = JSON.stringify({
      version: '2.0.0', // Supabase SQL schema version
      timestamp: new Date().toISOString(),
      data: backupData
    });

    // Return as a downloadable JSON file
    return new NextResponse(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="printh3d_backup_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
