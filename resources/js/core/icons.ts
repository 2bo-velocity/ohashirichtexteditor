/**
 * Toolbar icons. The defaults are Lucide icons (ISC licence; notice in the
 * bundle header and THIRD-PARTY-NOTICES.md), bundled at build time: nothing is
 * fetched at runtime, so there is no CDN dependency and nothing for a
 * Content-Security-Policy to block.
 *
 * Replacing them:
 *  - per editor, without JavaScript: <svg slot="icon-bold">…</svg> as a child
 *    of the element (slot content lives in the page, so the page's own icon
 *    CSS — an icon font, for example — applies);
 *  - for the whole page: defineOhashiEditorIcons({ bold: '<svg …>' }).
 */
import {
  Bold, CodeXml, Heading2, Heading3, Image, Italic, Link, List, ListOrdered, Pilcrow, Redo2, Strikethrough,
  TextQuote, Undo2,
} from 'lucide';

type IconNode = [tag: string, attrs: Record<string, string | number>][];

const DEFAULTS: Record<string, IconNode> = {
  undo: Undo2 as IconNode,
  redo: Redo2 as IconNode,
  bold: Bold as IconNode,
  italic: Italic as IconNode,
  strike: Strikethrough as IconNode,
  paragraph: Pilcrow as IconNode,
  h2: Heading2 as IconNode,
  h3: Heading3 as IconNode,
  quote: TextQuote as IconNode,
  ul: List as IconNode,
  ol: ListOrdered as IconNode,
  link: Link as IconNode,
  code: CodeXml as IconNode,
  image: Image as IconNode,
};

const overrides = new Map<string, string | Element>();
const SVG = 'http://www.w3.org/2000/svg';

/**
 * Replaces default icons for every editor on the page.
 *
 * String values are inserted as markup: they must be SVG written by the
 * developer, never anything an end user supplied.
 */
export function defineOhashiEditorIcons(icons: Record<string, string | Element>): void {
  if (!icons || typeof icons !== 'object') throw new TypeError('[OE-CFG-1004] defineOhashiEditorIcons expects an object.');
  for (const [name, icon] of Object.entries(icons)) {
    const ok = (typeof icon === 'string' && /^\s*<svg[\s>]/i.test(icon)) || (typeof Element !== 'undefined' && icon instanceof Element);
    if (!ok) throw new TypeError(`[OE-CFG-1004] Icon "${name}" must be an SVG string or an element.`);
    overrides.set(name, icon);
  }
}

/** A fresh icon element for `name`. */
export function iconFor(name: string): Element | null {
  const override = overrides.get(name);
  if (typeof override === 'string') {
    const template = document.createElement('template');
    template.innerHTML = override.trim();
    return template.content.firstElementChild;
  }
  if (override) return override.cloneNode(true) as Element;

  const node = DEFAULTS[name];
  if (!node) return null;
  const svg = document.createElementNS(SVG, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false',
  })) svg.setAttribute(k, v);
  for (const [tag, attrs] of node) {
    const child = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, String(v));
    svg.append(child);
  }
  return svg;
}
