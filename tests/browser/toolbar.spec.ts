// The toolbar and command layer in Chromium, Firefox and WebKit.
import { expect, test, type Page } from '@playwright/test';

const t = <T = any>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).t[f as string](...(a as unknown[])), [fn, args] as const) as Promise<T>;
const content = (page: Page) => page.locator('#e .orte-content');
const btn = (page: Page, tool: string) => page.locator(`#e [data-tool="${tool}"]`);

async function open(page: Page, html = '', attrs: Record<string, string> = {}) {
  await page.goto('/toolbar.html');
  await expect(page).toHaveTitle('ready');
  for (const [k, v] of Object.entries(attrs)) await t(page, 'attr', k, v);
  await t(page, 'set', html);
}
/** Lets the per-frame state update run. */
const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

test.describe('rendering', () => {
  test('default toolbar, grouped, labelled; image hidden without an upload URL', async ({ page }) => {
    await open(page);
    expect(await t(page, 'groups')).toEqual([['undo', 'redo'], ['bold', 'italic', 'strike'], ['paragraph', 'h2', 'h3', 'quote'], ['ul', 'ol'], ['link', 'code']]);
    expect(await t(page, 'toolbarLabel')).toBe('Formatting');
    const bold = await t(page, 'button', 'bold');
    expect(bold.label).toBe('Bold');
    expect(bold.title).toMatch(/^Bold \((Ctrl\+B|⌘B)\)$/);
    expect(bold.part).toBe('btn btn-bold');
    expect(await t(page, 'warnings')).toEqual([]);
  });

  test('toolbar attribute picks and groups tools; unknown names warn once', async ({ page }) => {
    await open(page, '', { toolbar: 'bold italic | link blod' });
    expect(await t(page, 'groups')).toEqual([['bold', 'italic'], ['link']]);
    expect((await t<string[]>(page, 'warnings')).filter((w) => w.includes('OE-CFG-1001'))).toHaveLength(1);
  });

  test('explicit image without upload-url warns', async ({ page }) => {
    await open(page, '', { toolbar: 'bold image' });
    expect(await t(page, 'tools')).toEqual(['bold']);
    expect((await t<string[]>(page, 'warnings')).some((w) => w.includes('OE-CFG-1003'))).toBe(true);
  });

  test('locale="ja" localises the toolbar and the editing area', async ({ page }) => {
    await open(page, '', { locale: 'ja' });
    await t(page, 'attr', 'label', null);
    expect(await t(page, 'toolbarLabel')).toBe('書式');
    expect((await t(page, 'button', 'ul')).label).toBe('箇条書き');
    expect(await t(page, 'contentLabel')).toBe('リッチテキストエディタ');
  });

  test('unsupported locale falls back to English with a warning; locales can be added', async ({ page }) => {
    await open(page, '', { locale: 'fr' });
    expect((await t(page, 'button', 'bold')).label).toBe('Bold');
    expect((await t<string[]>(page, 'warnings')).some((w) => w.includes('OE-CFG-1002'))).toBe(true);
    await t(page, 'defineLocale', 'fr', { bold: 'Gras' });
    await t(page, 'attr', 'locale', 'fr-CA');
    expect((await t(page, 'button', 'bold')).label).toBe('Gras');
    expect((await t(page, 'button', 'italic')).label).toBe('Italic');
  });

  test('icons can be replaced per page and per editor', async ({ page }) => {
    await open(page);
    await t(page, 'defineIcons', { italic: '<svg viewBox="0 0 24 24" data-custom="1"><circle cx="12" cy="12" r="4"/></svg>' });
    await t(page, 'attr', 'toolbar', 'bold italic');
    expect(await t<string>(page, 'iconMarkup', 'italic')).toContain('data-custom="1"');
    await page.evaluate(() => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('slot', 'icon-bold');
      document.getElementById('e')!.append(svg);
    });
    expect(await t(page, 'slotted', 'bold')).toBe(1);
  });
});

