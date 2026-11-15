// The shared sanitiser cases (tests/fixtures/sanitizer-cases.json) in real
// Chrome, through the editor's own `value` setter — the authoritative check of
// what a browser parses, since happy-dom's parser differs in places.
import './ohashi-editor.js';

const { cases } = await (await fetch('sanitizer-cases.json')).json();
const el = document.getElementById('e');
window.pwned = false;
const failures = [];
for (const c of cases) {
  if (c.skipIn?.chrome) continue;
  // The editor's value is sanitised and then normalised.
  el.value = c.input;
  const expected = c.normalized ?? c.expected;
  if (el.value !== expected) failures.push(`${c.name}: got ${el.value}`);
}
setTimeout(() => {
  if (window.pwned !== false) failures.push(`payload executed (pwned = ${window.pwned})`);
  document.title = failures.length ? `FAIL ${failures.join(' | ')}` : 'PASS';
}, 300);
