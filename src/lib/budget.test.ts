import { describe, expect, it } from "vitest";
import { calculateEstimate, type BudgetState } from "@/lib/budget";

const baseBudget: BudgetState = {
  useCase: "funcional",
  width: 10,
  height: 8,
  depth: 4,
  infill: 20,
  finish: "Básico",
  detailLevel: "Padrão",
  quantity: 1,
  urgency: "Normal",
  shapeComplexity: "Média",
  notes: "",
};

describe("calculateEstimate", () => {
  it("returns an ordered preliminary range", () => {
    const result = calculateEstimate(baseBudget);

    expect(result.geometricVolume).toBe(320);
    expect(result.estimatedMin).toBeGreaterThan(0);
    expect(result.estimatedMax).toBeGreaterThan(result.estimatedMin);
    expect(result.estimatedMid).toBeGreaterThan(result.estimatedMin);
    expect(result.estimatedMid).toBeLessThan(result.estimatedMax);
  });

  it("increases the estimate for urgency and premium finishing", () => {
    const standard = calculateEstimate(baseBudget);
    const premium = calculateEstimate({
      ...baseBudget,
      finish: "Premium",
      urgency: "Rápido",
    });

    expect(premium.estimatedMid).toBeGreaterThan(standard.estimatedMid);
  });

  it("applies a bounded quantity discount", () => {
    const result = calculateEstimate({ ...baseBudget, quantity: 100 });
    expect(result.quantityDiscount).toBe(0.72);
  });

  it("clamps invalid dimensions and quantity to safe minimums", () => {
    const result = calculateEstimate({
      ...baseBudget,
      width: 0,
      height: -5,
      depth: 0,
      quantity: 0,
    });

    expect(result.geometricVolume).toBeCloseTo(0.001);
    expect(result.estimatedMin).toBeGreaterThan(0);
  });
});
