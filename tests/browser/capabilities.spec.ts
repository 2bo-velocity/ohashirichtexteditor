// Technical spike: how editing behaves inside the editor's shadow root in each
// engine. These tests record observations (test-results/capabilities/*.json)
// rather than assert a design; the findings decided the editing architecture,
// and the facts it depends on are asserted in engine-assumptions.spec.ts. Run with:
//
//   SPIKE=1 npx playwright test capabilities
//
// They are skipped in normal runs. Once the design is chosen, the facts it
// depends on become assertions in their own spec.
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

test.skip(!process.env.SPIKE, 'spike: run with SPIKE=1');

type Spike = Record<string, (...args: never[]) => unknown>;

async function open(page: Page, html: string): Promise<void> {
  await page.goto('/spike.html');
  await expect(page).toHaveTitle('ready');
  await page.evaluate((h) => (window as unknown as { spike: Spike }).spike.setHtml!(h as never), html);
}

function call<T>(page: Page, fn: string, ...args: unknown[]): Promise<T> {
  return page.evaluate(
    ([f, a]) => (window as unknown as { spike: Record<string, (...x: unknown[]) => unknown> }).spike[f as string]!(...(a as unknown[])),
    [fn, args] as const,
  ) as Promise<T>;
}

function record(project: string, probe: string, data: unknown): void {
  mkdirSync('test-results/capabilities', { recursive: true });
  writeFileSync(`test-results/capabilities/${project}--${probe}.json`, JSON.stringify(data, null, 2));
}

const content = (page: Page) => page.locator('spike-editable .orte-content');

test('selection: caret and word selection made by the user', async ({ page }, info) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  await page.keyboard.press('End');
  const caret = await call(page, 'selection');
  await page.keyboard.press('Shift+Control+ArrowLeft');
  const word = await call(page, 'selection');
  record(info.project.name, 'selection-user', { caret, word, active: await call(page, 'activeElement') });
});

test('selection: set from script', async ({ page }, info) => {
  await open(page, '<p>hello world</p>');
  await content(page).click();
  const result = await call(page, 'select', 'world');
  record(info.project.name, 'selection-script', { result, after: await call(page, 'selection') });
});

test('execCommand on a script selection', async ({ page }, info) => {
  const results: Record<string, unknown> = {};
  const cases: [string, string, string | undefined][] = [
    ['bold', 'bold', undefined],
    ['italic', 'italic', undefined],
    ['strikeThrough', 'strikeThrough', undefined],
    ['formatBlock h2', 'formatBlock', 'h2'],
    ['formatBlock <h2>', 'formatBlock', '<h2>'],
    ['formatBlock blockquote', 'formatBlock', 'blockquote'],
    ['insertUnorderedList', 'insertUnorderedList', undefined],
    ['createLink', 'createLink', 'https://example.com/'],
  ];
  for (const [name, command, value] of cases) {
    await open(page, '<p>hello world</p>');
    await content(page).click();
    await call(page, 'select', 'world');
    results[name] = await call(page, 'exec', command, value);
  }
  record(info.project.name, 'execcommand', results);
});

