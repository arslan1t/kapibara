/**
 * Contract for the illustration provider.
 *
 * Kept deliberately small so the job runner below never depends on one
 * vendor's request shape. Everything vendor-specific lives in the adapter.
 */

export interface GenerateRequest {
  /** Private storage key of the source photograph, never a public URL. */
  photoKey: string;
  childName: string;
  /** Which book the illustrations belong to. */
  productSlug: string;
  /** Pages to produce artwork for. */
  pageNumbers: number[];
  /**
   * Which cover the book uses. Decides the reference image; anything other than
   * "girl" falls back to the boy cover, matching the catalogue.
   */
  childGender?: string | null;
}

export interface GeneratedImage {
  pageNumber: number;
  /** Raw bytes. Saved to private storage by the caller, never proxied live. */
  data: Buffer;
  contentType: string;
  width?: number;
  height?: number;
}

export type GenerationOutcome =
  | { status: "succeeded"; images: GeneratedImage[]; providerJobId?: string }
  /** Accepted but not finished — the provider works asynchronously. */
  | { status: "processing"; providerJobId: string }
  /** Terminal, and never retried: repeating it would be cancelled again. */
  | { status: "cancelled"; error: string }
  | { status: "failed"; error: string; retryable: boolean };

export interface GenerationClient {
  readonly id: "nano_banana";
  isConfigured(): boolean;
  /** Submits a job. May return finished images or an id to poll. */
  generate(request: GenerateRequest): Promise<GenerationOutcome>;
  /** Polls an asynchronous job. */
  checkJob(providerJobId: string): Promise<GenerationOutcome>;
}
