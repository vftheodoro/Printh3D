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

export const FALLBACK_PRODUCTS: Product[] = [
  // COLECIONÁVEIS / GEEK
  {
    id: "action-figure-hero",
    name: "Action Figure Herói Premium",
    category: "colecionaveis",
    price: 185.00,
    material: "Resina 4K / PLA",
    image: "/assets/imagens/finished_showcase.png",
    shortDesc: "Miniatura detalhada com alta resolução para colecionadores.",
    fullDesc: "Action figure produzida com resina de alta precisão ou PLA de alta qualidade. Ideal para fãs de jogos e filmes. Cada peça passa por um rigoroso processo de remoção de suportes e conferência de detalhes.",
    colors: ["Cinza Base", "Prime Branco", "Pintura Custom"],
    finishes: ["Fosco", "Verniz Brilhante", "Premium (Pintado)"]
  },
  {
    id: "suporte-controle-gamer",
    name: "Suporte de Controle Gamer",
    category: "colecionaveis",
    price: 45.00,
    material: "PLA Reforçado",
    image: "/assets/imagens/design_screen.png",
    shortDesc: "Organize seu setup com estilo e segurança.",
    fullDesc: "Suporte universal compatível com controles de PS5, Xbox e Nintendo Switch. Design ergonômico que evita riscos e mantém seu ambiente gamer organizado.",
    colors: ["Preto Carbono", "Azul Neon", "Azul Printh3D"],
    finishes: ["Natural", "Texturizado"]
  },
  {
    id: "mascara-cosplay",
    name: "Máscara Cosplay Full Build",
    category: "colecionaveis",
    price: 250.00,
    material: "PETG / PLA",
    image: "/assets/imagens/finished_showcase.png",
    shortDesc: "Réplica escala 1:1 para eventos e decoração.",
    fullDesc: "Máscara em tamanho real, leve e resistente. Pode ser enviada como impressão bruta para seu acabamento ou com nossa pintura automotiva profissional.",
    colors: ["Cinza Metálico", "Ouro", "Preto Brilhante"],
    finishes: ["Bruto", "Lixado", "Automotivo"]
  },

  // CASA E DECORAÇÃO
  {
    id: "vaso-geometrico-v1",
    name: "Vaso Geométrico Minimalista",
    category: "decoracao",
    price: 55.00,
    material: "PLA Biodegradável",
    image: "/assets/imagens/printing_detail.png",
    shortDesc: "Design moderno para plantas e decoração de interiores.",
    fullDesc: "Vaso com formas geométricas complexas impossíveis de produzir por métodos tradicionais. Adiciona um toque futurista a qualquer ambiente.",
    colors: ["Branco Neve", "Mármore", "Cobre Metalizado"],
    finishes: ["Fosco Satin", "Natural"]
  },
  {
    id: "luminaria-lithophane",
    name: "Luminária Lithophane Custom",
    category: "decoracao",
    price: 120.00,
    material: "PLA Branco Especial",
    image: "/assets/imagens/materials_hero.png",
    shortDesc: "Sua foto revelada através da luz.",
    fullDesc: "A técnica de Lithophane utiliza variações na espessura da impressão para criar imagens fotorealistas quando iluminadas por trás. Um presente único e emocionante.",
    colors: ["Branco Translúcido"],
    finishes: ["Natural"]
  },
  {
    id: "organizador-desk",
    name: "Organizador de Mesa Modular",
    category: "decoracao",
    price: 35.00,
    material: "PLA Plus",
    image: "/assets/imagens/design_screen.png",
    shortDesc: "Mantenha sua mesa de trabalho impecável.",
    fullDesc: "Conjunto de módulos para canetas, cartões e clips. Sistema de encaixe inteligente para você montar conforme sua necessidade.",
    colors: ["Cinza Espacial", "Preto", "Laranja"],
    finishes: ["Natural"]
  },

  // INDUSTRIAL / UTILITÁRIOS
  {
    id: "engrenagem-nylon",
    name: "Peças Técnicas e Engrenagens",
    category: "industrial",
    price: 75.00,
    material: "Nylon / PETG Carbono",
    image: "/assets/imagens/abs_industrial.png",
    shortDesc: "Peças mecânicas com precisão dimensional e alta resistência.",
    fullDesc: "Substituição de peças industriais ou protótipos funcionais. Impressão otimizada para suportar torque e atrito térmico.",
    colors: ["Preto Industrial", "Branco Natural"],
    finishes: ["Técnico (Baixa Tolerância)"]
  },
  {
    id: "gabarito-marcenaria",
    name: "Gabarito de Precisão",
    category: "utilitarios",
    price: 25.00,
    material: "ABS / PETG",
    image: "/assets/imagens/printer_farm.png",
    shortDesc: "Ferramenta auxiliar para furações e cortes.",
    fullDesc: "Ferramenta robusta para uso em oficina. Design ergonômico que facilita o trabalho de precisão em marcenaria e metalurgia.",
    colors: ["Amarelo Segurança", "Vermelho"],
    finishes: ["Natural"]
  },
  {
    id: "suporte-parede-bike",
    name: "Gancho de Parede Reforçado",
    category: "utilitarios",
    price: 40.00,
    material: "PLA de Alta Densidade",
    image: "/assets/imagens/abs_industrial.png",
    shortDesc: "Suporte discreto e ultra-resistente.",
    fullDesc: "Testado para suportar até 15kg. Fixação segura para bicicletas, ferramentas pesadas ou equipamentos esportivos.",
    colors: ["Preto", "Cinza Calçada"],
    finishes: ["Natural"]
  }
];

