/**
 * Sends one image to the `upload-url` endpoint.
 *
 * The request: POST, multipart/form-data with the file in the field `image`,
 * `Accept: application/json`. For a same-origin endpoint the session cookie
 * goes along, plus the CSRF token Laravel hands out — the XSRF-TOKEN cookie
 * (as X-XSRF-TOKEN, the way Axios sends it) and, if the page has one,
 * <meta name="csrf-token"> (as X-CSRF-TOKEN). Neither token is ever sent to
 * another origin.
 *
 * The answer: 201 (or 200) `{ "url": "…" }`; a refusal is
 * `422 { "code": "OE-UPL-…", "params": { … } }`. Everything else is mapped
 * from the HTTP status, because frameworks answer 401 / 413 / 419 / 429
 * themselves, with bodies the editor cannot rely on.
 */
/** What the server checks too; the editor only refuses early to save a pointless upload. */
export declare const ACCEPTED_TYPES: readonly ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export declare class UploadError extends Error {
    readonly code: string;
    readonly params: Record<string, string | number>;
    readonly cause?: unknown;
    constructor(code: string, params?: Record<string, string | number>, cause?: unknown);
}
/** "5 MB", "512 KB" — the same wording the server uses. */
export declare function formatBytes(bytes: number): string;
/** The checks that need no server: type (when the browser knows it) and size. */
export declare function precheck(file: File, maxBytes: number | null): void;
/** Uploads `file` and resolves with the URL of the stored image; rejects with an UploadError. */
export declare function uploadImage(endpoint: string, file: File, options?: {
    maxBytes?: number | null;
    signal?: AbortSignal;
}): Promise<string>;
