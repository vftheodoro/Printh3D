import { formatCurrency } from "@/lib/format";
import type { BudgetState } from "@/lib/budget";

const PHONE_NUMBER = '5513997553465';

export function getWhatsAppLink(message: string) {
  return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function productMessage({ name, price, material, color, finish }: {
  name: string;
  price: number;
  material: string;
  color?: string;
  finish?: string;
}) {
  let msg = `Olá! Tenho interesse no produto:\n`;
  msg += `*${name}*\n\n`;
  msg += `Preço: ${formatCurrency(price)}\n`;
  msg += `Material: ${material}\n`;
  if (color) msg += `Cor: ${color}\n`;
  if (finish) msg += `Acabamento: ${finish}\n`;
  msg += `\nGostaria de comprar.`;
  return msg;
}

interface BudgetMessageData extends BudgetState {
  useCaseLabel: string;
  estimatedMin: number;
  estimatedMax: number;
}

export function budgetMessage(data: BudgetMessageData) {
  const {
    useCaseLabel,
    width,
    height,
    depth,
    infill,
    finish,
    detailLevel,
    quantity,
    urgency,
    shapeComplexity,
    notes,
    estimatedMin,
    estimatedMax
  } = data;

  let msg = `Olá! Gostaria de solicitar um orçamento:\n\n`;
  msg += `*Orçamento simplificado (estimativa inicial)*\n\n`;
  msg += `Objetivo da peça: ${useCaseLabel}\n`;
  msg += `Dimensões (cm): ${width} x ${height} x ${depth}\n`;
  msg += `Preenchimento interno: ${infill}%\n`;
  msg += `Acabamento: ${finish}\n`;
  msg += `Nível de detalhe: ${detailLevel}\n`;
  msg += `Complexidade da forma: ${shapeComplexity}\n`;
  msg += `Quantidade: ${quantity}\n`;
  msg += `Prazo: ${urgency}\n`;
  if (notes) msg += `Observações: ${notes}\n`;
  msg += `\n*Faixa estimada: ${formatCurrency(estimatedMin)} até ${formatCurrency(estimatedMax)}*\n`;
  msg += `Esta é uma estimativa inicial. O valor final depende da análise do arquivo e da geometria real.\n`;
  msg += `\nAguardo confirmação do valor final. Obrigado!`;
  return msg;
}

export function contactMessage() {
  return `Olá! Vim pelo site Printh3D e gostaria de mais informações.`;
}
