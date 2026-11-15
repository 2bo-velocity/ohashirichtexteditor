// The adapters listen for `change`, a name native events also use. A native
// change event has no `detail`, and reading `detail.html` from it threw.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TAG_NAME } from '../../resources/js/index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('React adapter', () => {
  it('ignores a change event that is not the editor’s', async () => {
    const { act, createElement } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { OhashiEditor } = await import('../../resources/js/adapters/react');
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const onChange = vi.fn();
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    await act(async () => root.render(createElement(OhashiEditor, { value: '', onChange, name: 'body' })));

    const el = host.querySelector(TAG_NAME)!;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();

    el.dispatchEvent(new CustomEvent('change', { detail: { html: '<p>x</p>' }, bubbles: true }));
    expect(onChange).toHaveBeenCalledWith('<p>x</p>');

    await act(async () => root.unmount());
  });
});

describe('React adapter attributes', () => {
  it('passes upload and UI settings to the element and reports errors', async () => {
    const { act, createElement } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { OhashiEditor } = await import('../../resources/js/adapters/react');
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const onError = vi.fn();
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    await act(async () =>
      root.render(createElement(OhashiEditor, { value: '', onChange: () => {}, uploadUrl: '/up', uploadMaxSize: 1024, locale: 'ja', toolbar: 'bold image', onError })),
    );

    const el = host.querySelector(TAG_NAME)!;
    expect([el.getAttribute('upload-url'), el.getAttribute('upload-max-size'), el.getAttribute('locale'), el.getAttribute('toolbar')]).toEqual(['/up', '1024', 'ja', 'bold image']);
    expect(el.shadowRoot!.querySelector('[part~="btn-image"]')).not.toBeNull();
    el.dispatchEvent(new CustomEvent('ohashi-error', { detail: { code: 'OE-UPL-4002' } }));
    expect(onError.mock.calls[0]![0].detail.code).toBe('OE-UPL-4002');

    await act(async () => root.unmount());
  });
});

describe('Vue adapter attributes', () => {
  it('lets attributes and the error listener fall through to the element', async () => {
    const { createApp, h, nextTick } = await import('vue');
    const { OhashiEditor } = await import('../../resources/js/adapters/vue');

    const codes: string[] = [];
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp({
      render: () =>
        h(OhashiEditor, { modelValue: '', 'upload-url': '/up', onOhashiError: (e: CustomEvent<{ code: string }>) => codes.push(e.detail.code) }),
    });
    app.mount(host);
    await nextTick();

    const el = host.querySelector(TAG_NAME)!;
    expect(el.getAttribute('upload-url')).toBe('/up');
    el.dispatchEvent(new CustomEvent('ohashi-error', { detail: { code: 'OE-UPL-4002' } }));
    expect(codes).toEqual(['OE-UPL-4002']);
    app.unmount();
  });
});

describe('Vue adapter', () => {
  it('ignores a change event that is not the editor’s', async () => {
    const { createApp, h, nextTick } = await import('vue');
    const { OhashiEditor } = await import('../../resources/js/adapters/vue');

    const updates: string[] = [];
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp({
      render: () => h(OhashiEditor, { modelValue: '', 'onUpdate:modelValue': (v: string) => updates.push(v) }),
    });
    app.mount(host);
    await nextTick();

    const el = host.querySelector(TAG_NAME)!;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(updates).toEqual([]);

    el.dispatchEvent(new CustomEvent('change', { detail: { html: '<p>x</p>' }, bubbles: true }));
    expect(updates).toEqual(['<p>x</p>']);

    app.unmount();
  });
});
