// <x-ohashi-editor wire:model="…"> against a real Livewire server
// (workbench/, started by test/livewire.sh) in Chromium, Firefox and WebKit.
//
// What must hold: every kind of edit reaches the Livewire property; values the
// server sets reach the editor; Livewire re-rendering the component (morphing
// the DOM around the editor) never resets the content, the caret or an IME
// composition; .live round-trips never drop characters typed meanwhile; and
// wire:navigate leaves no duplicated listeners behind.
import { expect, test, type Page } from '@playwright/test';

const editor = (page: Page) => page.locator('ohashi-rich-text-editor');
const content = (page: Page) => page.locator('ohashi-rich-text-editor .orte-content');
const value = (page: Page) => page.evaluate(() => (document.querySelector('ohashi-rich-text-editor') as HTMLElement & { value: string }).value);
const serverBody = (page: Page) => page.locator('#server-body');
/** The property as the Livewire component in the browser holds it (before any request). */
const wireBody = (page: Page) => page.evaluate(() => (window as unknown as { Livewire: { first(): { body: unknown } } }).Livewire.first().body);
const renders = async (page: Page) => Number(await page.locator('#renders').textContent());

async function open(page: Page, mode: 'deferred' | 'live' | 'blur' | 'change') {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('OE-'))) problems.push(m.text());
  });
  await page.goto(`/livewire/${mode}`);
  await page.waitForFunction(() => !!customElements.get('ohashi-rich-text-editor') && !!(window as { Livewire?: unknown }).Livewire);
  await expect.poll(() => value(page)).toBe('<p>Hello</p>');
  return problems;
}

/** Clicks a Livewire action button and waits for the round trip to finish. */
async function action(page: Page, id: string) {
  const before = await renders(page);
  await page.locator(`#${id}`).click();
  await expect.poll(() => renders(page)).toBeGreaterThan(before);
}

async function caretAtEnd(page: Page) {
  await content(page).click();
  await page.keyboard.press('ControlOrMeta+End');
}

