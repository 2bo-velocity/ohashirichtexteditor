// Manual IME check: real IMEs (Windows / macOS / Android) emit event orders
// that cannot be reproduced by automation. This page records them verbatim.
import './ohashi-editor.js';
import { copyRecord, saveRecord, stamp } from './deliver.js';

await customElements.whenDefined('ohashi-rich-text-editor');
const host = document.querySelector('ohashi-rich-text-editor');
const content = host.shadowRoot.querySelector('.orte-content');
const log = document.getElementById('log');
const lines = [];
const t0 = performance.now();
const push = (type, text) => {
  lines.push(`${(performance.now() - t0).toFixed(0).padStart(6)}ms ${type.padEnd(17)} ${text}`);
  log.textContent = lines.join('\n');
  log.scrollTop = log.scrollHeight;
};

// Where the caret is, readable without the DOM: the block it is in (counted
// among the top-level blocks) and the text around it, "|" marking the caret.
const composedRange = () => {
  const sel = document.getSelection();
  if (!sel || !sel.rangeCount || typeof sel.getComposedRanges !== 'function') return null;
  let ranges;
  try { ranges = sel.getComposedRanges({ shadowRoots: [host.shadowRoot] }); }
  catch { ranges = sel.getComposedRanges(host.shadowRoot); } // Safari 17 / 18
  const r = ranges[0];
  return r && content.contains(r.startContainer) && content.contains(r.endContainer) ? r : null;
};
const where = (node, offset) => {
  let block = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  if (block === content) {
    const child = content.childNodes[offset];
    return `between blocks, before #${child ? Array.prototype.indexOf.call(content.children, child) + 1 : 'end'}`;
  }
  let top = block;
  while (top.parentNode !== content) top = top.parentNode;
  while (block !== top && !/^(p|h[1-6]|li|pre|blockquote|td|th)$/.test(block.localName)) block = block.parentNode;
  const before = document.createRange();
  before.setStart(block, 0);
  before.setEnd(node, offset);
  const head = before.toString();
  const tail = (block.textContent ?? '').slice(head.length);
  const path = block === top ? `<${top.localName}>` : `<${top.localName}> <${block.localName}>`;
  return `#${Array.prototype.indexOf.call(content.children, top) + 1} ${path} ${JSON.stringify(head.slice(-8) + '|' + tail.slice(0, 8))}`;
};
const caret = () => {
  const r = composedRange();
  if (!r) return '(outside the editor)';
  if (r.collapsed) return where(r.startContainer, r.startOffset);
  return `from ${where(r.startContainer, r.startOffset)} to ${where(r.endContainer, r.endOffset)}`;
};

// Clicks, and where the caret is after a click or a key that moves it — so a
// jump the user made can be told from one the editor made. Logged on keyup:
// macOS sends only the keyup when its candidate window took the keydown.
const MOVES = /^(Arrow|Home$|End$|Page)/;
content.addEventListener('mousedown', (e) => push('mousedown', `on <${e.target.localName}>`));
content.addEventListener('mouseup', () => setTimeout(() => push('caret', caret())));
content.addEventListener('keyup', (e) => { if (MOVES.test(e.key)) setTimeout(() => push('caret', caret())); });

document.getElementById('env').textContent = navigator.userAgent;

for (const type of ['keydown', 'keyup', 'compositionstart', 'compositionupdate', 'compositionend', 'beforeinput', 'input']) {
  content.addEventListener(type, (e) => {
    const parts = [`${(performance.now() - t0).toFixed(0).padStart(6)}ms`, type.padEnd(17)];
    if (e.key !== undefined) parts.push(`key=${JSON.stringify(e.key)} code=${e.keyCode}`);
    if (e.inputType !== undefined) parts.push(`inputType=${e.inputType}`);
    if (e.isComposing !== undefined) parts.push(`isComposing=${e.isComposing}`);
    if (e.data != null) parts.push(`data=${JSON.stringify(e.data)}`);
    if (type === 'beforeinput') parts.push(`cancelable=${e.cancelable}`);
    if (type === 'input' || type === 'compositionend') parts.push(`\n${' '.repeat(26)}html=${content.innerHTML}`);
    lines.push(parts.join(' '));
    log.textContent = lines.join('\n');
    log.scrollTop = log.scrollHeight;
  });
}
// What the editor made of it: its own `input` fires after normalisation, also
// for toolbar buttons, undo and paste, which leave no keyboard trace above.
host.addEventListener('input', () => push('editor value', host.value));
host.shadowRoot.querySelector('[part~=toolbar]').addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (button) push('toolbar', button.dataset.tool);
}, true);

const record = () => `${document.getElementById('ime').value || '(environment not given)'}\n${navigator.userAgent}\n${lines.join('\n')}`;
document.getElementById('copy').onclick = () => copyRecord(record(), document.getElementById('out'), document.getElementById('status'));
document.getElementById('save').onclick = () => saveRecord(record(), `ime-log-${stamp()}.txt`);
document.getElementById('clear').onclick = () => { lines.length = 0; log.textContent = ''; };
