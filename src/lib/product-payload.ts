type ProductPayload = Record<string, unknown>;

const hasOwn = (obj: ProductPayload, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

const toNumberOr = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toIntegerOr = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

export function sanitizeProductPayload(input: ProductPayload, mode: 'create' | 'update' = 'create'): ProductPayload {
  const payload: ProductPayload = { ...input };
  const isCreate = mode === 'create';

  // Remove fields that are not meant to be persisted (read-only, computed, or nested relationships)
  const readOnlyFields = ['id', 'created_at', 'updated_at', 'category', 'product_files'];
  readOnlyFields.forEach(field => {
    delete payload[field];
  });

  if (isCreate || hasOwn(payload, 'resolucao_camada')) {
    payload.resolucao_camada = toNumberOr(payload.resolucao_camada, 0.2);
  }

  if (hasOwn(payload, 'peso_g')) {
    payload.peso_g = toNumberOr(payload.peso_g, 0);
  }

  if (hasOwn(payload, 'tempo_h')) {
    payload.tempo_h = toNumberOr(payload.tempo_h, 0);
  }

  if (hasOwn(payload, 'tempo_min')) {
    payload.tempo_min = toNumberOr(payload.tempo_min, 0);
  }

  if (hasOwn(payload, 'preco_venda')) {
    payload.preco_venda = toNumberOr(payload.preco_venda, 0);
  }

  if (hasOwn(payload, 'preco_promocional')) {
    if (payload.preco_promocional === '' || payload.preco_promocional === null || payload.preco_promocional === undefined) {
      payload.preco_promocional = 0;
    } else {
      payload.preco_promocional = toNumberOr(payload.preco_promocional, 0);
    }
  }

  if (hasOwn(payload, 'custo_total')) {
    payload.custo_total = toNumberOr(payload.custo_total, 0);
  }

  if (hasOwn(payload, 'margem')) {
    payload.margem = toNumberOr(payload.margem, 0);
  }

  if (hasOwn(payload, 'quantidade_estoque')) {
    payload.quantidade_estoque = toIntegerOr(payload.quantidade_estoque, 0);
  }

  if (hasOwn(payload, 'estoque_minimo')) {
    payload.estoque_minimo = toIntegerOr(payload.estoque_minimo, 0);
  }

  if (hasOwn(payload, 'category_id')) {
    if (payload.category_id === '' || payload.category_id === null || payload.category_id === undefined) {
      payload.category_id = null;
    } else {
      const parsed = Number(payload.category_id);
      payload.category_id = Number.isFinite(parsed) ? parsed : null;
    }
  }

  if (hasOwn(payload, 'parent_product_id')) {
    if (payload.parent_product_id === '' || payload.parent_product_id === null || payload.parent_product_id === undefined) {
      payload.parent_product_id = null;
    } else {
      const parsed = Number(payload.parent_product_id);
      payload.parent_product_id = Number.isFinite(parsed) ? parsed : null;
    }
  }

  if (isCreate || hasOwn(payload, 'dimensoes')) {
    const dims = payload.dimensoes || {};
    payload.dimensoes = {
      largura: toNumberOr(dims.largura, 0),
      altura: toNumberOr(dims.altura, 0),
      profundidade: toNumberOr(dims.profundidade, 0),
    };
  }

  if (isCreate || hasOwn(payload, 'custos_adicionais')) {
    const extra = payload.custos_adicionais || {};
    payload.custos_adicionais = {
      material_extra: toNumberOr(extra.material_extra, 0),
    };
  }

  return payload;
}
