// The input pipeline in real engines: typing, browser formatting commands,
// Enter, paste, drop, undo/redo and IME, each followed by normalisation.
// The editor's value must come out in the same normal form in Chromium,
// Firefox and WebKit, and repeated edits must not grow the HTML.
import { expect, test, type Page } from '@playwright/test';

const t = <T = unknown>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).t[f as string](...(a as unknown[])), [fn, args] as const) as Promise<T>;
const content = (page: Page) => page.locator('ohashi-rich-text-editor .orte-content');

async function open(page: Page, html = ''): Promise<void> {
  await page.goto('/editor.html');
  await expect(page).toHaveTitle('ready');
  await t(page, 'set', html);
}

async function clipboard(page: Page, browserName: string, html: string | null, text?: string): Promise<void> {
  if (browserName === 'chromium') await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await t(page, 'clipboard', html, text);
}

test('typing into an empty editor makes a paragraph', async ({ page }) => {
  await open(page);
  await content(page).click();
  await page.keyboard.type('hello');
  expect(await t(page, 'value')).toBe('<p>hello</p>');
  expect(await t(page, 'form')).toBe('<p>hello</p>');
  expect(await t(page, 'changes')).toBeGreaterThan(0);
});

test('an emptied editor has the value ""', async ({ page }) => {
  await open(page, '<p>hello</p>');
  await content(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  expect(await t(page, 'value')).toBe('');
  expect(await t(page, 'form')).toBe('');
});

test('bold is normalised to <strong>, keeps the selection, and toggles without growing', async ({ page }) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  await t(page, 'select', 'world');
  await t(page, 'exec', 'bold');
  expect(await t(page, 'value')).toBe('<p>hello <strong>world</strong></p>');
  expect(await t(page, 'selected')).toBe('world');

  for (let i = 0; i < 5; i++) await t(page, 'exec', 'bold');
  expect(await t(page, 'value')).toBe('<p>hello world</p>');
  await t(page, 'exec', 'bold');
  expect(await t(page, 'value')).toBe('<p>hello <strong>world</strong></p>');
});

test('italic and strike are normalised', async ({ page }) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  await t(page, 'select', 'world');
  await t(page, 'exec', 'italic');
  await t(page, 'exec', 'strikeThrough');
  // All three engines nest it this way round.
  expect(await t(page, 'value')).toBe('<p>hello <em><s>world</s></em></p>');
});

test('formatBlock blockquote wraps the text in a paragraph', async ({ page }) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  await t(page, 'select', 'world');
  await t(page, 'exec', 'formatBlock', 'blockquote');
  expect(await t(page, 'value')).toBe('<blockquote><p>hello world</p></blockquote>');
});

test('Enter twice leaves a list as a paragraph, not a <div>', async ({ page }) => {
  await open(page, '<ul><li>a</li></ul>');
  await content(page).click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('x');
  expect(await t(page, 'value')).toBe('<ul><li>a</li></ul><p>x</p>');
});

