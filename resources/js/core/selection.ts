/**
 * Reading and writing the selection inside the editor's shadow root.
 *
 * Measured across engines: document.getSelection() points outside the shadow
 * root in Chromium and WebKit, and shadowRoot.getSelection() exists only in
 * Chromium — but Selection.getComposedRanges({ shadowRoots }) reports the
 * right position in all three. That is the one way the editor reads it.
 * Writing uses setBaseAndExtent, which accepts shadow-tree nodes everywhere.
 */

export function supportsComposedRanges(): boolean {
  return typeof Selection !== 'undefined' && typeof Selection.prototype.getComposedRanges === 'function';
}

/**
 * The ranges of `selection` as seen from inside `root`.
 *
 * The signature changed while browsers shipped it. Chrome 137+, Firefox
 * 142+ and current Safari take a dictionary, `{ shadowRoots: [root] }`.
 * Safari from 17 until WebKit switched (April 2025 — so, by release dates,
 * Safari 17 and 18) implements the earlier draft, `getComposedRanges(root)`,
 * and rejects the dictionary with a TypeError (it is not a ShadowRoot). The
 * dictionary form is tried first; the old one only when it is refused —
 * passed the other way round, the new form would quietly ignore the root.
 */
function composedRanges(selection: Selection, root: ShadowRoot): StaticRange[] {
  try {
    return selection.getComposedRanges({ shadowRoots: [root] });
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return (selection.getComposedRanges as unknown as (...roots: ShadowRoot[]) => StaticRange[])(root);
  }
}

/** The current selection as a live Range inside `content`, or null. */
export function readRange(root: ShadowRoot, content: Element): Range | null {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0 || !supportsComposedRanges()) return null;
  const [r] = composedRanges(selection, root);
  if (!r || !content.contains(r.startContainer) || !content.contains(r.endContainer)) return null;
  const range = document.createRange();
  range.setStart(r.startContainer, r.startOffset);
  range.setEnd(r.endContainer, r.endOffset);
  return range;
}

export function writeRange(range: Range): void {
  document.getSelection()?.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
}

export function collapsedAt(node: Node, offset: number): Range {
  const range = document.createRange();
  range.setStart(node, offset);
  return range;
}

/** Caret placed just after `node`'s content (end of a text node, or after an element). */
export function caretAfter(node: Node): Range {
  if (node.nodeType === Node.TEXT_NODE) return collapsedAt(node, (node as Text).length);
  const range = document.createRange();
  range.setStartAfter(node);
  return range;
}

/**
 * A collapsed range inside a block rather than between blocks: a caret on
 * `content` itself (content, n) moves to the start of the child at n, or the
 * end of the one before it. Engines disagree on what commands do with a
 * caret between blocks — Firefox's formatBlock made a new, empty heading
 * there — so the editor never acts on one.
 */
export function intoBlock(range: Range, content: Element): Range {
  if (!range.collapsed || range.startContainer !== content) return range;
  const next = content.childNodes[range.startOffset];
  const previous = content.childNodes[range.startOffset - 1];
  if (next) return edge(next, 'start');
  if (previous) return edge(previous, 'end');
  return range;
}

/** The first / last caret position inside `node` (its deepest first or last text, else the node itself). */
export function edge(node: Node, side: 'start' | 'end'): Range {
  let n: Node = node;
  while (n.nodeType === Node.ELEMENT_NODE && n.childNodes.length && !['br', 'img', 'hr'].includes((n as Element).localName)) {
    n = side === 'start' ? n.firstChild! : n.lastChild!;
  }
  if (n.nodeType === Node.TEXT_NODE) return collapsedAt(n, side === 'start' ? 0 : (n as Text).length);
  const range = document.createRange();
  if (side === 'start') range.setStartBefore(n);
  else range.setStartAfter(n);
  return range;
}

/**
 * The image a selection consists of, if it selects exactly one image and no
 * text — what Shift+Arrow next to an image gives. Engines put the boundaries
 * differently (WebKit starts it at the end of the preceding text), so the
 * selected content is inspected rather than the boundaries.
 */
export function selectedImage(range: Range, content: Element): HTMLImageElement | null {
  if (range.collapsed) return null;
  const selected = range.cloneContents();
  if ((selected.textContent ?? '').trim() !== '' || selected.querySelectorAll('img').length !== 1) return null;
  const images = Array.from(content.querySelectorAll('img')).filter((img) => range.intersectsNode(img));
  return images.length === 1 ? images[0]! : null;
}

/**
 * A selection that survives DOM restructuring. Normalisation moves nodes
 * rather than recreating them, so boundaries held on text nodes stay valid;
 * boundaries on elements are kept by reference too and checked on restore.
 */
export interface Bookmark {
  start: [Node, number];
  end: [Node, number];
}

export function bookmark(range: Range): Bookmark {
  return { start: [range.startContainer, range.startOffset], end: [range.endContainer, range.endOffset] };
}

export function restore(mark: Bookmark, content: Element): boolean {
  const [sn, so] = mark.start;
  const [en, eo] = mark.end;
  if (!content.contains(sn) || !content.contains(en)) return false;
  const clamp = (n: Node, o: number) => Math.min(o, n.nodeType === Node.TEXT_NODE ? (n as Text).length : n.childNodes.length);
  document.getSelection()?.setBaseAndExtent(sn, clamp(sn, so), en, clamp(en, eo));
  return true;
}

/** Index path from `root` to `node`, for restoring a selection after the DOM is rebuilt (undo). */
export type Path = number[];

export function pathOf(node: Node, root: Node): Path | null {
  const path: number[] = [];
  for (let n: Node | null = node; n && n !== root; n = n.parentNode) {
    if (!n.parentNode) return null;
    path.unshift(Array.prototype.indexOf.call(n.parentNode.childNodes, n));
  }
  return path;
}

export function nodeAt(path: Path, root: Node): Node | null {
  let n: Node | null = root;
  for (const i of path) n = n?.childNodes[i] ?? null;
  return n;
}
