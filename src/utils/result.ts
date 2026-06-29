import type { ToolImageResult, ToolTextResult } from "../types.js";

export function textResult(value: unknown): ToolTextResult {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text }] };
}

export function imageResult(args: {
  text: string;
  dataUri: string;
  mimeType?: string;
}): ToolImageResult {
  const [mimePart, data] = args.dataUri.startsWith("data:")
    ? args.dataUri.slice("data:".length).split(",", 2)
    : ["image/png;base64", args.dataUri];
  const mimeType = args.mimeType ?? mimePart.split(";")[0] ?? "image/png";
  return {
    content: [
      { type: "text", text: args.text },
      { type: "image", data, mimeType }
    ]
  };
}

export function ok(data: unknown): ToolTextResult {
  return textResult({ ok: true, ...asObject(data) });
}

export function fail(message: string, extra?: Record<string, unknown>): ToolTextResult {
  return textResult({ ok: false, message, ...(extra ?? {}) });
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { data: value };
}
