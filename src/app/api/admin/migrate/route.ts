import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

// Map IndexedDB store names to Supabase tables
const storeToTableMap: Record<string, string> = {
  'categorias': 'categories',
  'produtos': 'products',
  'arquivos_produto': 'product_files',
  'promocoes': 'promotions',
  'cupons': 'coupons',
  'vendas': 'sales',
  'arquivos_venda': 'sale_files',
  'clientes': 'clients',
  'gastos': 'expenses',
  'lixeira': 'trash'
};

export async function POST(request: Request) {
  try {
    const { data } = await request.json(); // Expected format: { data: { storeName: [items], ... } }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Formato de backup inválido.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const results: Record<string, { inserted: number, errors: string[] }> = {};

    // For better referential integrity during import, we process stores in a specific order:
    const orderedStores = ['categorias', 'produtos', 'arquivos_produto', 'promocoes', 'cupons', 'clientes', 'vendas', 'arquivos_venda', 'gastos', 'lixeira'];

    for (const storeName of orderedStores) {
      if (!data[storeName] || !Array.isArray(data[storeName])) continue;
      
      const tableName = storeToTableMap[storeName];
      if (!tableName) continue;

      results[tableName] = { inserted: 0, errors: [] };
      const itemsToInsert = data[storeName];

      if (itemsToInsert.length === 0) continue;

      // Supabase has maximum row limits per batch insert, we split into chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
        const chunk = itemsToInsert.slice(i, i + chunkSize);
        
        // Data cleaning before insert: ensure `id` is respected if possible, 
        // remove functions/unsupported blob data (blobs must be re-uploaded to Storage)
        const cleanChunk = chunk.map((item: any) => {
           const clean = { ...item };
           if (storeName === 'produtos') {
              if (clean.category) { clean.category_id = clean.category; delete clean.category; } // Handle old schema differences if any
           }
           if (clean.blob) delete clean.blob; // Ignore blobs from IndexedDB, they need manual S3 migration
           return clean;
        });

        // Use UPSERT so we don't duplicate existing IDs
        const { error } = await supabase.from(tableName).upsert(cleanChunk, { onConflict: 'id' });
        
        if (error) {
           results[tableName].errors.push(`Erro no chunk ${i}-${i+chunkSize}: ${error.code} - ${error.message}`);
        } else {
           results[tableName].inserted += chunk.length;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
