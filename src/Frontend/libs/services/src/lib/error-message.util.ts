export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: { description?: string; title?: string; message?: string } } | undefined)?.error;
  return body?.description ?? body?.title ?? body?.message ?? fallback;
}

/**
 * Extrai erros por campo de uma resposta de erro da API, para destacar os
 * inputs correspondentes no formulário. Suporta dois formatos:
 * - `{ errors: { campo: string[] } }` — validação de FluentValidation / model binding.
 * - `{ code: "VALIDATION_CAMPO", description }` — falha de regra de negócio (ResultError).
 */
export function extractFieldErrors(err: unknown): Record<string, string> | null {
  const body = (err as { error?: { code?: string; description?: string; errors?: Record<string, string[]> } } | undefined)?.error;
  if (!body) return null;

  if (body.errors && Object.keys(body.errors).length > 0) {
    const result: Record<string, string> = {};
    for (const [field, messages] of Object.entries(body.errors)) {
      if (messages?.length) result[field] = messages[0];
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  const match = body.code?.match(/^VALIDATION_(.+)$/);
  if (match && body.description) {
    return { [match[1].toLowerCase()]: body.description };
  }

  return null;
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
