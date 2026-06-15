export const USE_CASES = {
  decoracao: {
    label: "Decoração",
    description: "Foco visual, boa definição e acabamento agradável.",
    multiplier: 0.88,
    recommendation:
      "Perfil sugerido: acabamento bonito com resistência moderada.",
  },
  resistente: {
    label: "Alta resistência",
    description: "Uso frequente e necessidade de maior durabilidade.",
    multiplier: 1.06,
    recommendation:
      "Perfil sugerido: estrutura reforçada e material mais resistente.",
  },
  funcional: {
    label: "Peça funcional",
    description: "Equilíbrio entre custo, acabamento e resistência.",
    multiplier: 0.95,
    recommendation:
      "Perfil sugerido: solução equilibrada para uso cotidiano.",
  },
  detalhado: {
    label: "Alto nível de detalhe",
    description: "Geometrias finas e acabamento visual mais refinado.",
    multiplier: 1,
    recommendation:
      "Perfil sugerido: camadas menores e maior tempo de acabamento.",
  },
} as const;

export type UseCase = keyof typeof USE_CASES;
export type Finish = "Básico" | "Liso" | "Premium";
export type DetailLevel = "Econômico" | "Padrão" | "Fino";
export type Urgency = "Normal" | "Rápido";
export type ShapeComplexity = "Simples" | "Média" | "Complexa";

export interface BudgetState {
  useCase: UseCase;
  width: number;
  height: number;
  depth: number;
  infill: number;
  finish: Finish;
  detailLevel: DetailLevel;
  quantity: number;
  urgency: Urgency;
  shapeComplexity: ShapeComplexity;
  notes: string;
}

const FINISH_MULTIPLIERS: Record<Finish, number> = {
  Básico: 1,
  Liso: 1.08,
  Premium: 1.16,
};

const DETAIL_MULTIPLIERS: Record<DetailLevel, number> = {
  Econômico: 0.88,
  Padrão: 0.95,
  Fino: 1.04,
};

const URGENCY_MULTIPLIERS: Record<Urgency, number> = {
  Normal: 1,
  Rápido: 1.08,
};

const SHAPE_MULTIPLIERS: Record<ShapeComplexity, number> = {
  Simples: 0.95,
  Média: 1,
  Complexa: 1.08,
};

const SHAPE_OCCUPANCY: Record<ShapeComplexity, number> = {
  Simples: 0.42,
  Média: 0.31,
  Complexa: 0.24,
};

const BASE_FEE = 6.5;
const COST_PER_CM3 = 0.095;

export function calculateEstimate(state: BudgetState) {
  const useCaseData = USE_CASES[state.useCase];
  const width = Math.max(0.1, state.width);
  const height = Math.max(0.1, state.height);
  const depth = Math.max(0.1, state.depth);
  const infill = Math.min(100, Math.max(5, state.infill));
  const quantity = Math.max(1, Math.floor(state.quantity));

  const geometricVolume = width * height * depth;
  const occupancyFactor = SHAPE_OCCUPANCY[state.shapeComplexity];
  const infillFactor = 0.11 + (infill / 100) * 0.3;
  const effectiveVolume = geometricVolume * occupancyFactor * infillFactor;
  const supportAndPostFactor =
    state.shapeComplexity === "Complexa"
      ? 1.06
      : state.shapeComplexity === "Média"
        ? 1.03
        : 1;

  const unitPrice =
    (effectiveVolume * COST_PER_CM3 * supportAndPostFactor + BASE_FEE) *
    useCaseData.multiplier *
    DETAIL_MULTIPLIERS[state.detailLevel] *
    SHAPE_MULTIPLIERS[state.shapeComplexity];

  const quantityDiscount =
    quantity > 1 ? Math.max(0.72, 1 - (quantity - 1) * 0.04) : 1;

  const total =
    unitPrice *
    quantity *
    quantityDiscount *
    FINISH_MULTIPLIERS[state.finish] *
    URGENCY_MULTIPLIERS[state.urgency];

  return {
    geometricVolume,
    effectiveVolume,
    estimatedMin: total * 0.9,
    estimatedMax: total * 1.15,
    estimatedMid: total * 1.025,
    useCaseLabel: useCaseData.label,
    profileDescription: useCaseData.description,
    recommendation: useCaseData.recommendation,
    quantityDiscount,
  };
}
