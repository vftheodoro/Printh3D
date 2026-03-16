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

function resolveLegacyBaseDir() {
  const explicitBase = process.env.LEGACY_BASE_DIR;
  if (explicitBase) return path.resolve(explicitBase);

  const dataDir = process.env.LEGACY_DATA_DIR;
  if (dataDir) return path.resolve(dataDir, '..');

  return path.resolve(process.cwd(), 'printh3d_data');
}

const BASE_DIR = resolveLegacyBaseDir();
const DATA_DIR = process.env.LEGACY_DATA_DIR
  ? path.resolve(process.env.LEGACY_DATA_DIR)
  : path.join(BASE_DIR, 'data');

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Legacy data directory not found: ${DATA_DIR}`);
  console.error('Set LEGACY_BASE_DIR or LEGACY_DATA_DIR before running migration.');
  process.exit(1);
}

async function syncAll() {
  console.log('--- STARTING FINAL CLEAN SYNC ---');
  console.log(`Using legacy base directory: ${BASE_DIR}`);
  console.log(`Using legacy data directory: ${DATA_DIR}`);

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
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'printh3d-files';
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      throw new Error(`Could not list storage buckets: ${bucketsError.message}`);
    }

    if (!buckets?.some((bucket) => bucket.name === bucketName)) {
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, { public: true });
      if (bucketError && !String(bucketError.message || '').toLowerCase().includes('already exists')) {
        throw new Error(`Could not create bucket ${bucketName}: ${bucketError.message}`);
      }
    }

    for (const meta of metaList) {
      try {
        const filePath = path.join(BASE_DIR, meta.relative_path);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath);
          const storagePath = `products/${meta.id}_${meta.nome_arquivo.replace(/\s+/g, '_')}`;
          
          await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileContent, {
              contentType: meta.mime_type || 'application/octet-stream',
              upsert: true
            });

          const publicUrl = supabase.storage.from(bucketName).getPublicUrl(storagePath).data.publicUrl;

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
      } catch (fErr) {
        console.error(`File migration failed for ${meta?.nome_arquivo || 'unknown'}:`, fErr?.message || fErr);
      }
    }
    console.log(`✓ Files migrated`);
  }
}

syncAll();
