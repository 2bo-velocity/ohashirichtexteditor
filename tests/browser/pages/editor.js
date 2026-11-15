// Helpers for pipeline.spec.ts: the real editor, driven by real input.
import './ohashi-editor.js';

await customElements.whenDefined('ohashi-rich-text-editor');
const el = document.querySelector('ohashi-rich-text-editor');
const root = el.shadowRoot;
const content = root.querySelector('.orte-content');
let changes = 0;
el.addEventListener('change', () => changes++);
window.pwned = false;

window.t = {
  set: (html) => { el.value = html; changes = 0; },
  value: () => el.value,
  raw: () => content.innerHTML,
  form: () => new FormData(document.getElementById('f')).get('body'),
  changes: () => changes,
  selected: () => {
    const [r] = document.getSelection().getComposedRanges({ shadowRoots: [root] });
    if (!r) return null;
    const range = document.createRange();
    range.setStart(r.startContainer, r.startOffset);
    range.setEnd(r.endContainer, r.endOffset);
    return range.toString();
  },
  select: (word) => {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.data.indexOf(word);
      if (i >= 0) { document.getSelection().setBaseAndExtent(n, i, n, i + word.length); return true; }
    }
    return false;
  },
  exec: (command, value) => document.execCommand(command, false, value),
  clipboard: async (html, text) => {
    const items = { 'text/plain': new Blob([text ?? 'plain'], { type: 'text/plain' }) };
    if (html) items['text/html'] = new Blob([html], { type: 'text/html' });
    await navigator.clipboard.write([new ClipboardItem(items)]);
  },
  // A drop from outside the editor at the end of `word`.
  dropAfter: (word, html) => {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.data.indexOf(word);
      if (i < 0) continue;
      const r = document.createRange();
      r.setStart(n, i + word.length - 1);
      r.setEnd(n, i + word.length);
      const rect = r.getBoundingClientRect();
      const dt = new DataTransfer();
      dt.setData('text/html', html);
      dt.setData('text/plain', 'x');
      const event = new DragEvent('drop', { dataTransfer: dt, clientX: rect.right - 1, clientY: rect.top + rect.height / 2, bubbles: true, cancelable: true, composed: true });
      content.dispatchEvent(event);
      return event.defaultPrevented;
    }
    return null;
  },
};
document.title = 'ready';
