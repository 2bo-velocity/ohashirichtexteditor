// Real-browser checks, in Chromium, Firefox and WebKit: HTML parsing, script
// execution and CSP enforcement as engines actually do them — what happy-dom
// cannot show. Each page reports through document.title: "PASS" or
// "FAIL <reasons>".
import { expect, test } from '@playwright/test';

for (const page of ['csp.html', 'robustness.html', 'sanitizer-cases.html']) {
  test(page, async ({ page: tab }) => {
    await tab.goto(`/${page}`);
    await expect(tab).not.toHaveTitle('pending', { timeout: 10_000 });
    const title = await tab.title();
    expect(title, title).toBe('PASS');
  });
}
