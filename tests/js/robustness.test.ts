// Failure modes found by reviewing the editor and reproducing them in Chrome.
// Each test pins one of them down.
import { afterEach, describe, expect, it } from 'vitest';
import { OhashiEditorElement, TAG_NAME } from '../../resources/js/index';

afterEach(() => {
  document.body.innerHTML = '';
});

function content(el: Element): HTMLElement {
  return el.shadowRoot!.querySelector('.orte-content') as HTMLElement;
}

function mount(): OhashiEditorElement {
  document.body.innerHTML = `<form><${TAG_NAME} name="body"></${TAG_NAME}></form>`;
  return document.querySelector(TAG_NAME) as OhashiEditorElement;
}

describe('stored content is made inert before it reaches the live DOM', () => {
  // innerHTML on a live element runs inline event handlers: saved content with
  // <img onerror> executed in Chrome the moment the editor loaded it.
  it('drops script elements', () => {
    const el = mount();
    el.value = '<p>a</p><script>window.pwned = 1</script>';
    expect(content(el).querySelector('script')).toBeNull();
    expect(el.value).toBe('<p>a</p>');
  });

  it('drops inline event handler attributes', () => {
    const el = mount();
    el.value = '<p onclick="x()">a</p><img src="/a.png" onerror="x()">';
    expect(el.value).not.toMatch(/onclick|onerror/);
    expect(content(el).querySelector('img')?.getAttribute('src')).toBe('/a.png');
  });

  it('drops script-capable URLs', () => {
    const el = mount();
    el.value = '<a href="javascript:alert(1)">a</a><a href=" JaVaScRiPt:alert(1)">b</a><img src="data:text/html,x">';
    expect(el.value).not.toMatch(/javascript:|data:text/i);
  });

  it('removes embedding and styling elements together with their content', () => {
    const el = mount();
    el.value = '<iframe src="https://evil.example"></iframe><style>*{display:none}</style><p>kept</p>';
    expect(el.value).toBe('<p>kept</p>');
  });

  it('removes svg together with any script inside it', () => {
    // (Content *after* an <svg> is checked in a real browser: happy-dom's
    // parser swallows it, unlike browsers.)
    const el = mount();
    el.value = '<svg><script>x()</script></svg>';
    expect(el.value).toBe('');
  });

  it('unwraps unknown elements but keeps their text', () => {
    const el = mount();
    el.value = '<p><span style="color:red">red</span> <font>old</font></p>';
    expect(el.value).toBe('<p>red old</p>');
  });

  it('keeps the formatting the editor supports', () => {
    const el = mount();
    const html =
      '<h2>T</h2><p><strong>b</strong> <em>i</em> <s>s</s> <a href="https://example.com" rel="noopener noreferrer">l</a></p>' +
      '<blockquote><p>q</p></blockquote><ul><li>u</li></ul><ol><li>o</li></ol>' +
      '<pre><code>c</code></pre><table><tbody><tr><th>h</th><td>d</td></tr></tbody></table>' +
      '<p><img src="/a.png" alt="A"></p>';
    el.value = html;
    expect(el.value).toBe(html);
  });

  it('forces rel=noopener noreferrer on links', () => {
    const el = mount();
    el.value = '<p><a href="https://example.com" target="_blank">l</a></p>';
    expect(content(el).querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('values a framework may pass', () => {
  // React with `value={data.body}` on a nullable column passes undefined, which
  // innerHTML turns into the text "undefined".
  it('treats undefined and null as empty', () => {
    const el = mount();
    el.value = undefined;
    expect(el.value).toBe('');
    el.value = '<p>a</p>';
    el.value = null;
    expect(el.value).toBe('');
  });
});

describe('properties set before the element is upgraded', () => {
  // Module scripts are deferred, so a page script can set `value` before the
  // class exists. That plain own property then shadowed the accessor: the
  // editor showed nothing while the form kept submitting the stale value.
  it('applies a value set before upgrade, and keeps tracking edits', () => {
    const tag = 'orte-upgrade-probe';
    document.body.innerHTML = `<form><${tag} name="body"></${tag}></form>`;
    const early = document.querySelector(tag) as unknown as { value: string };
    early.value = '<p>early</p>';

    customElements.define(tag, class extends OhashiEditorElement {});
    const el = document.querySelector(tag) as OhashiEditorElement;

    expect(Object.prototype.hasOwnProperty.call(el, 'value')).toBe(false);
    expect(content(el).innerHTML).toBe('<p>early</p>');

    content(el).innerHTML = '<p>edited</p>';
    expect(el.value).toBe('<p>edited</p>');
  });
});

describe('form submission without ElementInternals', () => {
  // Safari before 16.4 has no ElementInternals: the value never reached the
  // form, silently.
  it('falls back to a hidden input', () => {
    const original = HTMLElement.prototype.attachInternals;
    // @ts-expect-error simulate a browser without ElementInternals
    delete HTMLElement.prototype.attachInternals;
    try {
      const tag = 'orte-no-internals-probe';
      customElements.define(tag, class extends OhashiEditorElement {});
      document.body.innerHTML = `<form><${tag} name="body"></${tag}></form>`;
      const el = document.querySelector(tag) as OhashiEditorElement;
      el.value = '<p>a</p>';

      const form = document.querySelector('form')!;
      expect(new FormData(form).get('body')).toBe('<p>a</p>');

      el.name = 'renamed';
      expect(new FormData(form).get('renamed')).toBe('<p>a</p>');
      expect(new FormData(form).get('body')).toBeNull();
    } finally {
      HTMLElement.prototype.attachInternals = original;
    }
  });
});

describe('form submission with ElementInternals', () => {
  it('uses ElementInternals and adds no light-DOM input when available', () => {
    const submitted: unknown[] = [];
    const original = HTMLElement.prototype.attachInternals;
    HTMLElement.prototype.attachInternals = function () {
      return { setFormValue: (v: unknown) => submitted.push(v) } as unknown as ElementInternals;
    };
    try {
      const tag = 'orte-internals-probe';
      customElements.define(tag, class extends OhashiEditorElement {});
      document.body.innerHTML = `<form><${tag} name="body"></${tag}></form>`;
      const el = document.querySelector(tag) as OhashiEditorElement;
      el.value = '<p>a</p>';

      expect(submitted.at(-1)).toBe('<p>a</p>');
      expect(el.children.length).toBe(0);
    } finally {
      HTMLElement.prototype.attachInternals = original;
    }
  });
});
