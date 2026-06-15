import { describe, expect, it } from "vitest";
import { saleInputSchema } from "@/modules/sales/schemas";

describe("saleInputSchema", () => {
  it("coerces numeric form values and accepts an optional coupon", () => {
    const result = saleInputSchema.parse({
      cliente: "Maria Silva",
      item_nome: "Suporte personalizado",
      product_id: "12",
      cupom_id: "",
      valor_venda: "89.90",
      valor_devido: "0",
      tipo_pagamento: "PIX",
      parcelas: "1",
      data_venda: "2026-06-14T12:00:00-03:00",
      quantidade: "2",
      preco_unitario: "44.95",
      custo_unitario: "18.20",
    });

    expect(result.product_id).toBe(12);
    expect(result.cupom_id).toBeUndefined();
    expect(result.valor_venda).toBe(89.9);
    expect(result.quantidade).toBe(2);
  });

  it("rejects negative debt and empty customers", () => {
    const result = saleInputSchema.safeParse({
      cliente: "",
      item_nome: "Peça",
      valor_venda: 10,
      valor_devido: -1,
      tipo_pagamento: "PIX",
      parcelas: 1,
      data_venda: "2026-06-14T12:00:00-03:00",
      quantidade: 1,
      preco_unitario: 10,
      custo_unitario: 4,
    });

    expect(result.success).toBe(false);
  });
});
