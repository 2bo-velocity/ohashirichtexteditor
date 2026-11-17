// Image upload in Chromium, Firefox and WebKit: the file picker, paste and
// drop all send the file to `upload-url` and insert the stored image; failures
// become a notice and an `ohashi-error` event; clicking an image edits its
// width preset and alternative text. The endpoint is mocked here — the
// server side is tested in PHP (tests/Laravel/ImageUploadTest.php).
import { expect, test, type Page, type Request } from '@playwright/test';

const t = <T = any>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).t[f as string](...(a as unknown[])), [fn, args] as const) as Promise<T>;
const content = (page: Page) => page.locator('#e .orte-content');

/** Serves /upload with `answers` in turn (the last one repeats) and records the requests. */
async function open(page: Page, html: string, ...answers: { status: number; body?: unknown; delay?: number }[]) {
  const requests: Request[] = [];
  let n = 0;
  await page.route('**/upload', async (route) => {
    requests.push(route.request());
    const answer = answers[Math.min(n++, answers.length - 1)]!;
    if (answer.delay) await new Promise((r) => setTimeout(r, answer.delay));
    await route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify(answer.body ?? {}) });
  });
  await page.goto('/upload.html');
  await expect(page).toHaveTitle('ready');
  await page.evaluate(() => (document.cookie = 'XSRF-TOKEN=token%3D'));
  await t(page, 'set', html);
  return requests;
}

async function pasteImage(page: Page, browserName: string) {
  if (browserName === 'chromium') await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await t(page, 'copyImage');
  await page.keyboard.press('ControlOrMeta+v');
}

const stored = (name: string) => ({ status: 201, body: { url: `/storage/ohashi-editor/${name}.png` } });

test('the image button uploads the chosen file and inserts it at the caret', async ({ page }) => {
  const requests = await open(page, '<p>before after</p>', { ...stored('a'), delay: 300 });
  await t(page, 'caretAfter', 'before');

  const chooser = page.waitForEvent('filechooser');
  await page.locator('#e [data-tool="image"]').click();
  await (await chooser).setFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });

  // Progress while the upload runs.
  await expect.poll(() => t(page, 'notices')).toEqual([expect.objectContaining({ part: 'notice notice-info', role: 'status', code: null })]);
  expect(await t(page, 'busy')).toBe('true');

  await expect.poll(() => t(page, 'value')).toBe('<p>before<img src="/storage/ohashi-editor/a.png" alt=""> after</p>');
  expect(await t(page, 'notices')).toEqual([]);
  expect(await t(page, 'busy')).toBeNull();

  const request = requests[0]!;
  expect(request.method()).toBe('POST');
  expect(request.headers()['x-xsrf-token']).toBe('token=');
  expect(request.headers()['accept']).toBe('application/json');
  expect(request.postData()).toContain('name="image"; filename="photo.png"');

  // Typing goes on after the image.
  await page.keyboard.type('!');
  expect(await t(page, 'value')).toBe('<p>before<img src="/storage/ohashi-editor/a.png" alt="">! after</p>');
});

test('a pasted screenshot is uploaded, not inserted as data', async ({ page, browserName }) => {
  await open(page, '<p>text</p>', stored('pasted'));
  await t(page, 'caretAfter', 'text');
  await pasteImage(page, browserName);
  await expect.poll(() => t(page, 'value')).toBe('<p>text<img src="/storage/ohashi-editor/pasted.png" alt=""></p>');
});

test('a dropped file is uploaded and lands where it was dropped', async ({ page }) => {
  await open(page, '<p>one two</p>', stored('dropped'));
  expect(await t(page, 'dropAfter', 'one')).toBe(true);
  await expect.poll(() => t(page, 'value')).toBe('<p>one<img src="/storage/ohashi-editor/dropped.png" alt=""> two</p>');
});

test('a refused upload shows a notice between toolbar and content, and fires ohashi-error', async ({ page, browserName }) => {
  await open(page, '<p>text</p>', { status: 422, body: { code: 'OE-UPL-4001', params: { max: '5 MB' } } });
  await t(page, 'caretAfter', 'text');
  await pasteImage(page, browserName);

  await expect.poll(() => t(page, 'errors')).toEqual([
    { code: 'OE-UPL-4001', message: 'The image is too large. Choose an image of 5 MB or smaller.', params: { max: '5 MB' } },
  ]);
  const [notice] = await t(page, 'notices');
  expect(notice).toMatchObject({ part: 'notice notice-error', role: 'alert', code: 'OE-UPL-4001', message: 'The image is too large. Choose an image of 5 MB or smaller.' });
  // --orte-danger-bg (#fef2f2) under --orte-danger-color (#b91c1c): 5.9:1.
  expect(notice.background).toBe('rgb(254, 242, 242)');
  expect(notice.color).toBe('rgb(185, 28, 28)');
  const [toolbarBottom, noticeTop, noticeBottom, contentTop] = await t<[number, number, number, number]>(page, 'layout');
  expect(noticeTop).toBeGreaterThanOrEqual(toolbarBottom - 1);
  expect(contentTop).toBeGreaterThanOrEqual(noticeBottom - 1);
  // Nothing was inserted, nothing was lost.
  expect(await t(page, 'value')).toBe('<p>text</p>');

  await page.locator('#e [part~="btn-notice-close"]').click();
  expect(await t(page, 'notices')).toEqual([]);
});

test('an expired session is explained in the UI language', async ({ page, browserName }) => {
  await open(page, '<p>text</p>', { status: 419, body: { message: 'CSRF token mismatch.' } });
  await t(page, 'attr', 'locale', 'ja');
  await t(page, 'caretAfter', 'text');
  await pasteImage(page, browserName);
  await expect.poll(async () => (await t(page, 'notices'))[0]?.message).toBe(
    'セッションの有効期限が切れた可能性があります。入力した内容をコピーしてから、ページを再読み込みしてもう一度お試しください。',
  );
});

