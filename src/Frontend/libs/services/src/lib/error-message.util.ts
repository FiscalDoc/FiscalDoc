export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: { description?: string; title?: string } } | undefined)?.error;
  return body?.description ?? body?.title ?? fallback;
}
