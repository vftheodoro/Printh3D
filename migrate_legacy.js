const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment');
  console.log('Use: node --env-file=.env.local migrate_legacy.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BASE_DIR = path.resolve(process.env.LEGACY_BASE_DIR || path.join(process.cwd(), 'printh3d_data'));
const DATA_DIR = path.resolve(process.env.LEGACY_DATA_DIR || path.join(BASE_DIR, 'data'));

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Legacy data directory not found: ${DATA_DIR}`);
  console.log('Set LEGACY_BASE_DIR or LEGACY_DATA_DIR and try again.');
  process.exit(1);
}

async function migrate() {
  console.log('Starting migration...');
  console.log(`Using legacy base directory: ${BASE_DIR}`);
  console.log(`Using legacy data directory: ${DATA_DIR}`);

  // 1. Categories
  console.log('Migrating categories...');
  const categories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf8'));
  const { error: catErr } = await supabase.from('categories').upsert(categories, { onConflict: 'id' });
  if (catErr) console.error('Category error:', catErr);

  // 2. Products
  console.log('Migrating products...');
  const products = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8'));
  const { error: prodErr } = await supabase.from('products').upsert(products, { onConflict: 'id' });
  if (prodErr) console.error('Product error:', prodErr);

  // 3. Settings
  console.log('Migrating settings...');
  const settings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf8'));
  const { error: setErr } = await supabase.from('settings').upsert(settings, { onConflict: 'id' });
  if (setErr) console.error('Settings error:', setErr);

  // 4. File Uploads (Storage)
  console.log('Migrating files to storage...');
  const filesMeta = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'product_files_meta.json'), 'utf8'));
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'printh3d-files';
  
  // Create bucket if not exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Could not list storage buckets:', bucketsError.message);
    process.exit(1);
  }

  if (!buckets?.some((bucket) => bucket.name === bucketName)) {
    const { error: bucketError } = await supabase.storage.createBucket(bucketName, { public: true });
    if (bucketError && !String(bucketError.message || '').toLowerCase().includes('already exists')) {
      console.error('Could not create storage bucket:', bucketError.message);
      process.exit(1);
    }
  }

  for (const meta of filesMeta) {
    const fileName = path.basename(meta.relative_path || 'arquivo');
    const filePath = path.join(BASE_DIR, meta.relative_path || '');
    
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(`products/${fileName}`, fileBuffer, {
          contentType: meta.mime_type || 'application/octet-stream',
          upsert: true
        });

      if (uploadErr) {
        console.error(`Error uploading ${fileName}:`, uploadErr);
        continue;
      }

      // 5. Product Files Table
      const publicUrl = supabase.storage.from(bucketName).getPublicUrl(`products/${fileName}`).data.publicUrl;
      const { error: metaErr } = await supabase.from('product_files').upsert({
        id: meta.id,
        product_id: meta.product_id,
        nome_arquivo: meta.nome_arquivo,
        tipo: meta.tipo,
        mime_type: meta.mime_type,
        tamanho_bytes: meta.tamanho_bytes,
        storage_path: publicUrl,
        created_at: meta.created_at
      }, { onConflict: 'id' });

      if (metaErr) console.error(`Error saving meta for ${fileName}:`, metaErr);
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }

  // 6. Set Cover Images for Products
  console.log('Setting cover images...');
  await supabase.from('products').update({ cover_file_id: 1 }).eq('id', 1);
  await supabase.from('products').update({ cover_file_id: 6 }).eq('id', 2);

  console.log('Migration completed successfully!');
}

migrate();
