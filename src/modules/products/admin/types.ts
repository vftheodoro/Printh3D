export interface AdminCategory {
  id: number;
  nome: string;
  cor: string;
}

export interface AdminProductFile {
  id: number;
  nome_arquivo: string;
  tipo: string;
  mime_type: string;
  tamanho_bytes: number;
  storage_path: string;
}

export interface AdminProduct {
  id: number;
  codigo_sku: string;
  nome: string;
  category_id?: number | null;
  descricao?: string;
  peso_g?: number;
  tempo_h?: number;
  tempo_min?: number;
  material?: string;
  cor?: string;
  resolucao_camada?: number | string;
  dimensoes?: {
    largura?: number;
    altura?: number;
    profundidade?: number;
  };
  custo_total?: number;
  margem?: number;
  custos_adicionais?: { material_extra?: number };
  custo_detalhado?: Record<string, unknown>;
  descricoes_social?: {
    geral?: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  tags?: string[] | string;
  is_variation?: boolean;
  parent_product_id?: number | null;
  variation_label?: string;
  calculation_mode?: "basic" | "detailed";
  estoque_minimo?: number;
  preco_promocional?: number;
  preco_venda: number;
  quantidade_estoque: number;
  ativo: boolean;
  cover_file_id?: number | null;
  product_files?: AdminProductFile[];
  category?: AdminCategory;
}

export interface ProductFormData {
  nome: string;
  category_id: string | number | null;
  codigo_sku: string | null;
  descricao: string;
  is_variation: boolean;
  parent_product_id: string | number | null;
  variation_label: string;
  peso_g: number;
  tempo_h: number;
  tempo_min: number;
  preco_venda: number;
  preco_promocional: number;
  custo_total: number;
  margem: number;
  calculation_mode: "basic" | "detailed";
  custos_adicionais: { material_extra: number };
  custo_detalhado: Record<string, unknown>;
  descricoes_social: {
    geral: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  dimensoes: {
    largura: number;
    altura: number;
    profundidade: number;
  };
  quantidade_estoque: number;
  estoque_minimo: number;
  ativo: boolean;
  material: string;
  cor: string;
  resolucao_camada: number | string;
  tags: string | string[];
  cover_file_id?: number | null;
}

export interface ProductSettings {
  margem_padrao: number;
  custo_kg: number;
  custo_hora_maquina: number;
  custo_kwh: number;
  consumo_maquina_w: number;
  percentual_falha: number;
  depreciacao_percentual: number;
}
