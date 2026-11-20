export function databaseTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "DATABASE_URL missing";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return "DATABASE_URL unparseable";
  }
}

export function describeError(error: unknown, depth = 0): Record<string, unknown> {
  if (depth > 5) return { truncated: true };
  if (error instanceof Error) {
    const extra = error as Error & {
      code?: unknown;
      detail?: unknown;
      hint?: unknown;
      severity?: unknown;
      routine?: unknown;
    };
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: extra.code,
      detail: extra.detail,
      hint: extra.hint,
      severity: extra.severity,
      routine: extra.routine,
      cause: error.cause === undefined ? undefined : describeError(error.cause, depth + 1),
    };
  }
  if (error && typeof error === "object") {
    return { value: JSON.stringify(error) };
  }
  return { value: String(error) };
}

export function errorChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  let depth = 0;
  while (current != null && depth < 5) {
    if (current instanceof Error) {
      const code =
        "code" in current && current.code != null && current.code !== ""
          ? ` [${String(current.code)}]`
          : "";
      parts.push(`${current.name}: ${current.message}${code}`);
      current = current.cause;
      depth += 1;
      continue;
    }
    parts.push(String(current));
    break;
  }
  return parts.join(" ← ");
}
