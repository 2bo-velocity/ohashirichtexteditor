import { afterEach, describe, expect, it } from 'vitest';
import { OhashiEditorElement, TAG_NAME } from '../../resources/js/index';

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(html = ''): OhashiEditorElement {
  document.body.innerHTML = `<${TAG_NAME} name="body"></${TAG_NAME}>`;
  const el = document.querySelector(TAG_NAME) as OhashiEditorElement;
  if (html) el.value = html;
  return el;
}

describe('OhashiEditorElement', () => {
  it('registers the custom element', () => {
    expect(customElements.get(TAG_NAME)).toBe(OhashiEditorElement);
  });

  it('renders its UI inside a shadow root', () => {
    const el = mount();
    expect(el.shadowRoot?.querySelector('.orte-content')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('.orte-toolbar')).not.toBeNull();
    // Nothing visible is rendered into the light DOM, where page CSS could
    // reach it. (happy-dom has no ElementInternals, so the hidden fallback
    // input is the one permitted child here.)
    const visible = Array.from(el.children).filter((c) => !(c instanceof HTMLInputElement && c.type === 'hidden'));
    expect(visible.length).toBe(0);
  });

  it('exposes the documented parts', () => {
    const el = mount();
    for (const part of ['container', 'toolbar', 'content']) {
      expect(el.shadowRoot?.querySelector(`[part~="${part}"]`), part).not.toBeNull();
    }
  });

  it('declares the documented custom properties on :host', () => {
    const el = mount();
    // Adopted stylesheet where supported, <style> fallback otherwise.
    const root = el.shadowRoot!;
    const css =
      root.querySelector('style')?.textContent ??
      Array.from(root.adoptedStyleSheets ?? [])
        .flatMap((sheet) => Array.from(sheet.cssRules, (rule) => rule.cssText))
        .join('\n');
    for (const name of [
      '--orte-font-family',
      '--orte-text-color',
      '--orte-muted-color',
      '--orte-editor-bg',
      '--orte-toolbar-bg',
      '--orte-border-color',
      '--orte-border-radius',
      '--orte-accent-color',
      '--orte-on-accent-color',
      '--orte-danger-color',
      '--orte-danger-bg',
      '--orte-code-bg',
      '--orte-code-color',
      '--orte-icon-size',
      '--orte-min-height',
    ]) {
      expect(css, name).toContain(`${name}:`);
    }
  });

  it('reflects the name property to the attribute', () => {
    // Vue and React set properties, not attributes, on custom elements.
    const el = mount();
    el.name = 'title';
    expect(el.getAttribute('name')).toBe('title');
    expect(el.name).toBe('title');
  });

  it('takes its initial value from the attribute', () => {
    document.body.innerHTML = `<${TAG_NAME} value="<p>Hello</p>"></${TAG_NAME}>`;
    const el = document.querySelector(TAG_NAME) as OhashiEditorElement;
    expect(el.value).toBe('<p>Hello</p>');
  });

  it('emits a composed change event on input', () => {
    const el = mount('<p>a</p>');
    let received: string | null = null;
    document.body.addEventListener('change', (e) => {
      received = (e as CustomEvent<{ html: string }>).detail.html;
    });

    el.shadowRoot?.querySelector('.orte-content')?.dispatchEvent(new Event('input'));

    expect(received).toBe('<p>a</p>');
  });

  it('stops listening once disconnected', () => {
    const el = mount('<p>a</p>');
    const content = el.shadowRoot?.querySelector('.orte-content');
    let count = 0;
    el.addEventListener('change', () => count++);

    el.remove();
    content?.dispatchEvent(new Event('input'));

    expect(count).toBe(0);
  });

  it('keeps the same DOM when the same value is written back', () => {
    const el = mount('<p>a</p>');
    const first = el.shadowRoot?.querySelector('.orte-content p');
    el.value = '<p>a</p>';
    expect(el.shadowRoot?.querySelector('.orte-content p')).toBe(first);
  });
});

describe('accessibility and empty states', () => {
  it('gives the editable area an accessible name', () => {
    const el = mount();
    const content = el.shadowRoot!.querySelector('.orte-content')!;
    expect(content.getAttribute('aria-label')).toBe('Rich text editor');

    el.setAttribute('label', 'Article body');
    expect(content.getAttribute('aria-label')).toBe('Article body');

    el.removeAttribute('label');
    expect(content.getAttribute('aria-label')).toBe('Rich text editor');
  });

  it('hides the toolbar while it has no buttons', () => {
    const el = mount();
    const css = Array.from(el.shadowRoot!.adoptedStyleSheets ?? [])
      .flatMap((s) => Array.from(s.cssRules, (r) => r.cssText))
      .join('\n') || (el.shadowRoot!.querySelector('style')?.textContent ?? '');
    expect(css).toMatch(/\.orte-toolbar:empty\s*\{[^}]*display:\s*none/);
  });
});
