export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const statusCode = (err as { statusCode?: number }).statusCode;
  return statusCode === 429 || /quota/i.test(err.message);
}
