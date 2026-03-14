const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BASE_DIR = 'C:/Users/fatec-dsm1/Desktop/Printh3D_Site/printh3d_data/printh3d_data';
const DATA_DIR = path.join(BASE_DIR, 'data');

async function syncAll() {
  console.log('--- STARTING FINAL CLEAN SYNC ---');

  const stores = [
    { file: 'categories.json', table: 'categories' },
    { file: 'products.json', table: 'products' },
    { file: 'clients.json', table: 'clients' },
    { file: 'expenses.json', table: 'expenses' },
    { file: 'sales.json', table: 'sales' }
  ];

  for (const store of stores) {
    try {
      console.log(`Migrating ${store.table}...`);
      const filePath = path.join(DATA_DIR, store.file);
      if (!fs.existsSync(filePath)) continue;
      
      const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const cleanItems = items.map(item => {
        const clean = { ...item };
        
        delete clean.updated_at; 
        
        if (store.table === 'products') {
          delete clean.slicer_config;
          // Populate descricao from social description if empty
          if (!clean.descricao && clean.descricoes_social) {
            clean.descricao = clean.descricoes_social.geral || clean.descricoes_social.instagram || '';
          }
        }
        
        if (store.table === 'sales') {
          if (clean.client_id) clean.cliente_id = clean.client_id;
          delete clean.client_id;
          if (clean.cidade_entrega) clean.cidade = clean.cidade_entrega;
          delete clean.cidade_entrega;
          if (clean.canal_venda) clean.canal = clean.canal_venda;
          delete clean.canal_venda;
          
          const allowedFields = ['id', 'product_id', 'vendedor_id', 'item_nome', 'cliente', 'cliente_id', 'canal', 'cidade', 'valor_venda', 'valor_devido', 'lucro', 'desconto_percentual', 'cupom_id', 'tipo_pagamento', 'parcelas', 'data_venda', 'observacoes', 'created_at'];
          Object.keys(clean).forEach(key => {
            if (!allowedFields.includes(key)) delete clean[key];
          });
          
          clean.item_nome = clean.item_nome || 'Item sem nome';
          clean.cliente = clean.cliente || 'Desconhecido';
        }

        return clean;
      });

      const { error } = await supabase.from(store.table).upsert(cleanItems, { onConflict: 'id' });
      if (error) console.error(`Error in ${store.table}:`, error.message);
      else console.log(`✓ ${store.table} migrated (${items.length} items)`);
    } catch (e) {
      console.error(`Unexpected crash in ${store.table}:`, e);
    }
  }

  // File Migration
  console.log('Migrating product files...');
  const metaPath = path.join(DATA_DIR, 'product_files_meta.json');
  if (fs.existsSync(metaPath)) {
    const metaList = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    await supabase.storage.createBucket('printh3d-files', { public: true });

    for (const meta of metaList) {
      try {
        const filePath = path.join(BASE_DIR, meta.relative_path);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath);
          const storagePath = `products/${meta.id}_${meta.nome_arquivo.replace(/\s+/g, '_')}`;
          
          await supabase.storage
            .from('printh3d-files')
            .upload(storagePath, fileContent, {
              contentType: meta.mime_type || 'application/octet-stream',
              upsert: true
            });

          const publicUrl = supabase.storage.from('printh3d-files').getPublicUrl(storagePath).data.publicUrl;

          await supabase.from('product_files').upsert({
            id: meta.id,
            product_id: meta.product_id,
            nome_arquivo: meta.nome_arquivo,
            tipo: meta.tipo,
            mime_type: meta.mime_type,
            tamanho_bytes: meta.tamanho_bytes,
            storage_path: publicUrl,
            created_at: meta.created_at
          }, { onConflict: 'id' });
        }
      } catch (fErr) {}
    }
    console.log(`✓ Files migrated`);
  }
}

syncAll();
