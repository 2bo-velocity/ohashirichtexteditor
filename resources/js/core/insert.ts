/**
 * Inserts pasted or dropped content at a range.
 *
 * The browser's own paste is not used: measured across engines, it carries
 * the source page's styling into the editor (WebKit wraps every run of text
 * in <span style="color: rgb(0, 0, 0)">). The editor cancels it, cleans the
 * clipboard HTML with the allowlist sanitiser, and inserts the result here.
 */
import { isBlock, isElement, isText, isVisuallyEmpty } from './dom';
import { caretAfter } from './selection';

/** Plain text → paragraphs (one per line; blank lines dropped). */
export function textToFragment(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length === 1) {
    fragment.append(lines[0]!);
    return fragment;
  }
  for (const line of lines) {
    if (line.trim() === '') continue;
    const p = document.createElement('p');
    p.textContent = line;
    fragment.append(p);
  }
  return fragment;
}

/**
 * Inserts `fragment` at `range` (its contents are replaced) and returns the
 * caret position just after the inserted content.
 *
 * Inside a list item, a code block or a table cell, block structure from
 * outside would tangle the surrounding structure, so the content goes in as
 * plain text (line breaks become <br>, or stay newlines in <pre>).
 */
export function insertFragment(content: Element, range: Range, fragment: DocumentFragment): Range {
  relaxSpaces(fragment);
  range.deleteContents();
  const container = closest(range.startContainer, content, ['li', 'pre', 'td', 'th']);
  if (container) {
    return insertText(range, fragmentText(fragment), container.localName === 'pre');
  }

  const nodes = Array.from(fragment.childNodes);
  if (!nodes.length) return range;
  if (!nodes.some(isBlock)) {
    const last = nodes[nodes.length - 1]!;
    range.insertNode(fragment);
    return caretAtEnd(last);
  }

  // Block content: split the block the caret is in and put the new blocks in between.
  const block = topLevelBlock(range.startContainer, content);
  if (!block) {
    const last = nodes[nodes.length - 1]!;
    range.insertNode(fragment);
    return caretAtEnd(last);
  }
  const tail = document.createRange();
  tail.setStart(range.startContainer, range.startOffset);
  tail.setEndAfter(block.lastChild ?? block);
  if (!block.lastChild) tail.setEnd(block, 0);
  const second = block.cloneNode(false) as Element;
  second.append(tail.extractContents());

  // Leading inline nodes join the first half, trailing ones the second half.
  const leading: Node[] = [];
  while (nodes.length && !isBlock(nodes[0])) leading.push(nodes.shift()!);
  const trailing: Node[] = [];
  while (nodes.length && !isBlock(nodes[nodes.length - 1])) trailing.unshift(nodes.pop()!);
  block.append(...leading);
  second.prepend(...trailing);
  block.after(...nodes, second);

  const lastInserted = trailing[trailing.length - 1] ?? nodes[nodes.length - 1] ?? leading[leading.length - 1] ?? block;
  if (isVisuallyEmpty(block) && !block.querySelector('br')) block.remove();
  const caret = caretAtEnd(lastInserted);
  if (isVisuallyEmpty(second) && !second.querySelector('br')) second.remove();
  return caret;
}

function insertText(range: Range, text: string, preformatted: boolean): Range {
  if (preformatted || !text.includes('\n')) {
    const node = document.createTextNode(text);
    range.insertNode(node);
    return caretAfter(node);
  }
  const fragment = document.createDocumentFragment();
  text.split('\n').forEach((line, i) => {
    if (i) fragment.append(document.createElement('br'));
    fragment.append(line);
  });
  const last = fragment.lastChild!;
  range.insertNode(fragment);
  return caretAfter(last);
}

function fragmentText(fragment: DocumentFragment): string {
  const parts: string[] = [];
  for (const node of Array.from(fragment.childNodes)) {
    parts.push(isText(node) ? node.data : (node.textContent ?? ''));
  }
  return parts.join(isBlockList(fragment) ? '\n' : '');
}

const isBlockList = (fragment: DocumentFragment) => Array.from(fragment.childNodes).some(isBlock);

function closest(node: Node, content: Element, names: string[]): Element | null {
  for (let n: Node | null = node; n && n !== content; n = n.parentNode) {
    if (isElement(n) && names.includes(n.localName)) return n;
  }
  return null;
}

function topLevelBlock(node: Node, content: Element): Element | null {
  for (let n: Node | null = node; n && n !== content; n = n.parentNode) {
    if (n.parentNode === content) return isElement(n) && isBlock(n) ? n : null;
  }
  return null;
}

function endOf(el: Element): Range {
  const range = document.createRange();
  const last = el.lastChild;
  if (last && isText(last)) range.setStart(last, last.length);
  else range.setStart(el, el.childNodes.length);
  return range;
}

/**
 * WebKit writes the spaces of copied text as &nbsp; (measured: "pasted red"
 * arrived as "pasted&nbsp;red", the words in separate text nodes once the
 * <span>s around them were removed). Between two words a plain space renders
 * the same, so it is restored there — looking across text nodes and inline
 * elements within the same block. Leading, trailing and repeated spaces keep
 * their &nbsp;: that is where a plain space would collapse.
 */
function relaxSpaces(fragment: DocumentFragment): void {
  fragment.normalize(); // merge adjacent text nodes
  const texts: Text[] = [];
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!(n as Text).parentElement?.closest('pre')) texts.push(n as Text);
  }
  const blockOf = (n: Node): Node | null => {
    for (let p = n.parentNode; p && p !== fragment; p = p.parentNode) if (isBlock(p)) return p;
    return null;
  };
  const isSpace = (c: string | undefined) => c === undefined || /[\s\u00a0]/.test(c);
  texts.forEach((text, k) => {
    if (!text.data.includes('\u00a0')) return;
    const before = k > 0 && blockOf(texts[k - 1]!) === blockOf(text) ? texts[k - 1]!.data.at(-1) : undefined;
    const after = k < texts.length - 1 && blockOf(texts[k + 1]!) === blockOf(text) ? texts[k + 1]!.data[0] : undefined;
    const chars = [...text.data];
    chars.forEach((c, i) => {
      if (c !== '\u00a0') return;
      const prev = i > 0 ? chars[i - 1] : before;
      const next = i < chars.length - 1 ? chars[i + 1] : after;
      if (!isSpace(prev) && !isSpace(next)) chars[i] = ' ';
    });
    const relaxed = chars.join('');
    if (relaxed !== text.data) text.data = relaxed;
  });
}

/**
 * The caret at the end of the last text inside `node`, so typing continues
 * with the formatting just inserted. Placing it *after* an inline element
 * left the choice to the engine: Chromium and WebKit kept typing inside the
 * <strong>, Firefox outside it (measured).
 */
function caretAtEnd(node: Node): Range {
  if (isText(node)) return caretAfter(node);
  if (isElement(node)) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let last: Text | null = null;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) last = n as Text;
    if (last) return caretAfter(last);
    if (isBlock(node)) return endOf(node);
  }
  return caretAfter(node);
}
