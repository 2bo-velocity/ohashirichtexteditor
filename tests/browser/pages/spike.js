// Probes for how editing behaves inside the editor's shadow root, per engine.
// Driven by tests/browser/capabilities.spec.ts. Nothing here asserts: each
// probe reports what the engine actually did, so the editing design can be
// chosen from facts rather than from what one browser happens to do.
//
// The probes run against a bare contenteditable in a shadow root, not the
// editor: they measure what the engine does on its own. (The editor
// normalises on every input, which would hide exactly that.)
customElements.define('spike-editable', class extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = '<div class="orte-content" contenteditable="true"></div>';
  }
});
const host = document.querySelector('spike-editable');
const root = host.shadowRoot;
const content = root.querySelector('.orte-content');

const describe = (n) =>
  !n ? null : n === host ? 'HOST' : n.nodeType === Node.TEXT_NODE ? `#text "${n.data.slice(0, 24)}"` : n.nodeName;
const inShadow = (n) => !!n && root.contains(n);
const events = [];

for (const type of ['keydown', 'keyup', 'compositionstart', 'compositionupdate', 'compositionend', 'beforeinput', 'input', 'paste', 'drop']) {
  content.addEventListener(type, (e) => {
    const entry = { type };
    if ('inputType' in e) entry.inputType = e.inputType;
    if ('isComposing' in e) entry.isComposing = e.isComposing;
    if ('key' in e) Object.assign(entry, { key: e.key, keyCode: e.keyCode });
    if ('data' in e && e.data != null) entry.data = e.data;
    if (type === 'beforeinput') {
      entry.cancelable = e.cancelable;
      entry.targetRanges = typeof e.getTargetRanges === 'function' ? e.getTargetRanges().length : 'n/a';
      if (e.dataTransfer) entry.dataTransferTypes = [...e.dataTransfer.types];
    }
    if (e.clipboardData) {
      entry.types = [...e.clipboardData.types];
      entry.html = e.clipboardData.getData('text/html').slice(0, 200);
    }
    events.push(entry);
  });
}

window.spike = {
  setHtml(html) {
    content.innerHTML = html;
    events.length = 0;
  },
  html: () => content.innerHTML,
  events: () => events.slice(),
  clearEvents: () => void (events.length = 0),
  activeElement: () => ({ document: describe(document.activeElement), shadow: describe(root.activeElement) }),

  selection() {
    const ds = document.getSelection();
    const r = {
      document: { rangeCount: ds.rangeCount, anchor: describe(ds.anchorNode), anchorInShadow: inShadow(ds.anchorNode), text: ds.toString() },
      shadowRootGetSelection: typeof root.getSelection === 'function',
      getComposedRanges: typeof ds.getComposedRanges === 'function',
    };
    if (r.shadowRootGetSelection) {
      const s = root.getSelection();
      r.shadow = { rangeCount: s.rangeCount, anchor: describe(s.anchorNode), anchorInShadow: inShadow(s.anchorNode), text: s.toString() };
    }
    if (r.getComposedRanges) {
      let ranges;
      try {
        ranges = ds.getComposedRanges({ shadowRoots: [root] });
        r.composedSignature = '{ shadowRoots }';
      } catch {
        try {
          ranges = ds.getComposedRanges(root);
          r.composedSignature = '(root)';
        } catch (e) {
          r.composedError = String(e);
        }
      }
      if (ranges) {
        r.composed = ranges.map((x) => ({
          start: describe(x.startContainer), startInShadow: inShadow(x.startContainer), startOffset: x.startOffset,
          end: describe(x.endContainer), endOffset: x.endOffset, collapsed: x.collapsed,
        }));
      }
    }
    return r;
  },

  // Select `word` from script, the way toolbar commands will need to.
  select(word) {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.data.indexOf(word);
      if (i < 0) continue;
      try {
        document.getSelection().setBaseAndExtent(n, i, n, i + word.length);
        return { ok: true, text: document.getSelection().toString() };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    }
    return { ok: false, error: 'not found' };
  },

  exec(command, value) {
    try {
      const returned = document.execCommand(command, false, value);
      return { returned, html: content.innerHTML };
    } catch (e) {
      return { error: String(e) };
    }
  },

  // Take over paste: cancel the browser's insertion and insert our own
  // fragment at the composed range. The attribute stripping below is a
  // test stand-in only — it checks that interception works, not how content
  // is cleaned. The editor itself uses its allowlist sanitiser.
  interceptPaste() {
    content.addEventListener('paste', (e) => {
      const html = e.clipboardData?.getData('text/html') ?? '';
      e.preventDefault();
      const [range] = document.getSelection().getComposedRanges({ shadowRoots: [root] });
      if (!range) return;
      const live = document.createRange();
      live.setStart(range.startContainer, range.startOffset);
      live.setEnd(range.endContainer, range.endOffset);
      live.deleteContents();
      const template = document.createElement('template');
      template.innerHTML = html.replace(/<[^>]*(on\w+|style)=[^>]*>/gi, (m) => m.replace(/\s(on\w+|style)="[^"]*"/gi, ''));
      const last = template.content.lastChild;
      live.insertNode(template.content);
      if (last) document.getSelection().setBaseAndExtent(last, last.childNodes.length, last, last.childNodes.length);
      events.push({ type: 'intercepted', html: html.slice(0, 120) });
    });
  },

  hostIsIntact: () => !content.querySelector('spike-editable') && root.querySelectorAll('.orte-content').length === 1,

  async writeClipboard(html) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob(['plain'], { type: 'text/plain' }),
        }),
      ]);
      return 'ok';
    } catch (e) {
      return String(e);
    }
  },
};
document.title = 'ready';
