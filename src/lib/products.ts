import { supabase } from './supabase';

export interface Product {
  id: string; // SKU or DB id as string
  name: string;
  category: string;
  price: number;
  promotional_price?: number;
  material: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  colors: string[];
  finishes: string[];
}

/**
 * Mappings for categories to match frontend iconography/colors
 */
const CATEGORY_STYLES: Record<string, { icon: string, color: string }> = {
  colecionaveis: { icon: "sparkles", color: "#A855F7" },
  decoracao: { icon: "home", color: "#10B981" },
  industrial: { icon: "settings", color: "#3B82F6" },
  utilitarios: { icon: "wrench", color: "#F59E0B" },
  geral: { icon: "box", color: "#64748B" }
};

// Helper to convert DB product to Frontend Product interface
function mapDbProductToFrontend(dbProd: any): Product {
  let defaultImage = "/assets/imagens/design_screen.png";
  if (dbProd.product_files && dbProd.product_files.length > 0) {
    defaultImage = dbProd.product_files[0].storage_path;
  }

  const categoryName = dbProd.categories?.nome?.toLowerCase() || 'geral';

  return {
    id: dbProd.codigo_sku || dbProd.id.toString(),
    name: dbProd.nome,
    category: categoryName,
    price: dbProd.preco_venda || 0,
    promotional_price: dbProd.preco_promocional,
    material: dbProd.material || 'PLA',
    image: defaultImage,
    shortDesc: dbProd.descricao ? (dbProd.descricao.substring(0, 80) + '...') : (dbProd.nome + ' em impressão 3D'),
    fullDesc: dbProd.descricao || 'Detalhes do produto não informados.',
    colors: dbProd.cor ? dbProd.cor.split(',').map((c:string) => c.trim()) : ["Padrão"],
    finishes: ["Natural"]
  };
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(nome), product_files(storage_path)')
      .eq('ativo', true)
      .order('id', { ascending: false });

    if (error) {
       console.error('Database Error:', error.message);
       return [];
    }

    if (!data || data.length === 0) {
       return [];
    }

    return data.map(mapDbProductToFrontend);
  } catch (err) {
    console.error('Error in getAllProducts:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const isNumeric = /^\d+$/.test(id);
    let query = supabase.from('products').select('*, categories(nome), product_files(storage_path)').eq('ativo', true);
    
    if (isNumeric) query = query.eq('id', parseInt(id));
    else query = query.eq('codigo_sku', id);

    const { data, error } = await query.single();

    if (error || !data) {
       return undefined;
    }
    return mapDbProductToFrontend(data);

  } catch (err) {
    return undefined;
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const { data } = await supabase.from('categories').select('nome');
    if (data && data.length > 0) {
       return data.map(c => c.nome.toLowerCase());
    }
    return [];
  } catch (err) {
    return [];
  }
}
