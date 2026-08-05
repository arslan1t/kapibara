/**
 * Object storage contract.
 *
 * Two logical buckets, with opposite access rules:
 *
 *   • "private" — child photographs, generated illustrations, and anything else
 *     derived from them. Never publicly readable. Reached only through an
 *     ownership-checked route or a short-lived signed URL.
 *   • "public"  — catalogue artwork an administrator uploads. Safe to serve to
 *     anyone, like anything in /public.
 *
 * Keeping them as named buckets rather than two APIs means a caller has to say
 * which one it means, and a reviewer can see that choice at every call site.
 */
export type Bucket = "private" | "public";

export interface PutResult {
  /** Opaque key. Never contains user input; never a URL. */
  key: string;
}

export interface StoredObject {
  bytes: Buffer;
  contentType: string;
}

export type StorageVerification =
  | { ok: true }
  | { ok: false; error: string };

export interface StorageDriver {
  readonly id: "local" | "s3" | "supabase";

  /**
   * True when the driver has everything it needs to work.
   *
   * This only checks that configuration is *present*. It cannot tell a valid
   * credential from a wrong one — see `verify`.
   */
  isConfigured(): boolean;

  /**
   * Proves the credential actually works, by talking to the provider.
   *
   * `isConfigured` is not enough on its own: pasting a publishable key into
   * SUPABASE_SERVICE_ROLE_KEY satisfies it completely, and then every upload
   * fails with a row-level-security error at the moment a customer submits
   * their child's photograph. That is the worst possible time to find out.
   * The health check calls this so the failure surfaces at deploy instead.
   */
  verify(): Promise<StorageVerification>;

  put(
    bucket: Bucket,
    key: string,
    bytes: Buffer,
    contentType: string
  ): Promise<void>;

  get(bucket: Bucket, key: string): Promise<StoredObject | null>;

  remove(bucket: Bucket, key: string): Promise<void>;

  /**
   * Time-limited URL for a private object.
   *
   * Returns null when the driver cannot mint one (the local filesystem driver),
   * in which case callers fall back to streaming through the authenticated
   * route. Never call this for anything the requester has not been authorised
   * to read — the URL itself carries no further check.
   */
  signedUrl(
    bucket: Bucket,
    key: string,
    expiresInSeconds: number
  ): Promise<string | null>;

  /** Stable public URL for an object in the public bucket. */
  publicUrl(key: string): string;
}
