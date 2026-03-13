export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  material: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  colors: string[];
  finishes: string[];
}

export const PRODUCTS: Product[] = [
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

export function getAllProducts() {
  return PRODUCTS;
}

export function getProductById(id: string) {
  return PRODUCTS.find(p => p.id === id);
}

export function getCategories() {
  return Array.from(new Set(PRODUCTS.map(p => p.category)));
}

export function filterProducts(query: string, category: string) {
  return PRODUCTS.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || 
                        p.shortDesc.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || p.category === category;
    return matchesQuery && matchesCategory;
  });
}
