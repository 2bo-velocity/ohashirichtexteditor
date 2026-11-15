// The shared sanitiser cases, browser side (happy-dom). The PHP side runs the
// same file in tests/Sanitizer; test/browser runs it in real Chrome.
import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures/sanitizer-cases.json';
import { sanitizeToFragment } from '../../resources/js/core/sanitize';
import { normalize } from '../../resources/js/core/normalize';

function sanitize(html: string): string {
  const div = document.createElement('div');
  div.append(sanitizeToFragment(html));
  return div.innerHTML;
}

describe('shared sanitiser cases', () => {
  for (const c of fixtures.cases as Array<{ name: string; input: string; expected: string; normalized?: string; skipIn?: Record<string, string> }>) {
    it.skipIf(c.skipIn?.['happy-dom'] !== undefined)(c.name, () => {
      expect(sanitize(c.input)).toBe(c.expected);
      const div = document.createElement('div');
      div.append(sanitizeToFragment(c.input));
      normalize(div);
      expect(div.innerHTML).toBe(c.normalized ?? c.expected);
    });
  }
});