test.describe('inline formatting', () => {
  test('bold button and shortcut; pressed state follows the caret', async ({ page }) => {
    await open(page, '<p>hello world</p>');
    await content(page).click();
    await t(page, 'select', 'world');
    await btn(page, 'bold').click();
    expect(await t(page, 'value')).toBe('<p>hello <strong>world</strong></p>');
    await settle(page);
    expect((await t(page, 'button', 'bold')).pressed).toBe('true');
    expect((await t(page, 'button', 'bold')).part).toBe('btn btn-bold btn-active');
    await page.keyboard.press('ControlOrMeta+b');
    expect(await t(page, 'value')).toBe('<p>hello world</p>');
    await t(page, 'caretEnd', 'hello');
    await settle(page);
    expect((await t(page, 'button', 'bold')).pressed).toBe('false');
  });

  test('a tool left out of the toolbar loses its shortcut, including the browser’s own', async ({ page }) => {
    await open(page, '<p>hello world</p>', { toolbar: 'italic' });
    await content(page).click();
    await t(page, 'select', 'world');
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.press('ControlOrMeta+u');
    expect(await t(page, 'value')).toBe('<p>hello world</p>');
    await page.keyboard.press('ControlOrMeta+i');
    expect(await t(page, 'value')).toBe('<p>hello <em>world</em></p>');
  });
});

test.describe('blocks', () => {
  test('headings toggle back to a paragraph', async ({ page }) => {
    await open(page, '<p>title</p>');
    await content(page).click();
    await t(page, 'caretEnd', 'title');
    await btn(page, 'h2').click();
    expect(await t(page, 'value')).toBe('<h2>title</h2>');
    await btn(page, 'h2').click();
    expect(await t(page, 'value')).toBe('<p>title</p>');
    await btn(page, 'h3').click();
    expect(await t(page, 'value')).toBe('<h3>title</h3>');
    await btn(page, 'paragraph').click();
    expect(await t(page, 'value')).toBe('<p>title</p>');
  });

  test('quote wraps the selected blocks and unwraps them again', async ({ page }) => {
    await open(page, '<p>a</p><p>b</p><p>c</p>');
    await content(page).click();
    await page.evaluate(() => {
      const c = document.getElementById('e')!.shadowRoot!.querySelector('.orte-content')!;
      const ps = c.querySelectorAll('p');
      document.getSelection()!.setBaseAndExtent(ps[0]!.firstChild!, 0, ps[1]!.firstChild!, 1);
    });
    await btn(page, 'quote').click();
    expect(await t(page, 'value')).toBe('<blockquote><p>a</p><p>b</p></blockquote><p>c</p>');
    await btn(page, 'quote').click();
    expect(await t(page, 'value')).toBe('<p>a</p><p>b</p><p>c</p>');
  });

  test('lists: create, continue with Enter, switch type, end, split, join', async ({ page }) => {
    await open(page, '<p>one</p>');
    await content(page).click();
    await t(page, 'caretEnd', 'one');
    await btn(page, 'ul').click();
    expect(await t(page, 'value')).toBe('<ul><li>one</li></ul>');
    await page.keyboard.press('Enter');
    await page.keyboard.type('two');
    await page.keyboard.press('Enter');
    await page.keyboard.type('three');
    expect(await t(page, 'value')).toBe('<ul><li>one</li><li>two</li><li>three</li></ul>');
    await btn(page, 'ol').click();
    expect(await t(page, 'value')).toBe('<ol><li>one</li><li>two</li><li>three</li></ol>');
    // End the list for the middle item: the list splits around it.
    await t(page, 'caretEnd', 'two');
    await btn(page, 'ol').click();
    expect(await t(page, 'value')).toBe('<ol><li>one</li></ol><p>two</p><ol><li>three</li></ol>');
    // The caret stayed on "two": typing continues there.
    await page.keyboard.type('!');
    expect(await t(page, 'value')).toBe('<ol><li>one</li></ol><p>two!</p><ol><li>three</li></ol>');
    // Back into a list: it joins the list before it.
    await btn(page, 'ol').click();
    expect(await t(page, 'value')).toBe('<ol><li>one</li><li>two!</li></ol><ol><li>three</li></ol>');
  });

  test('code block: Enter adds a line, and it converts back to paragraphs', async ({ page }) => {
    await open(page, '<p>let a = 1;</p>');
    await content(page).click();
    await t(page, 'caretEnd', 'a = 1;');
    await btn(page, 'code').click();
    expect(await t(page, 'value')).toBe('<pre><code>let a = 1;</code></pre>');
    await page.keyboard.press('Enter');
    await page.keyboard.type('let b = 2;');
    expect(await t<string>(page, 'value')).toMatch(/^<pre><code>let a = 1;\nlet b = 2;\n?<\/code><\/pre>$/);
    expect((await t(page, 'button', 'bold')).disabled).toBe(true);
    await btn(page, 'code').click();
    expect(await t(page, 'value')).toBe('<p>let a = 1;</p><p>let b = 2;</p>');
  });
});

