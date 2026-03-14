const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/fatec-dsm1/Desktop/Printh3D_Site/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(nome), product_files(storage_path)')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Result:', JSON.stringify(data, null, 2));
  }
}

checkData();
