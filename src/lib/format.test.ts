import { describe, expect, it } from "vitest";
import {
  cleanProductDescription,
  formatCurrency,
} from "@/lib/format";

describe("format helpers", () => {
  it("formats Brazilian currency", () => {
    expect(formatCurrency(12.5)).toContain("12,50");
  });

  it("removes decorative emoji and preserves readable sections", () => {
    const result = cleanProductDescription(
      "✨ Diferenciais: • Leve • Resistente 📩 Interessou? Chame agora.",
    );

    expect(result).not.toContain("✨");
    expect(result).not.toContain("📩");
    expect(result).toContain("- Leve");
    expect(result).toContain("Interessou?");
  });
});
