// Facts about the browser engines that the editing design relies on, checked in
// Chromium, Firefox and WebKit on every run. If a browser update breaks one,
// this fails before users do. The survey that established them is
// capabilities.spec.ts (SPIKE=1). In short: selection is read with
// getComposedRanges; simple inline/block formatting is delegated to
// execCommand and normalised afterwards; lists, code blocks, paste, images
// and undo are done by the editor itself, because execCommand's lists produce
// invalid nesting (Chromium) or break out of the shadow root (WebKit).
import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, html: string): Promise<void> {
  await page.goto('/spike.html');
  await expect(page).toHaveTitle('ready');
  await page.evaluate((h) => (window as any).spike.setHtml(h), html);
}
const call = <T>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).spike[f as string](...(a as unknown[])), [fn, args] as const) as Promise<T>;
const content = (page: Page) => page.locator('spike-editable .orte-content');

test('getComposedRanges reports the selection inside the shadow root', async ({ page }) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Shift+Control+ArrowLeft');
  const sel = await call<any>(page, 'selection');
  expect(sel.getComposedRanges).toBe(true);
  expect(sel.composed).toEqual([expect.objectContaining({ startInShadow: true, startOffset: 6, endOffset: 11 })]);
});

test('a selection can be set from script inside the shadow root', async ({ page }) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  expect(await call(page, 'select', 'world')).toEqual({ ok: true, text: 'world' });
});

// The commands the editor delegates to the browser, and the exact output it
// normalises afterwards. Lists, indent and code blocks are NOT delegated.
for (const [command, value, start, expected] of [
  ['bold', undefined, '<p>hello world</p>', '<p>hello <b>world</b></p>'],
  ['italic', undefined, '<p>hello world</p>', '<p>hello <i>world</i></p>'],
  ['strikeThrough', undefined, '<p>hello world</p>', '<p>hello <strike>world</strike></p>'],
  ['formatBlock', 'h2', '<p>hello world</p>', '<h2>hello world</h2>'],
  ['formatBlock', 'blockquote', '<p>hello world</p>', '<blockquote>hello world</blockquote>'],
  ['createLink', 'https://example.com/', '<p>hello world</p>', '<p>hello <a href="https://example.com/">world</a></p>'],
  ['unlink', undefined, '<p>hello <a href="/x">world</a></p>', '<p>hello world</p>'],
  ['removeFormat', undefined, '<p>hello <b>world</b></p>', '<p>hello world</p>'],
] as const) {
  test(`execCommand ${command}${value ? ` ${value}` : ''} works inside the shadow root`, async ({ page }) => {
    await open(page, start);
    await content(page).click();
    await call(page, 'select', 'world');
    expect(await call(page, 'exec', command, value)).toEqual({ returned: true, html: expected });
    expect(await call(page, 'hostIsIntact')).toBe(true);
  });
}

test('Enter makes a paragraph, Shift+Enter a line break', async ({ page }) => {
  await open(page, '<p>hello</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('x');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('y');
  expect(await call(page, 'html')).toBe('<p>hello</p><p>x<br>y</p>');
});

test('paste can be intercepted and replaced by the editor’s own insertion', async ({ page, browserName, context }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '<p>ab</p>');
  await call(page, 'interceptPaste');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  expect(await call(page, 'writeClipboard', '<b style="color:red">X</b>')).toBe('ok');
  await page.keyboard.press('Control+v');
  await page.keyboard.type('Y');
  expect(await call(page, 'html')).toBe('<p>a<b>XY</b>b</p>');
});

// Undo. The editor intercepts Ctrl/Cmd+Z on keydown; the browser's own undo
// (Edit menu, context menu, a shortcut the editor did not see) reaches it as
// a beforeinput historyUndo / historyRedo, which must be cancelable for the
// editor to put its own history in its place.
test.describe('the browser undo', () => {
  async function typed(page: Page, cancel: boolean) {
    await open(page, '<p>hello</p>');
    if (cancel) {
      await page.evaluate(() => {
        const c = document.querySelector('spike-editable')!.shadowRoot!.querySelector('.orte-content')!;
        c.addEventListener('beforeinput', (e) => {
          if ((e as InputEvent).inputType.startsWith('history')) e.preventDefault();
        });
      });
    }
    await content(page).click();
    await page.keyboard.press('End');
    await page.keyboard.type(' abc');
    await call(page, 'clearEvents');
  }
  const inputEvents = async (page: Page) =>
    (await call<any[]>(page, 'events'))
      .filter((e) => e.type === 'beforeinput' || e.type === 'input')
      .map((e) => (e.type === 'beforeinput' ? `beforeinput:${e.inputType}:${e.cancelable}` : `input:${e.inputType}`));

  test('arrives as a cancelable beforeinput historyUndo / historyRedo', async ({ page }) => {
    await typed(page, false);
    await page.keyboard.press('Control+z');
    expect(await inputEvents(page)).toEqual(['beforeinput:historyUndo:true', 'input:historyUndo']);
    await call(page, 'clearEvents');
    await page.keyboard.press('Control+Shift+z');
    expect(await inputEvents(page)).toEqual(['beforeinput:historyRedo:true', 'input:historyRedo']);
  });

  test('preventDefault on it stops the browser undo', async ({ page }) => {
    await typed(page, true);
    await page.keyboard.press('Control+z');
    expect(await call(page, 'html')).toBe('<p>hello abc</p>');
  });

  test('execCommand("undo") sends a beforeinput only in WebKit (the editor rolls the others back)', async ({ page, browserName }) => {
    await typed(page, false);
    await page.evaluate(() => document.execCommand('undo'));
    expect(await inputEvents(page)).toEqual(
      browserName === 'webkit' ? ['beforeinput:historyUndo:true', 'input:historyUndo'] : ['input:historyUndo'],
    );
  });
});
