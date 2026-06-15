export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function cleanProductDescription(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, " ")
    .replace(/\s*•\s*/g, "\n- ")
    .replace(
      /\s+(?=(?:Modelos disponíveis|Preço:|Diferenciais:|Perfeito para:|Interessou\?|Imagens meramente))/gi,
      "\n\n",
    )
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n +/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
