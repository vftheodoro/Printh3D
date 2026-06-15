export interface AdminSale {
  id: number;
  data_venda: string;
  cliente_id?: number | null;
  cliente: string;
  item_nome: string;
  product_id?: number | null;
  cupom_id?: number | null;
  desconto_percentual?: number;
  valor_venda: number;
  valor_devido: number;
  tipo_pagamento: string;
  parcelas?: number;
  vendedor?: { nome: string };
  observacoes: string;
}

export interface ProductOption {
  id: number;
  nome: string;
  preco_venda: number;
  custo_total?: number;
}

export interface CouponOption {
  id: number;
  codigo: string;
  tipo_desconto: "percentual" | "fixo";
  valor_desconto: number;
  ativo: boolean;
  data_validade?: string | null;
}

export interface ClientOption {
  id: number;
  nome: string;
  whatsapp?: string;
  email?: string;
}

export interface CategoryOption {
  id: number;
  nome: string;
}

export interface SaleFormData {
  cliente: string;
  cliente_id: string | number;
  item_nome: string;
  product_id: string | number;
  cupom_id: string | number;
  categoria_nome: string;
  desconto_percentual: number;
  valor_venda: number;
  valor_devido: number;
  custo_unitario: number;
  tipo_pagamento: string;
  parcelas: number;
  quantidade: number;
  preco_unitario: number;
  observacoes: string;
  data_venda: string;
}