test.describe('links', () => {
  test('Ctrl/Cmd+K opens the dialog; a link is created with rel and target', async ({ page }) => {
    await open(page, '<p>see docs here</p>');
    await content(page).click();
    await t(page, 'select', 'docs');
    await page.keyboard.press('ControlOrMeta+k');
    expect(await t(page, 'popover')).toMatchObject({ open: true, url: '', removeShown: false, focused: true });
    await page.keyboard.type('https://example.com/docs');
    await t(page, 'newTab', true);
    await page.keyboard.press('Enter');
    expect(await t(page, 'value')).toBe('<p>see <a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">docs</a> here</p>');
    expect((await t(page, 'popover')).open).toBe(false);
  });

  test('unsafe URLs are refused with a message', async ({ page }) => {
    await open(page, '<p>click</p>');
    await content(page).click();
    await t(page, 'select', 'click');
    await btn(page, 'link').click();
    await page.keyboard.type('javascript:alert(1)');
    await page.keyboard.press('Enter');
    expect(await t(page, 'popover')).toMatchObject({ open: true, invalid: 'true', errorShown: true });
    expect(await t(page, 'value')).toBe('<p>click</p>');
    await page.keyboard.press('Escape');
    expect((await t(page, 'popover')).open).toBe(false);
  });

  test('editing and removing an existing link', async ({ page }) => {
    await open(page, '<p><a href="/old">docs</a></p>');
    await content(page).click();
    await t(page, 'caretEnd', 'do');
    await page.keyboard.press('ControlOrMeta+k');
    expect(await t(page, 'popover')).toMatchObject({ open: true, url: '/old', removeShown: true });
    await page.locator('#e [part~=btn-link-remove]').click();
    expect(await t(page, 'value')).toBe('<p>docs</p>');
  });

  test('with nothing selected, the URL becomes the link text', async ({ page }) => {
    await open(page, '<p>go </p>');
    await content(page).click();
    await t(page, 'caretEnd', 'go ');
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('https://example.com');
    await page.keyboard.press('Enter');
    await page.keyboard.type('!');
    // All three engines continue typing after the link, not inside it.
    expect(await t(page, 'value')).toBe('<p>go <a href="https://example.com" rel="noopener noreferrer">https://example.com</a>!</p>');
  });
});

