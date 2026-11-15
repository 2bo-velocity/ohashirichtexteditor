/**
 * Makes HTML safe to put into the live editor.
 *
 * Assigning a string to innerHTML on a connected element runs inline event
 * handlers (`<img onerror>`), so stored content — legacy rows, imports, anything
 * that never went through the server-side sanitiser — could execute script on
 * the page that loads it, typically an admin screen. Content is therefore
 * parsed into a separate, inert document, where nothing runs and nothing loads,
 * cleaned there, and only then moved into the editor as nodes (never
 * re-serialised and re-parsed, which is how mutation-XSS slips through).
 *
 * The parse uses DOMParser on a body-wrapped document rather than
 * <template>.innerHTML: a DOMParser document has scripting disabled and the
 * same body context the server parses in, so every engine — and the server's
 * HTML5 parser — builds the same tree. Through <template>, Firefox parsed
 * `<noscript><p title="</noscript><img …>">` differently from Chrome and
 * WebKit, which is the kind of disagreement mutation-XSS feeds on.
 *
 * The rules come from resources/allowlist.json, which the PHP sanitiser
 * (src/HtmlSanitizer.php) reads too: what the editor shows is what the server
 * keeps. This is the client-side layer only; the server remains the last line
 * of defence. tests/fixtures/sanitizer-cases.json is run against both.
 */
import allowlist from '../../allowlist.json';

const ALLOW: Readonly<Record<string, readonly string[]>> = allowlist.allow;
const UNWRAP = new Set<string>(allowlist.unwrap);
const PATTERNS: Readonly<Record<string, Readonly<Record<string, string>>>> = allowlist.attributePatterns;
const FORCED: Readonly<Record<string, Readonly<Record<string, string>>>> = allowlist.forcedAttributes;
const LINK_SCHEMES = new Set(allowlist.linkSchemes.map((s) => `${s}:`));
const MEDIA_SCHEMES = new Set(allowlist.mediaSchemes.map((s) => `${s}:`));
const DATA_IMAGE = new RegExp(`^data:image/(?:${allowlist.dataImageTypes.join('|')});base64,[a-z0-9+/=\\s]+$`, 'i');
const URL_ATTRIBUTES = new Set(['href', 'src']);

const compiledPatterns = new Map<string, RegExp>();
function pattern(element: string, attribute: string): RegExp | undefined {
  const source = PATTERNS[element]?.[attribute];
  if (source === undefined) return undefined;
  const key = `${element}[${attribute}]`;
  let re = compiledPatterns.get(key);
  if (!re) compiledPatterns.set(key, (re = new RegExp(source, 'u')));
  return re;
}

function isSafeUrl(value: string, attribute: string): boolean {
  // Browsers ignore control characters and whitespace inside a scheme
  // ("java\tscript:"), so strip them before looking at it.
  const compact = value.replace(/[\u0000- \u007f-\u009f]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact);
  if (!scheme) return true; // relative URL
  const name = `${scheme[1]!.toLowerCase()}:`;
  if (attribute === 'src') return MEDIA_SCHEMES.has(name) || DATA_IMAGE.test(compact);
  return LINK_SCHEMES.has(name);
}

function cleanAttributes(el: Element, allowed: readonly string[]): void {
  const name = el.localName;
  for (const attr of Array.from(el.attributes)) {
    const attribute = attr.name.toLowerCase();
    const keep =
      allowed.includes(attribute) &&
      (!URL_ATTRIBUTES.has(attribute) || isSafeUrl(attr.value, attribute)) &&
      (pattern(name, attribute)?.test(attr.value) ?? true);
    if (!keep) el.removeAttribute(attr.name);
  }
  for (const [attribute, value] of Object.entries(FORCED[name] ?? {})) {
    el.setAttribute(attribute, value);
  }
}

function cleanChildren(parent: ParentNode): void {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      node.remove();
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const el = node as Element;
    const name = el.localName;
    const allowed = ALLOW[name];

    if (allowed) {
      cleanChildren(el);
      cleanAttributes(el, allowed);
    } else if (UNWRAP.has(name)) {
      // Presentational or structural wrappers (<span style>, <font>, <div>):
      // keep the content, drop the wrapper. This is also what stops <span> bloat.
      cleanChildren(el);
      el.replaceWith(...Array.from(el.childNodes));
    } else {
      // Listed in "drop", or not a standard element at all: removed with its
      // content — the same as the server does.
      el.remove();
    }
  }
}

/** Parses `html` inertly and returns a cleaned fragment ready to insert. */
export function sanitizeToFragment(html: string): DocumentFragment {
  // Wrapped exactly as symfony/html-sanitizer wraps it on the server, so both
  // start parsing inside <body>. Unwrapped, a leading <noscript>, <style> or
  // <meta> is parsed in head context and yields a different tree than the
  // server's — every engine agreed on `<p></p>` where the server produced "".
  const parsed = new DOMParser().parseFromString(`<!DOCTYPE html><body>${html}</body>`, 'text/html');
  cleanChildren(parsed.body);
  // Only cleaned nodes are adopted into the live document. Snapshot the list
  // first: adopting a node detaches it, and doing that while walking the live
  // childNodes list skipped every other node.
  const nodes = Array.from(parsed.body.childNodes);
  const fragment = document.createDocumentFragment();
  for (const node of nodes) fragment.append(document.adoptNode(node));
  return fragment;
}

/** Whether `url` may be a link target: an allowed scheme, or relative. */
export function isSafeLinkUrl(url: string): boolean {
  return url.trim() !== '' && isSafeUrl(url.trim(), 'href');
}
