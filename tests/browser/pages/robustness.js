// Checks that need a real browser parser and real script execution.
import './ohashi-editor.js';

const failures = [];
const check = (ok, what) => ok || failures.push(what);
const content = (el) => el.shadowRoot.querySelector('.orte-content');
const form = document.getElementById('f');

// A value set before upgrade is applied, and later edits are tracked.
const early = document.getElementById('early');
check(content(early).innerHTML === '<p>early</p>', 'early value not shown');
content(early).innerHTML = '<p>typed</p>';
content(early).dispatchEvent(new Event('input'));
check(new FormData(form).get('body') === '<p>typed</p>', 'edits after early value not submitted');

// Stored XSS payloads must not execute, and content after them must survive.
const other = document.getElementById('other');
const payloads = [
  '<img src="data:x" onerror="window.pwned = 1">',
  '<svg><script>window.pwned = 2</script></svg><p>after</p>',
  '<svg onload="window.pwned = 3"></svg>',
  '<iframe srcdoc="<script>parent.pwned = 4</script>"></iframe>',
  '<a href="java&#x09;script:window.pwned=5">x</a>',
  '<math><mtext><table><mglyph><style><img src=x onerror="window.pwned = 6">',
  '<noscript><p title="</noscript><img src=x onerror=window.pwned=7>">',
  '<details open ontoggle="window.pwned = 8">',
];
for (const p of payloads) other.value = p;
other.value = '<svg><script>x</script></svg><p>after</p>';
check(other.value === '<p>after</p>', `content after <svg> lost: ${other.value}`);
other.value = undefined;
check(other.value === '', 'undefined rendered as text');

setTimeout(() => {
  check(window.pwned === false, `payload executed (pwned = ${window.pwned})`);
  document.title = failures.length ? `FAIL ${failures.join('; ')}` : 'PASS';
}, 500);
