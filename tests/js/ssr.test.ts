// @vitest-environment node
//
// Inertia SSR renders pages in Node. Importing the editor (directly, or through
// an adapter) must not throw there: no HTMLElement, no customElements.
import { describe, expect, it } from 'vitest';

describe('server-side rendering', () => {
  it('runs without a DOM', () => {
    expect(typeof HTMLElement).toBe('undefined');
    expect(typeof customElements).toBe('undefined');
  });

  it('imports the core without throwing', async () => {
    const core = await import('../../resources/js/index');
    expect(core.TAG_NAME).toBe('ohashi-rich-text-editor');
    expect(() => core.defineOhashiEditor()).not.toThrow();
  });

  it('renders the Vue adapter to a string', async () => {
    const { createSSRApp, h } = await import('vue');
    const { renderToString } = await import('vue/server-renderer');
    const { OhashiEditor } = await import('../../resources/js/adapters/vue');

    const html = await renderToString(createSSRApp({ render: () => h(OhashiEditor, { name: 'body' }) }));

    expect(html).toContain('<ohashi-rich-text-editor');
    expect(html).toContain('name="body"');
  });

  it('renders the React adapter to a string', async () => {
    const { createElement } = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { OhashiEditor } = await import('../../resources/js/adapters/react');

    const html = renderToString(createElement(OhashiEditor, { name: 'body', value: '', onChange: () => {} }));

    expect(html).toContain('<ohashi-rich-text-editor');
    expect(html).toContain('name="body"');
  });
});
