import "server-only";

import type { ClickCallback } from "./click";

/**
 * Reads a Click callback out of a request.
 *
 * Click sends form-encoded bodies, but has been known to send JSON on some
 * integrations, so both are accepted. Every value is kept as the string it
 * arrived as: the signature is computed over the raw text, and a number that
 * has been through `Number()` and back no longer matches ("1000.00" becomes
 * "1000").
 */
export async function readClickCallback(request: Request): Promise<ClickCallback> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(json).map(([key, value]) => [key, String(value ?? "")])
      ) as unknown as ClickCallback;
    } catch {
      return {} as ClickCallback;
    }
  }

  const form = await request.formData();
  const entries: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    entries[key] = typeof value === "string" ? value : "";
  }
  return entries as unknown as ClickCallback;
}
