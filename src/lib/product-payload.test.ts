import { describe, expect, it } from "vitest";
import { sanitizeProductPayload } from "@/lib/product-payload";

describe("sanitizeProductPayload", () => {
  it("removes read-only fields and normalizes dimensions", () => {
    const result = sanitizeProductPayload({
      id: 42,
      nome: "Suporte",
      dimensoes: {
        largura: "12.5",
        altura: "8",
        profundidade: "3.2",
      },
      product_files: [{ id: 1 }],
    });

    expect(result.id).toBeUndefined();
    expect(result.product_files).toBeUndefined();
    expect(result.dimensoes).toEqual({
      largura: 12.5,
      altura: 8,
      profundidade: 3.2,
    });
  });

  it("normalizes nullable relationships and stock integers", () => {
    const result = sanitizeProductPayload({
      category_id: "",
      parent_product_id: "17",
      quantidade_estoque: "8.9",
      estoque_minimo: "2",
    });

    expect(result.category_id).toBeNull();
    expect(result.parent_product_id).toBe(17);
    expect(result.quantidade_estoque).toBe(8);
    expect(result.estoque_minimo).toBe(2);
  });
});
