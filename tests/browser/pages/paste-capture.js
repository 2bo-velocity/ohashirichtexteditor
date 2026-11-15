// Manual capture of what office applications put on the clipboard, for the
// paste test cases. The paste goes into the editor itself, so the result is
// what a real paste produces (paste has its own handling, e.g. WebKit's
// &nbsp; between words); a capture-phase listener on the host records the raw
// clipboard first, without taking the event from the editor.
import './ohashi-editor.js';
import { copyRecord, saveRecord, stamp } from './deliver.js';

await customElements.whenDefined('ohashi-rich-text-editor');
const editor = document.getElementById('editor');
const $ = (id) => document.getElementById(id);
let captured = null;

editor.addEventListener('paste', (e) => {
  const data = e.clipboardData;
  const types = [...data.types];
  const html = data.getData('text/html');
  const text = data.getData('text/plain');
  const files = [...data.files].map((f) => ({ name: f.name, type: f.type, size: f.size }));
  const before = editor.value;
  captured = {
    source: $('source').value || '(not given)',
    userAgent: navigator.userAgent,
    types,
    files,
    text,
    html,
    valueBefore: before,
    editorValue: null,
  };
  $('types').textContent = JSON.stringify({ types, files, htmlBytes: html.length, textBytes: text.length }, null, 2);
  $('html').textContent = html || '(no text/html)';
  $('result').textContent = '…';
  // The editor reports its new value with an `input` event; a paste it
  // ignored (nothing usable on the clipboard) sends none.
  const done = () => {
    captured.editorValue = editor.value;
    $('result').textContent = editor.value === before ? `${editor.value}\n(unchanged by the paste)` : editor.value;
    $('copy').disabled = false;
    $('save').disabled = false;
  };
  const timer = setTimeout(() => { editor.removeEventListener('input', onInput); done(); }, 1000);
  const onInput = () => { clearTimeout(timer); done(); };
  editor.addEventListener('input', onInput, { once: true });
}, { capture: true });

$('reset').onclick = () => {
  editor.value = '';
  captured = null;
  for (const id of ['types', 'html', 'result', 'status']) $(id).textContent = '';
  $('out').hidden = true;
  $('copy').disabled = true;
  $('save').disabled = true;
};

const record = () => {
  captured.source = $('source').value || captured.source;
  return JSON.stringify(captured, null, 2);
};
$('copy').onclick = () => copyRecord(record(), $('out'), $('status'));
$('save').onclick = () => saveRecord(record(), `paste-capture-${stamp()}.json`);
