export function maskMobile(value: unknown): string | undefined {
  const text = asNonEmptyString(value);
  if (!text) return undefined;
  if (text.length < 7) return "*".repeat(text.length);
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

export function maskCardId(value: unknown): string | undefined {
  const text = asNonEmptyString(value);
  if (!text) return undefined;
  if (text.length <= 8) return `${text.slice(0, 1)}***${text.slice(-1)}`;
  return `${text.slice(0, 4)}********${text.slice(-4)}`;
}

export function maskName(value: unknown): string | undefined {
  const text = asNonEmptyString(value);
  if (!text) return undefined;
  if (text.length <= 1) return text;
  return `${text[0]}${"*".repeat(Math.max(1, text.length - 1))}`;
}

export function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

export function redactObject<T>(input: T): T {
  if (!input || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map((item) => redactObject(item)) as T;

  const sensitive = new Set([
    "accessToken",
    "access-token",
    "token",
    "password",
    "cardId",
    "papersNum",
    "mobile",
    "userPhone",
    "validateCode",
    "captchaCode"
  ]);

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (sensitive.has(key)) {
      output[key] = "***";
    } else {
      output[key] = redactObject(value);
    }
  }
  return output as T;
}
