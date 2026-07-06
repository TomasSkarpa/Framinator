const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function geminiApiKeys(): string[] {
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_FALLBACK].filter(
    (key): key is string => !!key && key.length > 0,
  );
}

function isRateLimited(status: number, detail: string): boolean {
  if (status === 429) return true;
  const lower = detail.toLowerCase();
  return (
    status === 403 &&
    (lower.includes("quota") ||
      lower.includes("rate") ||
      lower.includes("resource_exhausted") ||
      lower.includes("resource exhausted"))
  );
}

export async function geminiGenerateContent(
  model: string,
  requestBody: object,
): Promise<{ ok: true; json: unknown } | { ok: false; status: number; detail: string }> {
  const keys = geminiApiKeys();
  if (keys.length === 0) {
    return { ok: false, status: 503, detail: "missing GEMINI_API_KEY" };
  }

  let lastDetail = "";
  let lastStatus = 502;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const res = await fetch(
      `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );

    if (res.ok) {
      return { ok: true, json: await res.json() };
    }

    const detail = await res.text();
    lastDetail = detail;
    lastStatus = res.status;

    const hasFallback = i < keys.length - 1;
    if (hasFallback && isRateLimited(res.status, detail)) {
      continue;
    }

    return { ok: false, status: res.status, detail };
  }

  return { ok: false, status: lastStatus, detail: lastDetail };
}
