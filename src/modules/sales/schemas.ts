import { z } from "zod";

const optionalPositiveId = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

export const saleInputSchema = z.object({
  cliente: z.string().trim().min(1, "Informe o cliente.").max(160),
  cliente_id: optionalPositiveId,
  item_nome: z.string().trim().min(1, "Informe o item vendido.").max(240),
  product_id: optionalPositiveId,
  cupom_id: optionalPositiveId,
  valor_venda: z.coerce.number().min(0).default(0),
  valor_devido: z.coerce.number().min(0).default(0),
  tipo_pagamento: z.string().trim().min(1).max(80).default("PIX"),
  parcelas: z.coerce.number().int().min(1).max(120).default(1),
  data_venda: z.string().datetime({ offset: true }).or(z.string().min(10)),
  observacoes: z.string().trim().max(2_000).nullable().optional(),
  quantidade: z.coerce.number().int().min(1).max(10_000).default(1),
  preco_unitario: z.coerce.number().min(0).default(0),
  custo_unitario: z.coerce.number().min(0).default(0),
});

export type SaleInput = z.infer<typeof saleInputSchema>;
