import { NextResponse } from "next/server";
import { geminiApiKeys, geminiGenerateContent } from "@/lib/gemini-request";
import { normalizeFilter } from "@/lib/filters";
import { buildSmartLayoutPrompt, type SmartLayoutApiPayload } from "@/lib/smart-layout";
import { normalizeTemplateId } from "@/lib/templates";
import type { AspectRatio } from "@/lib/constants";
import type { TemplateId } from "@/lib/types";

type RequestBody = {
  photos: { id: string; name: string; thumbnailBase64: string }[];
  templateId: TemplateId | null;
  slideRoles: string[];
  aspectRatio?: AspectRatio;
};

const GEMINI_MODEL = "gemini-2.5-flash";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    photoOrder: { type: "array", items: { type: "integer" } },
    slideOrder: { type: "array", items: { type: "integer" } },
    crops: {
      type: "array",
      items: {
        type: "object",
        properties: {
          photoIndex: { type: "integer" },
          offsetX: { type: "number" },
          offsetY: { type: "number" },
          scale: { type: "number" },
        },
        required: ["photoIndex", "offsetX", "offsetY", "scale"],
      },
    },
    templateId: { type: "string" },
    filter: { type: "string" },
    postDescription: { type: "string" },
    whyArranged: { type: "string" },
  },
  required: ["photoOrder", "postDescription", "whyArranged"],
};

export async function POST(req: Request) {
  if (geminiApiKeys().length === 0) {
    return NextResponse.json(
      { error: "Smart layout is not configured (missing GEMINI_API_KEY)" },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.photos) || body.photos.length < 2) {
    return NextResponse.json({ error: "At least 2 photos required" }, { status: 400 });
  }
  if (body.photos.length > 25) {
    return NextResponse.json({ error: "Too many photos" }, { status: 400 });
  }

  const templateId = body.templateId ? normalizeTemplateId(body.templateId) : null;
  const aspectRatio: AspectRatio = body.aspectRatio === "1:1" ? "1:1" : "4:5";
  const indexedPhotos = body.photos.map((p, index) => ({ index, name: p.name }));
  const prompt = buildSmartLayoutPrompt(indexedPhotos, templateId, body.slideRoles ?? [], aspectRatio);

  const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [
    { text: prompt },
  ];
  for (const photo of body.photos) {
    parts.push({ inline_data: { mime_type: "image/jpeg", data: photo.thumbnailBase64 } });
  }

  const gemini = await geminiGenerateContent(GEMINI_MODEL, {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4,
    },
  });

  if (!gemini.ok) {
    const rateLimited = gemini.status === 429;
    return NextResponse.json(
      {
        error: rateLimited
          ? "AI rate limit reached on all keys. Try again in a minute."
          : "Gemini request failed",
        detail: gemini.detail.slice(0, 200),
      },
      { status: rateLimited ? 429 : 502 },
    );
  }

  const geminiJson = gemini.json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
  }

  let payload: SmartLayoutApiPayload;
  try {
    payload = JSON.parse(text) as SmartLayoutApiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON from Gemini" }, { status: 502 });
  }

  if (!Array.isArray(payload.photoOrder)) {
    return NextResponse.json({ error: "Missing photoOrder in response" }, { status: 502 });
  }

  if (payload.templateId) {
    const normalized = normalizeTemplateId(payload.templateId);
    payload.templateId = normalized ?? undefined;
  }
  if (payload.filter) {
    payload.filter = normalizeFilter(payload.filter);
  }

  return NextResponse.json(payload);
}