test.describe('history and keyboard access', () => {
  test('undo is disabled until there is something to undo; the button reverts a command', async ({ page }) => {
    await open(page, '<p>hello world</p>');
    await settle(page);
    expect((await t(page, 'button', 'undo')).disabled).toBe(true);
    await content(page).click();
    await t(page, 'select', 'world');
    await btn(page, 'bold').click();
    await settle(page);
    expect((await t(page, 'button', 'undo')).disabled).toBe(false);
    await btn(page, 'undo').click();
    expect(await t(page, 'value')).toBe('<p>hello world</p>');
  });

  test('after undo, a button pressed once focus has left acts where the caret was (Firefox regression)', async ({ page }) => {
    await open(page, '<p>Hello</p>');
    await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<button id="out">out</button>'));
    await content(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await btn(page, 'bold').click();
    await content(page).click();
    await page.keyboard.press('ControlOrMeta+z');
    expect(await t(page, 'value')).toBe('<p>Hello</p>');
    await page.locator('#out').click();
    await btn(page, 'h2').click();
    // Firefox used to put a new, empty <h2> before the paragraph.
    expect(await t(page, 'value')).toBe('<h2>Hello</h2>');
  });

  test('undo back to the initial value leaves the caret inside the text, not before it', async ({ page }) => {
    await open(page, '<p>Hello</p>');
    await content(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await btn(page, 'bold').click();
    await page.keyboard.press('ControlOrMeta+z');
    await page.keyboard.type('X');
    expect(await t(page, 'value')).toBe('<p>HelloX</p>');
  });

  test('an undo / redo the browser runs itself (execCommand) is the editor\'s, in every engine', async ({ page, browserName }) => {
    await open(page, '<p>hello world</p>');
    await content(page).click();
    await t(page, 'select', 'world');
    await btn(page, 'bold').click();
    await t(page, 'caretEnd', 'world');
    await page.keyboard.type(' typed');
    // Chromium and Firefox undo natively here (no beforeinput), by a
    // history that knows nothing of the editor's.
    await page.evaluate(() => document.execCommand('undo'));
    expect(await t(page, 'value')).toBe('<p>hello <strong>world</strong></p>');
    await page.evaluate(() => document.execCommand('undo'));
    expect(await t(page, 'value')).toBe('<p>hello world</p>');
    await page.evaluate(() => document.execCommand('redo'));
    // Firefox has nothing to redo by its own history once the editor has put
    // the content back, and sends nothing at all: the redo simply does not
    // happen there. Chromium and WebKit redo through the editor.
    const redone = browserName === 'firefox' ? '<p>hello world</p>' : '<p>hello <strong>world</strong></p>';
    expect(await t(page, 'value')).toBe(redone);
    // Either way the keyboard continues from the same place.
    await page.keyboard.press('ControlOrMeta+Shift+z');
    expect(await t(page, 'value')).toBe(browserName === 'firefox' ? '<p>hello <strong>world</strong></p>' : '<p>hello <strong>world typed</strong></p>');
    expect(await t(page, 'errors')).toEqual([]);
  });

  test('roving focus: one tab stop, arrow keys move, disabled buttons are skipped', async ({ page }) => {
    await open(page, '<p>x</p>', { toolbar: 'undo bold italic | link' });
    await settle(page);
    expect((await t(page, 'button', 'undo')).tabIndex).toBe(-1); // disabled
    expect((await t(page, 'button', 'bold')).tabIndex).toBe(0);
    await btn(page, 'bold').focus();
    await page.keyboard.press('ArrowRight');
    expect(await t(page, 'focused')).toBe('italic');
    await page.keyboard.press('End');
    expect(await t(page, 'focused')).toBe('link');
    await page.keyboard.press('ArrowRight');
    expect(await t(page, 'focused')).toBe('bold');
  });
});

test.describe('leaving a code block', () => {
  test('Enter twice at the end of a final code block leaves it (reported: nothing could follow it)', async ({ page }) => {
    await open(page, '<p>a</p><pre><code>code</code></pre>');
    await content(page).click();
    await t(page, 'caretEnd', 'code');
    await page.keyboard.press('Enter');
    await page.keyboard.type('line');
    expect(await t(page, 'value')).toBe('<p>a</p><pre><code>code\nline</code></pre>');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('after');
    expect(await t(page, 'value')).toBe('<p>a</p><pre><code>code\nline</code></pre><p>after</p>');
    // One undo step brings the empty line back inside the block.
    await page.keyboard.press('ControlOrMeta+z');
    await page.keyboard.press('ControlOrMeta+z');
    // The empty line is back (the value drops only the invisible last newline).
    expect(await t(page, 'value')).toBe('<p>a</p><pre><code>code\nline\n</code></pre>');
  });

  test('ArrowDown or ArrowRight on the last line of a final code block makes a paragraph below', async ({ page }) => {
    for (const key of ['ArrowDown', 'ArrowRight']) {
      await open(page, '<pre><code>one\ntwo</code></pre>');
      await content(page).click();
      await t(page, 'caretEnd', 'two');
      await page.keyboard.press(key);
      await page.keyboard.type('x');
      expect(await t(page, 'value'), key).toBe('<pre><code>one\ntwo</code></pre><p>x</p>');
    }
  });

  test('a paragraph made to leave the block and not used is not saved; Enter at the end of the text is not either', async ({ page }) => {
    await open(page, '<pre><code>one</code></pre>');
    await content(page).click();
    await t(page, 'caretEnd', 'one');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    expect(await t(page, 'value')).toBe('<pre><code>one</code></pre>');
    // The paragraph is still there to use.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.type('x');
    expect(await t(page, 'value')).toBe('<pre><code>one</code></pre><p>x</p>');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    expect(await t(page, 'value')).toBe('<pre><code>one</code></pre><p>x</p>');
  });

  test('inside the block, Enter still adds lines and arrows still move', async ({ page }) => {
    await open(page, '<pre><code>one\ntwo</code></pre><p>b</p>');
    await content(page).click();
    await t(page, 'caretEnd', 'one');
    await page.keyboard.press('Enter');
    expect(await t(page, 'value')).toBe('<pre><code>one\n\ntwo</code></pre><p>b</p>');
    // Not the last block: ArrowDown leaves it to the browser (no new paragraph).
    await t(page, 'caretEnd', 'two');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.type('y');
    expect(await t(page, 'value')).not.toContain('<p>y</p><p>b</p>');
    expect(await t(page, 'value')).toContain('<pre><code>one\n\ntwo</code></pre>');
  });
});

test.describe('browsers with an older Selection API', () => {
  async function openWith(page: Page, api: 'old' | 'none', html: string) {
    await page.goto(`/toolbar.html?api=${api}`);
    await expect(page).toHaveTitle('ready');
    await t(page, 'set', html);
  }

  test('Safari 17/18 form, getComposedRanges(root): toolbar commands still work', async ({ page }) => {
    await openWith(page, 'old', '<p>hello world</p>');
    await content(page).click();
    await t(page, 'select', 'world');
    await btn(page, 'bold').click();
    expect(await t(page, 'value')).toBe('<p>hello <strong>world</strong></p>');
    await settle(page);
    expect((await t(page, 'button', 'bold')).pressed).toBe('true');
    expect(await t(page, 'errors')).toEqual([]);
  });

  test('no getComposedRanges (Firefox < 142): typing and saving still work', async ({ page }) => {
    await openWith(page, 'none', '<p>hello</p>');
    await content(page).click();
    await page.keyboard.press('End');
    await page.keyboard.type(' there');
    expect(await t(page, 'value')).toBe('<p>hello there</p>');
    await settle(page);
    // Commands that need the selection are shown disabled, not silently inert.
    for (const tool of ['bold', 'h2', 'ul', 'link', 'code']) expect((await t(page, 'button', tool)).disabled, tool).toBe(true);
    expect((await t(page, 'button', 'undo')).disabled).toBe(false);
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.type('!');
    expect(await t(page, 'value')).toBe('<p>hello there!</p>');
    await page.keyboard.press('ControlOrMeta+z');
    expect(await t(page, 'value')).toBe('<p>hello</p>');
    expect(await t(page, 'errors')).toEqual([]);
  });
});

test.describe('leaving the last block', () => {
  // Reported from macOS Safari 26: with a quote as the last block, ↓ could
  // not get below it, so nothing could be written after it.
  test('ArrowDown or ArrowRight at the end of a final quote or list makes a paragraph below', async ({ page }) => {
    const cases: [string, string, string][] = [
      ['<p>a</p><blockquote><p>one</p><p>two</p></blockquote>', 'two', '<p>a</p><blockquote><p>one</p><p>two</p></blockquote><p>x</p>'],
      ['<ul><li>one</li><li>two</li></ul>', 'two', '<ul><li>one</li><li>two</li></ul><p>x</p>'],
      ['<h2>title</h2>', 'title', '<h2>title</h2><p>x</p>'],
    ];
    for (const key of ['ArrowDown', 'ArrowRight']) {
      for (const [html, at, expected] of cases) {
        await open(page, html);
        await content(page).click();
        await t(page, 'caretEnd', at);
        await page.keyboard.press(key);
        await page.keyboard.type('x');
        expect(await t(page, 'value'), `${key} ${html}`).toBe(expected);
      }
    }
  });

  test('not on the last line: the arrow keys move as usual', async ({ page }) => {
    await open(page, '<blockquote><p>one</p><p>two</p></blockquote>');
    await content(page).click();
    await t(page, 'caretEnd', 'one');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.type('x');
    expect(await t(page, 'value')).not.toContain('<p>x</p>');
  });

  test('Enter on an empty last line of a quote leaves the quote', async ({ page }) => {
    await open(page, '<p>a</p><blockquote><p>q</p></blockquote><p>b</p>');
    await content(page).click();
    await t(page, 'caretEnd', 'q');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('x');
    expect(await t(page, 'value')).toBe('<p>a</p><blockquote><p>q</p></blockquote><p>x</p><p>b</p>');
  });
});