test('paste: HTML is sanitised, normalised and splits the paragraph', async ({ page, browserName }) => {
  await open(page, '<p>ab</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  // Absolute URL: Chromium rewrites relative URLs in clipboard HTML to absolute ones.
  await clipboard(page, browserName, '<p>pasted <span style="color:red">red</span> <b>bold</b></p><img src="https://example.com/x.png" onerror="window.pwned=true">');
  await page.keyboard.press('ControlOrMeta+v');
  await page.keyboard.type('Y');
  // WebKit writes the spaces as &nbsp; into the clipboard; the editor restores plain spaces between words.
  expect(await t(page, 'value')).toBe('<p>a</p><p>pasted red <strong>bold</strong></p><p><img src="https://example.com/x.png">Yb</p>');
  expect(await page.evaluate(() => (window as any).pwned)).toBe(false);
});

test('paste: inline HTML stays in the paragraph', async ({ page, browserName }) => {
  await open(page, '<p>ab</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  await clipboard(page, browserName, '<b style="color:red">X</b>');
  await page.keyboard.press('ControlOrMeta+v');
  await page.keyboard.type('Y');
  expect(await t(page, 'value')).toBe('<p>a<strong>XY</strong>b</p>');
});

test('paste: plain text with line breaks inside a list item stays in the item', async ({ page, browserName }) => {
  await open(page, '<ul><li>ab</li></ul>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  await clipboard(page, browserName, null, 'x\ny');
  await page.keyboard.press('ControlOrMeta+v');
  expect(await t(page, 'value')).toBe('<ul><li>ax<br>yb</li></ul>');
});

test('drop: HTML from outside is sanitised and inserted where it is dropped', async ({ page }) => {
  await open(page, '<p>hello world</p><p>second</p>');
  expect(await t(page, 'dropAfter', 'hello', '<b>X</b><img src=x onerror="window.pwned=true">')).toBe(true);
  const value = await t<string>(page, 'value');
  expect(value).toMatch(/^<p>hello ?<strong>X<\/strong><img src="x"> ?world<\/p><p>second<\/p>$/);
  expect(await page.evaluate(() => (window as any).pwned)).toBe(false);
});

test('undo and redo use the editor history (typing grouped by pauses)', async ({ page }) => {
  await open(page);
  await content(page).click();
  await page.keyboard.type('one');
  await page.waitForTimeout(500);
  await page.keyboard.type(' two');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await t(page, 'value')).toBe('<p>one</p>');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await t(page, 'value')).toBe('');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  expect(await t(page, 'value')).toBe('<p>one two</p>');
  // The caret comes back with the content: typing continues at the end.
  await page.keyboard.type('!');
  expect(await t(page, 'value')).toBe('<p>one two!</p>');
});

test('undo reverts a paste in one step', async ({ page, browserName }) => {
  await open(page, '<p>ab</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await clipboard(page, browserName, '<b>X</b>');
  await page.keyboard.press('ControlOrMeta+v');
  expect(await t(page, 'value')).toBe('<p>ab<strong>X</strong></p>');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await t(page, 'value')).toBe('<p>ab</p>');
});

test('stored content round-trips unchanged', async ({ page }) => {
  const html = '<h2>T</h2><p>a <strong>b</strong> <em>i</em> <a href="/x" rel="noopener noreferrer">l</a></p><ul><li>u</li></ul><blockquote><p>q</p></blockquote><pre><code>c</code></pre>';
  await open(page, html);
  const first = await t<string>(page, 'value');
  expect(first).toBe(html);
  await t(page, 'set', first);
  expect(await t(page, 'value')).toBe(first);
});

test('legacy markup is normalised on load, then stays put', async ({ page }) => {
  await open(page, '<div><b>bold</b> <span style="color:red">x</span></div><p></p>');
  const first = await t<string>(page, 'value');
  expect(first).toBe('<p><strong>bold</strong> x</p>');
  await t(page, 'set', first);
  expect(await t(page, 'value')).toBe(first);
});

test('IME composition is left alone until it ends (Chromium, CDP)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Composition can only be driven through CDP in Chromium');
  await open(page);
  await content(page).click();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.imeSetComposition', { text: 'に', selectionStart: 1, selectionEnd: 1 });
  await cdp.send('Input.imeSetComposition', { text: 'にほん', selectionStart: 3, selectionEnd: 3 });
  // Mid-composition the bare text is not wrapped: rewriting the DOM now would break the conversion.
  expect(await t(page, 'raw')).toBe('にほん');
  await cdp.send('Input.imeSetComposition', { text: '日本', selectionStart: 2, selectionEnd: 2 });
  await cdp.send('Input.insertText', { text: '日本' });
  expect(await t(page, 'value')).toBe('<p>日本</p>');
  await page.keyboard.type('語');
  expect(await t(page, 'value')).toBe('<p>日本語</p>');
});
