import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OhashiEditorElement, TAG_NAME, type OhashiEditorErrorDetail } from '../../resources/js/index';
import { UploadError, formatBytes, uploadImage } from '../../resources/js/core/upload';
import { errorMessage, resolveMessages } from '../../resources/js/core/i18n';

const png = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'shot.png', { type: 'image/png' });

function respond(status: number, body?: unknown) {
  const fetch = vi.fn(async () =>
    new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

async function failure(promise: Promise<unknown>): Promise<UploadError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof UploadError) return error;
    throw error;
  }
  throw new Error('expected the upload to fail');
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('uploadImage', () => {
  it('posts the file as multipart "image" and returns the URL', async () => {
    const fetch = respond(201, { url: '/storage/ohashi-editor/abc.png' });
    expect(await uploadImage('/upload', png())).toBe('/storage/ohashi-editor/abc.png');

    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.pathname).toBe('/upload');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('same-origin');
    expect((init.body as FormData).get('image')).toBeInstanceOf(File);
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
  });

  it('sends Laravel\'s CSRF tokens to its own origin only', async () => {
    document.cookie = 'XSRF-TOKEN=abc%3D%3D';
    document.head.innerHTML = '<meta name="csrf-token" content="meta-token">';

    let fetch = respond(201, { url: '/a.png' });
    await uploadImage('/upload', png());
    let headers = (fetch.mock.calls[0] as unknown as [URL, RequestInit])[1].headers as Record<string, string>;
    expect(headers['X-XSRF-TOKEN']).toBe('abc==');
    expect(headers['X-CSRF-TOKEN']).toBe('meta-token');

    fetch = respond(201, { url: 'https://cdn.example/a.png' });
    await uploadImage('https://uploads.example/upload', png());
    headers = (fetch.mock.calls[0] as unknown as [URL, RequestInit])[1].headers as Record<string, string>;
    expect(headers['X-XSRF-TOKEN']).toBeUndefined();
    expect(headers['X-CSRF-TOKEN']).toBeUndefined();
  });

  it('refuses unusable URLs in the answer', async () => {
    respond(201, { url: 'javascript:alert(1)' });
    expect((await failure(uploadImage('/upload', png()))).code).toBe('OE-UPL-4900');
    respond(201, {});
    expect((await failure(uploadImage('/upload', png()))).code).toBe('OE-UPL-4900');
  });

  it('takes the code and params of a 422 from the server', async () => {
    respond(422, { code: 'OE-UPL-4001', params: { max: '5 MB', evil: { nested: true } } });
    const e = await failure(uploadImage('/upload', png()));
    expect(e.code).toBe('OE-UPL-4001');
    expect(e.params).toEqual({ max: '5 MB' });
  });

  it('does not trust a 422 that is not one of ours', async () => {
    respond(422, { message: 'The image field is required.', errors: {} });
    expect((await failure(uploadImage('/upload', png()))).code).toBe('OE-UPL-4900');
    respond(422, { code: '<img src=x onerror=alert(1)>' });
    expect((await failure(uploadImage('/upload', png()))).code).toBe('OE-UPL-4900');
  });

  it.each([
    [413, 'OE-UPL-4001'],
    [401, 'OE-UPL-4004'],
    [403, 'OE-UPL-4004'],
    [419, 'OE-UPL-4004'],
    [429, 'OE-UPL-4007'],
    [500, 'OE-UPL-4005'],
    [503, 'OE-UPL-4005'],
    [404, 'OE-UPL-4900'],
  ])('maps HTTP %i to %s', async (status, code) => {
    respond(status, { message: 'Server Error' });
    expect((await failure(uploadImage('/upload', png(), { maxBytes: 1024 }))).code).toBe(code);
  });

  it('reports a network failure as a connection problem', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    expect((await failure(uploadImage('/upload', png()))).code).toBe('OE-UPL-4003');
  });

  it('refuses early what the server would refuse, without a request', async () => {
    const fetch = respond(201, { url: '/a.png' });
    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    expect((await failure(uploadImage('/upload', svg))).code).toBe('OE-UPL-4002');
    const big = new File([new Uint8Array(2048)], 'big.png', { type: 'image/png' });
    const e = await failure(uploadImage('/upload', big, { maxBytes: 1024 }));
    expect([e.code, e.params]).toEqual(['OE-UPL-4001', { max: '1 KB' }]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('formats sizes like the server', () => {
    expect([formatBytes(5 * 1024 * 1024), formatBytes(1536 * 1024), formatBytes(512 * 1024), formatBytes(10)]).toEqual([
      '5 MB', '1.5 MB', '512 KB', '10 B',
    ]);
  });
});

describe('error messages', () => {
  const en = resolveMessages('en').messages;
  const ja = resolveMessages('ja').messages;

  it('fills in parameters', () => {
    expect(errorMessage(en, 'OE-UPL-4001', { max: '5 MB' })).toBe('The image is too large. Choose an image of 5 MB or smaller.');
    expect(errorMessage(ja, 'OE-UPL-4001', { max: '5 MB' })).toBe('画像のサイズが大きすぎます。5 MB 以下の画像を選んでください。');
  });

  it('uses the short form when a parameter is missing', () => {
    expect(errorMessage(en, 'OE-UPL-4001')).toBe('The image is too large. Choose a smaller image.');
  });

  it('falls back to the generic message for unknown codes', () => {
    expect(errorMessage(en, 'OE-UPL-4999')).toBe("The image couldn't be uploaded.");
  });

  it('has an English and a Japanese message for every user-facing code in the PHP registry', () => {
    // One registry for both sides: a code the server can send must have text here.
    const php = readFileSync(resolve(process.cwd(), 'src/ErrorCode.php'), 'utf8');
    const codes = Array.from(php.matchAll(/'(OE-(?:UPL|CORE)-\d{4})'/g), (m) => m[1]!);
    expect(codes.length).toBeGreaterThan(5);
    for (const code of codes) {
      for (const messages of [en, ja]) {
        expect((messages as Record<string, string>)[`errors.${code}`], code).toBeTruthy();
      }
    }
    expect(ja['errors.OE-UPL-4002']).not.toBe(en['errors.OE-UPL-4002']);
  });
});

describe('the editor with uploads', () => {
  let editor: OhashiEditorElement;
  const root = () => editor.shadowRoot!;
  const fileInput = () => root().querySelector('input[type="file"]') as HTMLInputElement;

  function choose(...files: File[]) {
    Object.defineProperty(fileInput(), 'files', { configurable: true, value: files });
    fileInput().dispatchEvent(new Event('change'));
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    document.body.innerHTML = `<${TAG_NAME} name="body" upload-url="/upload" upload-max-size="1024"></${TAG_NAME}>`;
    editor = document.querySelector(TAG_NAME) as OhashiEditorElement;
  });

  it('shows the image button only with an upload URL', () => {
    expect(root().querySelector('[part~="btn-image"]')).not.toBeNull();
    editor.removeAttribute('upload-url');
    expect(root().querySelector('[part~="btn-image"]')).toBeNull();
  });

  it('accepts only the formats the server accepts in the file picker', () => {
    expect(fileInput().accept).toBe('image/png,image/jpeg,image/gif,image/webp');
  });

  it('inserts the uploaded image, shows progress meanwhile, and records it in the history', async () => {
    respond(201, { url: '/storage/a.png' });
    choose(png());
    expect(root().querySelector('[part~="notice-info"]')?.getAttribute('role')).toBe('status');
    await settle();
    await settle();
    expect(editor.value).toBe('<p><img src="/storage/a.png" alt=""></p>');
    expect(root().querySelector('[part~="notice"]')).toBeNull();
    expect(editor.undo()).toBe(true);
    expect(editor.value).toBe('');
  });

  it('reports a failure as an ohashi-error event and a notice', async () => {
    respond(422, { code: 'OE-UPL-4002' });
    const events: OhashiEditorErrorDetail[] = [];
    document.addEventListener('ohashi-error', (e) => events.push((e as CustomEvent<OhashiEditorErrorDetail>).detail));
    choose(png());
    await settle();
    await settle();

    expect(events.map((e) => e.code)).toEqual(['OE-UPL-4002']);
    const notice = root().querySelector('[part~="notice"]')!;
    expect(notice.getAttribute('part')).toBe('notice notice-error');
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.querySelector('[part="notice-message"]')?.textContent).toBe(events[0]!.message);
    expect(notice.querySelector('[part="notice-code"]')?.textContent).toBe('OE-UPL-4002');
    expect(editor.value).toBe('');
  });

  it('replaces a notice with the same code instead of stacking, and closes on request', async () => {
    respond(422, { code: 'OE-UPL-4002' });
    choose(png());
    await settle();
    choose(png());
    await settle();
    await settle();
    expect(root().querySelectorAll('[part~="notice"]')).toHaveLength(1);
    (root().querySelector('[part~="btn-notice-close"]') as HTMLButtonElement).click();
    expect(root().querySelectorAll('[part~="notice"]')).toHaveLength(0);
  });

  it('lets the page show the error itself (preventDefault)', async () => {
    respond(500);
    editor.addEventListener('ohashi-error', (e) => e.preventDefault());
    choose(png());
    await settle();
    await settle();
    expect(root().querySelector('[part~="notice-error"]')).toBeNull();
  });

  it('checks the size from upload-max-size before sending, in the UI language', async () => {
    editor.setAttribute('locale', 'ja');
    const fetch = respond(201, { url: '/a.png' });
    choose(new File([new Uint8Array(4096)], 'big.png', { type: 'image/png' }));
    await settle();
    expect(fetch).not.toHaveBeenCalled();
    expect(root().querySelector('[part="notice-message"]')?.textContent).toBe('画像のサイズが大きすぎます。1 KB 以下の画像を選んでください。');
  });

  it('turns an internal error into OE-CORE-9001 without throwing into the page', () => {
    const codes: string[] = [];
    editor.addEventListener('ohashi-error', (e) => codes.push((e as CustomEvent<OhashiEditorErrorDetail>).detail.code));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    editor.value = '<p><img src="/a.png" alt=""></p>';
    const content = root().querySelector('[part~="content"]') as HTMLElement;
    (content.querySelector('img') as HTMLImageElement).click();
    // Closing the popover puts focus back into the content; make that break.
    vi.spyOn(content, 'focus').mockImplementation(() => {
      throw new Error('boom');
    });
    const close = root().querySelector('[part~="popover-image"] [part~="btn-popover-close"]') as HTMLButtonElement;

    expect(() => close.click()).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
    expect(codes).toEqual(['OE-CORE-9001']);
    expect(root().querySelector('[part~="notice-error"] [part="notice-code"]')?.textContent).toBe('OE-CORE-9001');
    expect(editor.value).toBe('<p><img src="/a.png" alt=""></p>');
  });

  describe('image popover', () => {
    beforeEach(() => {
      editor.value = '<p>a<img src="/a.png" alt="old">b</p>';
      (root().querySelector('[part~="content"] img') as HTMLImageElement).click();
    });
    const popover = () => root().querySelector('[part~="popover-image"]') as HTMLElement;
    const widthButton = (percent: number) =>
      Array.from(popover().querySelectorAll<HTMLButtonElement>('[part~="btn-image-width"]')).find((b) => b.textContent === `${percent}%`)!;

    it('opens on an image with its alt text', () => {
      expect(popover().hidden).toBe(false);
      expect((popover().querySelector('[part~="input-image-alt"]') as HTMLInputElement).value).toBe('old');
      expect(popover().querySelectorAll('[part~="btn-image-width"]')).toHaveLength(4);
    });

    it('nudges for alternative text while it is empty, and is read as the field description', () => {
      const input = popover().querySelector('[part~="input-image-alt"]') as HTMLInputElement;
      const hint = popover().querySelector('.orte-popover-hint') as HTMLElement;
      // Opened on alt="old": no hint.
      expect(hint.hidden).toBe(true);
      expect(input.hasAttribute('aria-describedby')).toBe(false);

      input.value = '  ';
      input.dispatchEvent(new Event('input'));
      expect(hint.hidden).toBe(false);
      expect(hint.textContent).toMatch(/^No alternative text yet\./);
      expect(input.getAttribute('aria-describedby')).toBe(hint.id);

      input.value = 'A toucan';
      input.dispatchEvent(new Event('input'));
      expect(hint.hidden).toBe(true);
    });

    it('shows the nudge at once for an image without alt text, in the UI language', () => {
      editor.setAttribute('locale', 'ja');
      editor.value = '<p><img src="/b.png" alt=""></p>';
      (root().querySelector('[part~="content"] img') as HTMLImageElement).click();
      const hint = popover().querySelector('.orte-popover-hint') as HTMLElement;
      expect(hint.hidden).toBe(false);
      expect(hint.textContent).toMatch(/^代替テキストがまだありません/);
      // The content is not changed by it.
      expect(editor.value).toBe('<p><img src="/b.png" alt=""></p>');
    });

    it('sets a preset width as an attribute and marks it active', () => {
      widthButton(50).click();
      expect(editor.value).toBe('<p>a<img src="/a.png" alt="old" width="50%">b</p>');
      expect(widthButton(50).getAttribute('part')).toBe('btn btn-image-width btn-active');
      expect(widthButton(25).getAttribute('part')).toBe('btn btn-image-width');
    });

    it('applies the alt text on Enter and closes', () => {
      const input = popover().querySelector('[part~="input-image-alt"]') as HTMLInputElement;
      input.value = '  A toucan  ';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(editor.value).toBe('<p>a<img src="/a.png" alt="A toucan">b</p>');
      expect(popover().hidden).toBe(true);
    });

    it('closes when the image goes away (undo, new value)', () => {
      editor.value = '<p>other</p>';
      expect(popover().hidden).toBe(true);
    });

    it('does not open when the toolbar has no image tool', () => {
      editor.setAttribute('toolbar', 'bold');
      expect(popover().hidden).toBe(true);
      (root().querySelector('[part~="content"] img') as HTMLImageElement).click();
      expect(popover().hidden).toBe(true);
    });
  });
});