test.describe('wire:model (deferred)', () => {
  test('the initial value comes from the property; typing reaches it on the next request', async ({ page }) => {
    const problems = await open(page, 'deferred');
    await caretAtEnd(page);
    await page.keyboard.type(' world');
    // Deferred: nothing is sent while typing.
    await expect(serverBody(page)).toHaveText('<p>Hello</p>');
    await action(page, 'save');
    await expect(serverBody(page)).toHaveText('<p>Hello world</p>');
    await expect(page.locator('#saved')).toHaveText('<p>Hello world</p>');
    expect(problems).toEqual([]);
  });

  test('toolbar commands, undo and paste reach the property too', async ({ page }) => {
    await open(page, 'deferred');
    await content(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.locator('ohashi-rich-text-editor [data-tool="bold"]').click();
    await action(page, 'save');
    await expect(serverBody(page)).toHaveText('<p><strong>Hello</strong></p>');

    await content(page).click();
    await page.keyboard.press('ControlOrMeta+z');
    expect(await value(page)).toBe('<p>Hello</p>');
    await action(page, 'save');
    await expect(serverBody(page)).toHaveText('<p>Hello</p>');

    await page.locator('ohashi-rich-text-editor [data-tool="h2"]').click();
    await action(page, 'save');
    await expect(serverBody(page)).toHaveText('<h2>Hello</h2>');
  });

  test('a value set by the server replaces the content; an empty one empties it', async ({ page }) => {
    await open(page, 'deferred');
    await action(page, 'replace');
    await expect.poll(() => value(page)).toBe('<p>Set by the <strong>server</strong></p>');
    await action(page, 'clear');
    await expect.poll(() => value(page)).toBe('');
  });

  test('re-rendering the component keeps unsaved content and the caret', async ({ page }) => {
    await open(page, 'deferred');
    await caretAtEnd(page);
    await page.keyboard.type(' draft');
    // Another field's live update makes Livewire re-render and morph the component.
    await page.locator('#title').fill('A title');
    await expect(page.locator('#title-echo')).toHaveText('A title');
    await action(page, 'refresh');
    expect(await value(page)).toBe('<p>Hello draft</p>');

    await content(page).click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type('!');
    expect(await value(page)).toBe('<p>Hello draft!</p>');
  });

  test('a validation error rendered next to the editor leaves it working', async ({ page }) => {
    await open(page, 'deferred');
    await content(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    expect(await value(page)).toBe('');
    await action(page, 'save');
    await expect(page.locator('#error')).toBeVisible();

    await content(page).click();
    await page.keyboard.type('Fixed');
    await action(page, 'save');
    await expect(page.locator('#error')).toHaveCount(0);
    await expect(page.locator('#saved')).toHaveText('<p>Fixed</p>');
  });
});

test.describe('wire:model.live', () => {
  test('round trips while typing never drop or reorder characters', async ({ page }) => {
    const problems = await open(page, 'live');
    await caretAtEnd(page);
    // Slow enough for requests to go out between keystrokes, fast enough
    // that answers come back while the person is still typing.
    await page.keyboard.type(' the quick brown fox', { delay: 60 });
    expect(await value(page)).toBe('<p>Hello the quick brown fox</p>');
    await expect(serverBody(page)).toHaveText('<p>Hello the quick brown fox</p>');
    expect(await renders(page)).toBeGreaterThan(2);
    // The editor still holds exactly what was typed, and the caret is still at the end.
    await page.keyboard.type('!');
    expect(await value(page)).toBe('<p>Hello the quick brown fox!</p>');
    expect(problems).toEqual([]);
  });

  test('Enter and new paragraphs survive the round trips', async ({ page }) => {
    await open(page, 'live');
    await caretAtEnd(page);
    await page.keyboard.press('Enter');
    await page.keyboard.type('second', { delay: 40 });
    await page.keyboard.press('Enter');
    await page.keyboard.type('third', { delay: 40 });
    await expect(serverBody(page)).toHaveText('<p>Hello</p><p>second</p><p>third</p>');
    expect(await value(page)).toBe('<p>Hello</p><p>second</p><p>third</p>');
  });
});

test.describe('wire:model.blur / .change', () => {
  test('.blur takes the value when focus leaves the editor', async ({ page }) => {
    await open(page, 'blur');
    await caretAtEnd(page);
    await page.keyboard.type(' there');
    // When the local value updates differs by major version (Livewire 4: on
    // blur; 3: as you type, sent on blur), so only the outcome is checked.
    await page.locator('#title').click();
    await expect.poll(() => wireBody(page)).toBe('<p>Hello there</p>');
    await action(page, 'save');
    await expect(page.locator('#saved')).toHaveText('<p>Hello there</p>');
  });

  test('.change stores the HTML, not the event detail object', async ({ page }) => {
    await open(page, 'change');
    await caretAtEnd(page);
    await page.keyboard.type('!');
    await expect.poll(() => wireBody(page)).toBe('<p>Hello!</p>');
    await action(page, 'save');
    await expect(page.locator('#saved')).toHaveText('<p>Hello!</p>');
  });
});

test('one input event per keystroke, after normalisation', async ({ page }) => {
  await open(page, 'deferred');
  await page.evaluate(() => {
    const el = document.querySelector('ohashi-rich-text-editor') as HTMLElement & { value: string };
    (window as unknown as { seen: string[] }).seen = [];
    el.addEventListener('input', () => (window as unknown as { seen: string[] }).seen.push(el.value));
  });
  await caretAtEnd(page);
  await page.keyboard.type('ab');
  expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(['<p>Helloa</p>', '<p>Helloab</p>']);
});

test('IME composition across .live round trips (Chromium, CDP)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'IME input is driven through the Chrome DevTools Protocol');
  await open(page, 'live');
  await caretAtEnd(page);
  const cdp = await page.context().newCDPSession(page);
  // Pauses longer than the 150 ms debounce: requests go out and answers come
  // back in the middle of the composition.
  for (const text of ['に', 'にほ', 'にほん']) {
    await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
    await page.waitForTimeout(400);
  }
  await cdp.send('Input.imeSetComposition', { text: '日本', selectionStart: 2, selectionEnd: 2 });
  await page.waitForTimeout(400);
  await cdp.send('Input.insertText', { text: '日本' });
  await page.keyboard.type('語');
  expect(await value(page)).toBe('<p>Hello日本語</p>');
  await expect(serverBody(page)).toHaveText('<p>Hello日本語</p>');
});

test('wire:navigate away and back: a fresh editor, no duplicate listeners', async ({ page }) => {
  const problems = await open(page, 'deferred');
  await page.locator('#other').click();
  await expect(page.locator('#other-page')).toBeVisible();
  await page.locator('#back').click();
  await expect(page).toHaveTitle('deferred');
  await expect.poll(() => value(page)).toBe('<p>Hello</p>');

  await page.evaluate(() => {
    const el = document.querySelector('ohashi-rich-text-editor')!;
    (window as { n?: number }).n = 0;
    el.addEventListener('change', () => ((window as { n?: number }).n! += 1));
  });
  await caretAtEnd(page);
  await page.keyboard.type('x');
  expect(await page.evaluate(() => (window as { n?: number }).n)).toBe(1);
  await action(page, 'save');
  await expect(serverBody(page)).toHaveText('<p>Hellox</p>');
  expect(problems).toEqual([]);
});
