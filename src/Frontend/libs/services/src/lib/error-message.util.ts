export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: { description?: string; title?: string; message?: string } } | undefined)?.error;
  return body?.description ?? body?.title ?? body?.message ?? fallback;
}

/**
 * Para requisições com responseType 'blob' (download de arquivo), o corpo do
 * erro HTTP também vem como Blob, não como JSON já parseado — precisa ler
 * o texto do blob primeiro.
 */
export async function extractBlobErrorMessage(err: unknown, fallback: string): Promise<string> {
  const errorBody = (err as { error?: unknown } | undefined)?.error;
  if (errorBody instanceof Blob) {
    try {
      const text = await errorBody.text();
      const parsed = JSON.parse(text);
      return parsed?.description ?? parsed?.title ?? parsed?.message ?? fallback;
    } catch {
      return fallback;
    }
  }
  return extractErrorMessage(err, fallback);
}