// Helper to convert DB product to Frontend Product interface
function mapDbProductToFrontend(dbProd: any): Product {
  // Try to find a primary image from product_files or fallback
  let defaultImage = "/assets/imagens/design_screen.png";
  if (dbProd.product_files && dbProd.product_files.length > 0) {
    // Assuming storage_path is the public URL or relative path
    defaultImage = dbProd.product_files[0].storage_path;
  }

  return {
    id: dbProd.codigo_sku || dbProd.id.toString(),
    name: dbProd.nome,
    category: dbProd.categories?.nome?.toLowerCase() || 'geral',
    price: dbProd.preco_venda || 0,
    promotional_price: dbProd.preco_promocional,
    material: dbProd.material || 'PLA',
    image: defaultImage,
    shortDesc: dbProd.descricao?.substring(0, 80) + '...' || 'Produto de impressão 3D',
    fullDesc: dbProd.descricao || 'Detalhes do produto não informados.',
    colors: dbProd.cor ? dbProd.cor.split(',').map((c:string) => c.trim()) : ["Padrão"],
    finishes: ["Natural"]
  };
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    // Fetch only active products
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(nome), product_files(storage_path)')
      .eq('ativo', true)
      .order('id', { ascending: false });

    if (error || !data || data.length === 0) {
       console.warn('Could not fetch from Supabase, returning FALLBACK', error?.message);
       return FALLBACK_PRODUCTS;
    }

    return data.map(mapDbProductToFrontend);
  } catch (err) {
    console.error('Error in getAllProducts:', err);
    return FALLBACK_PRODUCTS;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    // Check if ID is likely a numeric ID or a string SKU
    const isNumeric = /^\d+$/.test(id);
    let query = supabase.from('products').select('*, categories(nome), product_files(storage_path)').eq('ativo', true);
    
    if (isNumeric) query = query.eq('id', parseInt(id));
    else query = query.eq('codigo_sku', id);

    const { data, error } = await query.single();

    if (error || !data) {
       // Fallback search
       return FALLBACK_PRODUCTS.find(p => p.id === id);
    }
    return mapDbProductToFrontend(data);

  } catch (err) {
    return FALLBACK_PRODUCTS.find(p => p.id === id);
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const { data } = await supabase.from('categories').select('nome');
    if (data && data.length > 0) {
       return data.map(c => c.nome.toLowerCase());
    }
    return Array.from(new Set(FALLBACK_PRODUCTS.map(p => p.category)));
  } catch (err) {
    return Array.from(new Set(FALLBACK_PRODUCTS.map(p => p.category)));
  }
}
