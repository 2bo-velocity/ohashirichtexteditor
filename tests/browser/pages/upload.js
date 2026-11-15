// Helpers for upload.spec.ts. The /upload endpoint is mocked by the test (page.route).
import './ohashi-editor.js';

await customElements.whenDefined('ohashi-rich-text-editor');
const el = document.getElementById('e');
const root = () => el.shadowRoot;
const content = () => root().querySelector('.orte-content');
const errors = [];
el.addEventListener('ohashi-error', (e) => errors.push({ code: e.detail.code, message: e.detail.message, params: e.detail.params }));

/** A real 8 × 8 PNG, drawn on a canvas. */
const png = () =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 8;
    canvas.getContext('2d').fillRect(0, 0, 8, 8);
    canvas.toBlob((blob) => resolve(new File([blob], 'shot.png', { type: 'image/png' })), 'image/png');
  });

function textPoint(word) {
  const walker = document.createTreeWalker(content(), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const i = n.data.indexOf(word);
    if (i >= 0) return [n, i + word.length];
  }
  return null;
}

window.t = {
  set: (html) => { el.value = html; },
  value: () => el.value,
  attr: (name, value) => (value === null ? el.removeAttribute(name) : el.setAttribute(name, value)),
  caretAfter: (word) => {
    const [n, i] = textPoint(word);
    content().focus();
    document.getSelection().setBaseAndExtent(n, i, n, i);
  },
  errors: () => errors.slice(),
  busy: () => content().getAttribute('aria-busy'),
  notices: () =>
    [...root().querySelectorAll('[part~=notice]')].map((n) => ({
      part: n.getAttribute('part'),
      role: n.getAttribute('role'),
      message: n.querySelector('[part=notice-message]')?.textContent ?? null,
      code: n.querySelector('[part=notice-code]')?.textContent ?? null,
      background: getComputedStyle(n).backgroundColor,
    })),
  /** Notice sits between toolbar and content: [toolbar bottom, notice top, notice bottom, content top]. */
  layout: () => {
    const toolbar = root().querySelector('[part~=toolbar]').getBoundingClientRect();
    const notice = root().querySelector('[part~=notice]').getBoundingClientRect();
    const box = content().getBoundingClientRect();
    return [toolbar.bottom, notice.top, notice.bottom, box.top];
  },
  // Puts a real PNG on the system clipboard; the test then presses Ctrl/Cmd+V.
  // (A synthetic paste event would not do: Firefox drops its files.)
  copyImage: async () => {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': await png() })]);
  },
  dropAfter: async (word, file) => {
    const [n, i] = textPoint(word);
    const r = document.createRange();
    r.setStart(n, i - 1);
    r.setEnd(n, i);
    const rect = r.getBoundingClientRect();
    const dt = new DataTransfer();
    dt.items.add(file === 'pdf' ? new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' }) : await png());
    const event = new DragEvent('drop', { dataTransfer: dt, clientX: rect.right - 1, clientY: rect.top + rect.height / 2, bubbles: true, cancelable: true, composed: true });
    content().dispatchEvent(event);
    return event.defaultPrevented;
  },
  imagePopover: () => {
    const p = root().querySelector('[part~=popover-image]');
    const alt = p.querySelector('[part~=input-image-alt]');
    return {
      open: !p.hidden,
      alt: alt.value,
      focused: root().activeElement === alt,
      hintVisible: (() => {
        const hint = p.querySelector('.orte-popover-hint');
        return !hint.hidden && hint.getBoundingClientRect().height > 0 && alt.getAttribute('aria-describedby') === hint.id;
      })(),
      widths: [...p.querySelectorAll('[part~=btn-image-width]')].map((b) => b.getAttribute('part')),
    };
  },
};
document.title = 'ready';
