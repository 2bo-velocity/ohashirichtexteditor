// Helpers for toolbar.spec.ts.
import { defineOhashiEditorIcons, defineOhashiEditorLocale } from './ohashi-editor.js';

await customElements.whenDefined('ohashi-rich-text-editor');
const el = document.getElementById('e');
const root = () => el.shadowRoot;
const content = () => root().querySelector('.orte-content');
const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => { warnings.push(args.join(' ')); originalWarn(...args); };
const errors = [];
const originalError = console.error;
console.error = (...args) => { errors.push(args.join(' ')); originalError(...args); };

window.t = {
  set: (html) => { el.value = html; },
  value: () => el.value,
  attr: (name, value) => (value === null ? el.removeAttribute(name) : el.setAttribute(name, value)),
  tools: () => [...root().querySelectorAll('.orte-toolbar button')].map((b) => b.dataset.tool),
  groups: () => [...root().querySelectorAll('.orte-toolbar [part~=group]')].map((g) => [...g.querySelectorAll('button')].map((b) => b.dataset.tool)),
  button: (tool) => {
    const b = root().querySelector(`[data-tool="${tool}"]`);
    return b && { label: b.getAttribute('aria-label'), title: b.title, pressed: b.getAttribute('aria-pressed'), disabled: b.disabled, part: b.getAttribute('part'), tabIndex: b.tabIndex };
  },
  toolbarLabel: () => root().querySelector('.orte-toolbar').getAttribute('aria-label'),
  contentLabel: () => content().getAttribute('aria-label'),
  focused: () => root().activeElement?.dataset?.tool ?? root().activeElement?.getAttribute('part') ?? null,
  select: (word) => {
    const walker = document.createTreeWalker(content(), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.data.indexOf(word);
      if (i >= 0) { document.getSelection().setBaseAndExtent(n, i, n, i + word.length); return true; }
    }
    return false;
  },
  selectAll: () => document.getSelection().selectAllChildren(content()),
  caretEnd: (word) => {
    const walker = document.createTreeWalker(content(), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.data.indexOf(word);
      if (i >= 0) { document.getSelection().setBaseAndExtent(n, i + word.length, n, i + word.length); return true; }
    }
    return false;
  },
  popover: () => {
    const p = root().querySelector('[part~=popover-link]');
    const input = p.querySelector('[part~=input-link-url]');
    return { open: !p.hidden, url: input.value, invalid: input.getAttribute('aria-invalid'), errorShown: !p.querySelector('.orte-popover-error').hidden, removeShown: !p.querySelector('[part~=btn-link-remove]').hidden, focused: root().activeElement === input };
  },
  newTab: (on) => { root().querySelector('[part~=input-link-blank]').checked = on; },
  warnings: () => warnings.slice(),
  errors: () => errors.slice(),
  slotted: (tool) => root().querySelector(`slot[name="icon-${tool}"]`).assignedElements().length,
  defineIcons: (map) => defineOhashiEditorIcons(map),
  defineLocale: (code, messages) => defineOhashiEditorLocale(code, messages),
  iconMarkup: (tool) => root().querySelector(`[data-tool="${tool}"] svg`)?.outerHTML ?? null,
};
document.title = 'ready';