test('a dropped file that is not an image is refused without a request', async ({ page }) => {
  const requests = await open(page, '<p>one two</p>', stored('never'));
  await t(page, 'dropAfter', 'one', 'pdf');
  await expect.poll(async () => (await t(page, 'errors')).map((e: { code: string }) => e.code)).toEqual(['OE-UPL-4002']);
  expect(requests).toHaveLength(0);
});

test('without upload-url, dropped files do nothing and the page does not navigate', async ({ page }) => {
  const requests = await open(page, '<p>one two</p>', stored('never'));
  await t(page, 'attr', 'upload-url', null);
  expect(await t(page, 'dropAfter', 'one')).toBe(true);
  expect(requests).toHaveLength(0);
  expect(await t(page, 'value')).toBe('<p>one two</p>');
  expect(page.url()).toMatch(/upload\.html$/);
});

test('clicking an image edits its width preset and alt text', async ({ page }) => {
  await open(page, '<p>a<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" width="100">b</p>', stored('x'));
  await content(page).locator('img').click();
  expect(await t(page, 'imagePopover')).toMatchObject({ open: true, alt: '', focused: true });

  await page.locator('#e [part~="btn-image-width"]', { hasText: '50%' }).click();
  expect(await t(page, 'value')).toBe('<p>a<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" width="50%">b</p>');
  expect((await t(page, 'imagePopover')).widths).toEqual([
    'btn btn-image-width', 'btn btn-image-width btn-active', 'btn btn-image-width', 'btn btn-image-width',
  ]);

  await page.locator('#e [part~="input-image-alt"]').fill('A toucan');
  await page.keyboard.press('Enter');
  expect(await t(page, 'imagePopover')).toMatchObject({ open: false });
  expect(await t(page, 'value')).toBe('<p>a<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="A toucan" width="50%">b</p>');

  // Both changes are one undo step each.
  await page.keyboard.press('ControlOrMeta+z');
  expect(await t(page, 'value')).toBe('<p>a<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" width="50%">b</p>');
});

test.describe('image settings from the keyboard', () => {
  const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
  const html = `<p>a<img src="${GIF}" alt="" width="40">b</p>`;
  const imageButton = (page: Page) => page.locator('#e [data-tool="image"]');

  /** Puts the caret right after the image, then selects it with Shift+ArrowLeft. */
  async function selectImage(page: Page) {
    await page.evaluate(() => {
      const c = document.getElementById('e')!.shadowRoot!.querySelector('.orte-content') as HTMLElement;
      c.focus();
      const r = document.createRange();
      r.setStartAfter(c.querySelector('img')!);
      document.getSelection()!.setBaseAndExtent(r.startContainer, r.startOffset, r.startContainer, r.startOffset);
    });
    await page.keyboard.press('Shift+ArrowLeft');
  }
  const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  test('Shift+Arrow selects the image, Enter opens its settings instead of deleting it', async ({ page }) => {
    await open(page, html, stored('x'));
    await selectImage(page);
    await page.keyboard.press('Enter');
    expect(await t(page, 'imagePopover')).toMatchObject({ open: true, focused: true, hintVisible: true });
    expect(await t(page, 'value')).toBe(html);

    await page.keyboard.type('A toucan');
    expect(await t(page, 'imagePopover')).toMatchObject({ hintVisible: false });
    await page.keyboard.press('Enter');
    expect(await t(page, 'imagePopover')).toMatchObject({ open: false });
    expect(await t(page, 'value')).toBe(`<p>a<img src="${GIF}" alt="A toucan" width="40">b</p>`);
    // Focus is back in the text, right after the image.
    await page.keyboard.type('!');
    expect(await t(page, 'value')).toBe(`<p>a<img src="${GIF}" alt="A toucan" width="40">!b</p>`);
  });

  test('the width presets are reachable with Tab and work with the keyboard; Esc closes', async ({ page }) => {
    await open(page, html, stored('x'));
    await selectImage(page);
    await page.keyboard.press('Enter');
    // Width buttons come before the alt field.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    expect(await t(page, 'value')).toBe(`<p>a<img src="${GIF}" alt="" width="50%">b</p>`);
    await page.keyboard.press('Escape');
    expect(await t(page, 'imagePopover')).toMatchObject({ open: false });
    await page.keyboard.type('!');
    expect(await t(page, 'value')).toBe(`<p>a<img src="${GIF}" alt="" width="50%">!b</p>`);
  });

  test('with an image selected the image button reads "Edit image" and edits it; otherwise it uploads', async ({ page }) => {
    await open(page, html, stored('x'));
    await selectImage(page);
    await settle(page);
    await expect(imageButton(page)).toHaveAttribute('aria-label', 'Edit image');
    expect(await imageButton(page).getAttribute('aria-pressed')).toBeNull();
    await imageButton(page).click();
    expect(await t(page, 'imagePopover')).toMatchObject({ open: true });
    await page.keyboard.press('Escape');

    // The caret is now next to the image, not on it: the button uploads again.
    await settle(page);
    await expect(imageButton(page)).toHaveAttribute('aria-label', 'Image');
    const chooser = page.waitForEvent('filechooser');
    await imageButton(page).click();
    await chooser;
  });

  test('Enter elsewhere still makes a new paragraph', async ({ page }) => {
    await open(page, '<p>ab</p>', stored('x'));
    await t(page, 'caretAfter', 'a');
    await page.keyboard.press('Enter');
    expect(await t(page, 'value')).toBe('<p>a</p><p>b</p>');
    expect(await t(page, 'imagePopover')).toMatchObject({ open: false });
  });
});
