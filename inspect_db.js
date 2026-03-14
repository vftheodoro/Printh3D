const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data: files } = await supabase.from('product_files').select('*').limit(5);
  console.log('Files:', JSON.stringify(files, null, 2));
  
  const { data: products } = await supabase.from('products').select('id, nome, descricao, cover_file_id').limit(5);
  console.log('Products:', JSON.stringify(products, null, 2));
}

inspect();
