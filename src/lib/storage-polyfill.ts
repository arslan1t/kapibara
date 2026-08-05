/**
 * Polyfill for environments where localStorage exists but doesn't have
 * proper methods (e.g., certain server-side environments or test runners).
 * This runs before any storage access and ensures localStorage behaves correctly.
 */

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};

if (typeof globalThis !== "undefined") {
  const ls = (globalThis as Record<string, unknown>)["localStorage"];
  if (ls !== undefined && typeof (ls as Record<string, unknown>)["getItem"] !== "function") {
    (globalThis as Record<string, unknown>)["localStorage"] = noopStorage;
  }
}
