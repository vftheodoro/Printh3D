export function getApiErrorMessage(
  payload: unknown,
  fallback = "Não foi possível concluir a operação.",
) {
  if (!payload || typeof payload !== "object") return fallback;

  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}

export function getUnknownErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação.",
) {
  return error instanceof Error && error.message ? error.message : fallback;
}