test('Enter: which block a new line becomes', async ({ page }, info) => {
  const results: Record<string, unknown> = {};
  for (const separator of ['default', 'p']) {
    await open(page, '<p>hello world</p>');
    if (separator === 'p') await call(page, 'exec', 'defaultParagraphSeparator', 'p');
    await content(page).click();
    await page.keyboard.press('End');
    await call(page, 'clearEvents');
    await page.keyboard.press('Enter');
    await page.keyboard.type('x');
    results[separator] = {
      html: await call(page, 'html'),
      beforeinput: (await call<{ type: string }[]>(page, 'events')).filter((e) => e.type === 'beforeinput'),
    };
  }
  // Enter in an empty list item, and Shift+Enter
  await open(page, '<ul><li>a</li></ul>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  results['empty list item'] = await call(page, 'html');
  await open(page, '<p>hello</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('x');
  results['shift+enter'] = await call(page, 'html');
  record(info.project.name, 'enter', results);
});

test('typing: native undo after a script change', async ({ page }, info) => {
  await open(page, '<p>hello</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.type(' a');
  const typed = await call(page, 'html');
  // A normalisation pass rewrites the DOM from script, as the editor will.
  await page.evaluate(() => {
    const c = document.querySelector('ohashi-rich-text-editor')!.shadowRoot!.querySelector('.orte-content')!;
    c.querySelector('p')!.textContent += '';
  });
  await page.keyboard.press('Control+z');
  record(info.project.name, 'undo', { typed, afterUndo: await call(page, 'html') });
});

test('IME composition (Chromium: CDP)', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'Composition can only be driven through CDP in Chromium');
  await open(page, '<p>a</p>');
  await content(page).click();
  await page.keyboard.press('End');
  await call(page, 'clearEvents');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.imeSetComposition', { text: 'に', selectionStart: 1, selectionEnd: 1 });
  await cdp.send('Input.imeSetComposition', { text: 'にほん', selectionStart: 3, selectionEnd: 3 });
  await cdp.send('Input.imeSetComposition', { text: '日本', selectionStart: 2, selectionEnd: 2 });
  await cdp.send('Input.insertText', { text: '日本' });
  record(info.project.name, 'ime', { events: await call(page, 'events'), html: await call(page, 'html') });
});

test('paste: real clipboard paste of HTML', async ({ page, browserName, context }, info) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '<p>a</p>');
  await content(page).click();
  await page.keyboard.press('End');
  const html = '<p>pasted <span style="color:red">red</span> <b>bold</b></p><img src=x onerror="window.pwned=1">';
  const write = await call(page, 'writeClipboard', html);
  await call(page, 'clearEvents');
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(200);
  record(info.project.name, 'paste', {
    write,
    events: await call(page, 'events'),
    html: await call(page, 'html'),
    pwned: await page.evaluate(() => (window as unknown as { pwned?: number }).pwned ?? null),
  });
});

test('paste: intercepted and inserted by the editor', async ({ page, browserName, context }, info) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '<p>ab</p>');
  await call(page, 'interceptPaste');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  await call(page, 'writeClipboard', '<b style="color:red">X</b>');
  await call(page, 'clearEvents');
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(200);
  await page.keyboard.type('Y');
  record(info.project.name, 'paste-intercepted', { events: await call(page, 'events'), html: await call(page, 'html') });
});

test('execCommand: block commands and shadow-boundary safety', async ({ page }, info) => {
  const results: Record<string, unknown> = {};
  const cases: [string, string, string | undefined, string][] = [
    ['insertOrderedList', 'insertOrderedList', undefined, '<p>hello world</p>'],
    ['insertUnorderedList (two paragraphs)', 'insertUnorderedList', undefined, '<p>one</p><p>hello world</p>'],
    ['indent', 'indent', undefined, '<p>hello world</p>'],
    ['insertHTML', 'insertHTML', '<strong>NEW</strong>', '<p>hello world</p>'],
    ['insertParagraph', 'insertParagraph', undefined, '<p>hello world</p>'],
    ['removeFormat', 'removeFormat', undefined, '<p>hello <b>world</b></p>'],
    ['unlink', 'unlink', undefined, '<p>hello <a href="/x">world</a></p>'],
  ];
  for (const [name, command, value, html] of cases) {
    await open(page, html);
    await content(page).click();
    await call(page, 'select', 'world');
    const r = await call<Record<string, unknown>>(page, 'exec', command, value);
    results[name] = { ...r, hostIntact: await call(page, 'hostIsIntact') };
  }
  record(info.project.name, 'execcommand-blocks', results);
});

test('Enter inside a list item', async ({ page }, info) => {
  await open(page, '<ul><li>one</li></ul>');
  await content(page).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('two');
  record(info.project.name, 'enter-list', { html: await call(page, 'html') });
});
