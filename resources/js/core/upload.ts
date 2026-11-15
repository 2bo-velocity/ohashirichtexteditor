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
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;

export class UploadError extends Error {
  constructor(
    readonly code: string,
    readonly params: Record<string, string | number> = {},
    override readonly cause?: unknown,
  ) {
    super(`[${code}] Image upload failed.`);
    this.name = 'UploadError';
  }
}

/** "5 MB", "512 KB" — the same wording the server uses. */
export function formatBytes(bytes: number): string {
  const trim = (n: number) => String(Math.floor(n * 10) / 10);
  if (bytes >= 1024 * 1024) return `${trim(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${trim(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** The checks that need no server: type (when the browser knows it) and size. */
export function precheck(file: File, maxBytes: number | null): void {
  if (file.type && !(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new UploadError('OE-UPL-4002');
  }
  if (maxBytes !== null && file.size > maxBytes) {
    throw new UploadError('OE-UPL-4001', { max: formatBytes(maxBytes) });
  }
}

function sameOrigin(endpoint: URL): boolean {
  return endpoint.origin === location.origin;
}

function csrfHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const cookie = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
  if (cookie) {
    try {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
    } catch {
      // A malformed cookie is not ours to fix; the server will answer 419.
    }
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  if (meta) headers['X-CSRF-TOKEN'] = meta;
  return headers;
}

/** Whether an image URL from the server may go into `src`: http(s) or relative. */
function isUsableUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.trim() === '') return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.replace(/[\u0000- \u007f-\u009f]/g, ''));
  return !scheme || ['http', 'https'].includes(scheme[1]!.toLowerCase());
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function errorForStatus(status: number, maxBytes: number | null): UploadError {
  if (status === 413) return new UploadError('OE-UPL-4001', maxBytes === null ? {} : { max: formatBytes(maxBytes) });
  if (status === 401 || status === 403 || status === 419) return new UploadError('OE-UPL-4004');
  if (status === 429) return new UploadError('OE-UPL-4007');
  if (status >= 500) return new UploadError('OE-UPL-4005');
  return new UploadError('OE-UPL-4900');
}

/** Uploads `file` and resolves with the URL of the stored image; rejects with an UploadError. */
export async function uploadImage(
  endpoint: string,
  file: File,
  options: { maxBytes?: number | null; signal?: AbortSignal } = {},
): Promise<string> {
  const maxBytes = options.maxBytes ?? null;
  precheck(file, maxBytes);

  const url = new URL(endpoint, document.baseURI);
  const body = new FormData();
  body.append('image', file, file.name || 'image');
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (sameOrigin(url)) Object.assign(headers, csrfHeaders());

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', body, headers, credentials: 'same-origin', signal: options.signal });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === 'AbortError') throw error;
    throw new UploadError('OE-UPL-4003', {}, error);
  }

  if (response.status === 200 || response.status === 201) {
    const json = await readJson(response);
    if (json && isUsableUrl(json.url)) return json.url;
    throw new UploadError('OE-UPL-4900', {}, response);
  }
  if (response.status === 422) {
    const json = await readJson(response);
    const code = typeof json?.code === 'string' && /^OE-UPL-\d{4}$/.test(json.code) ? json.code : 'OE-UPL-4900';
    const params: Record<string, string | number> = {};
    if (json?.params && typeof json.params === 'object') {
      for (const [key, value] of Object.entries(json.params as Record<string, unknown>)) {
        if (typeof value === 'string' || typeof value === 'number') params[key] = value;
      }
    }
    throw new UploadError(code, params, response);
  }
  const error = errorForStatus(response.status, maxBytes);
  throw new UploadError(error.code, error.params, response);
}
