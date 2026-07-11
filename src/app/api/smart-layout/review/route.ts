import { NextResponse } from "next/server";
import { geminiApiKeys, geminiGenerateContent } from "@/lib/gemini-request";
import type { SmartLayoutRequestPhoto, SmartLayoutReviewPayload } from "@/lib/smart-layout";
import type { SmartLayoutReviewPreview } from "@/lib/smart-layout-review";
import type { TemplateId } from "@/lib/types";

type RequestBody = {
  photos: SmartLayoutRequestPhoto[];
  previews: SmartLayoutReviewPreview[];
  templateId: TemplateId;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    approved: { type: "boolean" },
    photoOrder: { type: "array", items: { type: "integer" } },
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
    whyChanged: { type: "string" },
  },
  required: ["approved"],
};

export async function POST(req: Request) {
  if (geminiApiKeys().length === 0) {
    return NextResponse.json({ error: "Smart layout is not configured" }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!Array.isArray(body.photos) || !Array.isArray(body.previews) || body.previews.length === 0) {
    return NextResponse.json({ error: "Missing review images" }, { status: 400 });
  }
  if (body.photos.length > 25 || body.previews.length > 25) {
    return NextResponse.json({ error: "Too many review images" }, { status: 400 });
  }

  const placement = body.previews
    .map((preview) => `Final slide ${preview.slideIndex + 1}: ${preview.placement}`)
    .join("\n");
  const prompt = `You are doing one final visual QA pass on a completed Instagram carousel using template "${body.templateId}".

First come ${body.photos.length} original-photo thumbnails in index order. Then come ${body.previews.length} rendered final-slide previews in carousel order.

${placement}

Approve unless there is a clear, meaningful composition problem: an important subject used as an unreadable background, a weak/detail image occupying the dominant foreground, a face or key object visibly clipped, confusing repetition, or story flow that is clearly worse than an available swap.
Do not change a good layout for taste alone. Preserve variety and chronology. For soft-focus, the sharp framed image is the foreground and the blurred image is supporting context.

Return JSON only. If good, return {"approved":true}. If correction is clearly needed, return approved false, a COMPLETE photoOrder containing every original photo index exactly once, optional crops only for visibly clipped subjects, and a short viewer-friendly whyChanged. Crop ranges: offsetX/offsetY -200..200, scale 0.25..2.`;

  const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [{ text: prompt }];
  for (const photo of body.photos) {
    parts.push({ inline_data: { mime_type: "image/jpeg", data: photo.thumbnailBase64 } });
  }
  for (const preview of body.previews) {
    parts.push({ inline_data: { mime_type: "image/jpeg", data: preview.thumbnailBase64 } });
  }

  const gemini = await geminiGenerateContent("gemini-2.5-flash", {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.15,
    },
  });
  if (!gemini.ok) return NextResponse.json({ error: "Final review unavailable" }, { status: 502 });

  const json = gemini.json as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Empty final review" }, { status: 502 });
  try {
    return NextResponse.json(JSON.parse(text) as SmartLayoutReviewPayload);
  } catch {
    return NextResponse.json({ error: "Invalid final review" }, { status: 502 });
  }
}
