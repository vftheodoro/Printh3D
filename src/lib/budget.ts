export interface BudgetState {
  useCase: string;
  width: number;
  height: number;
  depth: number;
  infill: number;
  finish: string;
  detailLevel: string;
  quantity: number;
  urgency: string;
  shapeComplexity: string;
  notes: string;
}

export const USE_CASES: Record<string, any> = {
  decoracao: {
    label: 'Decoração',
    description: 'Perfil recomendado para foco visual e acabamento agradável.',
    multiplier: 0.88,
    recommendation: 'Perfil sugerido: acabamento bonito com resistência moderada.'
  },
  resistente: {
    label: 'Resistente',
    description: 'Perfil recomendado para uso frequente e maior durabilidade.',
    multiplier: 1.06,
    recommendation: 'Perfil sugerido: estrutura mais firme e maior durabilidade.'
  },
  funcional: {
    label: 'Funcional',
    description: 'Perfil equilibrado para peças utilitárias do dia a dia.',
    multiplier: 0.95,
    recommendation: 'Perfil sugerido: equilíbrio entre custo e resistência.'
  },
  detalhado: {
    label: 'Detalhado',
    description: 'Perfil para peças com detalhes finos e acabamento refinado.',
    multiplier: 1.0,
    recommendation: 'Perfil sugerido: mais foco em definição e acabamento.'
  }
};

export const FINISH_MULTIPLIERS: Record<string, number> = {
  Basico: 1.0,
  Liso: 1.08,
  Premium: 1.16
};

export const DETAIL_MULTIPLIERS: Record<string, number> = {
  Economico: 0.88,
  Padrao: 0.95,
  Fino: 1.04
};

export const URGENCY_MULTIPLIERS: Record<string, number> = {
  Normal: 1.0,
  Rapido: 1.08
};

export const SHAPE_MULTIPLIERS: Record<string, number> = {
  Simples: 0.95,
  Media: 1.0,
  Complexa: 1.08
};

export const SHAPE_OCCUPANCY: Record<string, number> = {
  Simples: 0.42,
  Media: 0.31,
  Complexa: 0.24
};

const BASE_FEE = 6.5;
const COST_PER_CM3 = 0.095;

export function calculateEstimate(state: BudgetState) {
  const useCaseData = USE_CASES[state.useCase] || USE_CASES.funcional;

  const geometricVolume = state.width * state.height * state.depth;
  const occupancyFactor = SHAPE_OCCUPANCY[state.shapeComplexity] || SHAPE_OCCUPANCY.Media;
  const infillFactor = 0.11 + ((state.infill / 100) * 0.30);
  const effectiveVolume = geometricVolume * occupancyFactor * infillFactor;

  const finishMult = FINISH_MULTIPLIERS[state.finish] || 1;
  const detailMult = DETAIL_MULTIPLIERS[state.detailLevel] || 1;
  const urgencyMult = URGENCY_MULTIPLIERS[state.urgency] || 1;
  const shapeMult = SHAPE_MULTIPLIERS[state.shapeComplexity] || 1;

  const supportAndPostFactor = state.shapeComplexity === 'Complexa' ? 1.06 : (state.shapeComplexity === 'Media' ? 1.03 : 1);
  const unitPrice = (((effectiveVolume * COST_PER_CM3) * supportAndPostFactor) + BASE_FEE)
    * useCaseData.multiplier * detailMult * shapeMult;
  
  const quantityDiscount = state.quantity > 1
    ? Math.max(0.72, 1 - ((state.quantity - 1) * 0.04))
    : 1;

  const total = unitPrice * state.quantity * quantityDiscount * finishMult * urgencyMult;

  return {
    geometricVolume,
    effectiveVolume,
    estimatedMin: total * 0.90,
    estimatedMax: total * 1.15,
    estimatedMid: (total * 0.90 + total * 1.15) / 2,
    useCaseLabel: useCaseData.label,
    profileDescription: useCaseData.description,
    recommendation: useCaseData.recommendation,
    quantityDiscount
  };
}
