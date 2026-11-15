// The single-file manual pages (standalone.mjs) are opened by double-click on
// machines without Node, so they must work from file:// with no server — and
// recording must still reach the developer when the clipboard API is refused.
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

let dir = '';
test.beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'orte-standalone-'));
  execFileSync(process.execPath, ['tests/browser/standalone.mjs'], { env: { ...process.env, OUT: dir } });
});
const url = (name: string) => pathToFileURL(join(dir, `${name}.html`)).href;

test('ime-log works from file:// and records typing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url('ime-log'));
  const content = page.locator('ohashi-rich-text-editor [part~=content]');
  await expect(content).toBeVisible();
  await content.locator('p').first().click();
  await page.keyboard.press('End');
  await page.keyboard.type('ab');
  await expect(page.locator('#log')).toContainText('editor value');
  await expect(page.locator('#log')).toContainText('テストab');
  // Clicks and caret moves are recorded, so a jump can be told from a click.
  await expect(page.locator('#log')).toContainText('mousedown');
  await page.keyboard.press('Home');
  await expect(page.locator('#log')).toContainText('caret             #1 <p> "|テストab"');

  await page.locator('#ime').fill('test env');
  await page.locator('#copy').click();
  // Whichever copy path the engine allows, the record is shown and complete.
  await expect(page.locator('#status')).toContainText(/Copied|Ctrl\+C/);
  await expect(page.locator('#out')).toBeVisible();
  const record = await page.locator('#out').inputValue();
  expect(record.startsWith('test env\n')).toBe(true);
  expect(record).toContain('テストab');

  const download = page.waitForEvent('download');
  await page.locator('#save').click();
  expect((await download).suggestedFilename()).toMatch(/^ime-log-.*\.txt$/);
  expect(errors).toEqual([]);
});

test('paste-capture works from file:// and shows what the editor keeps', async ({ page, browserName }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url('paste-capture'));
  await expect(page.locator('ohashi-rich-text-editor [part~=content]')).toBeVisible();
  // A real paste (Firefox drops data from a synthetic ClipboardEvent).
  if (browserName === 'chromium') await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => navigator.clipboard.write([new ClipboardItem({
    'text/html': new Blob(['<p style="color:red"><span>Hi</span> <b>there</b><script>alert(1)<\/script></p>'], { type: 'text/html' }),
    'text/plain': new Blob(['Hi there'], { type: 'text/plain' }),
  })]));
  await page.locator('ohashi-rich-text-editor [part~=content]').click();
  await page.keyboard.press('ControlOrMeta+v');
  await expect(page.locator('#result')).toHaveText('<p>Hi <strong>there</strong></p>');

  await page.locator('#source').fill('synthetic');
  await page.locator('#copy').click();
  await expect(page.locator('#out')).toBeVisible();
  const fixture = JSON.parse(await page.locator('#out').inputValue());
  expect(fixture.source).toBe('synthetic');
  expect(fixture.html).toMatch(/color:\s*red/);
  expect(fixture.editorValue).toBe('<p>Hi <strong>there</strong></p>');

  const download = page.waitForEvent('download');
  await page.locator('#save').click();
  expect((await download).suggestedFilename()).toMatch(/^paste-capture-.*\.json$/);
  expect(errors).toEqual([]);
});
