/**
 * Brings the editor's own DOM into one consistent shape after every change.
 *
 * Normalising is not sanitising. Sanitising (sanitize.ts, and the server)
 * removes what is unsafe from HTML that came from outside. Normalising tidies
 * what the browser's own editing produced: execCommand writes <b>, <i> and
 * <strike>; an emptied list item becomes a <div>; Chromium nests lists inside
 * <p>; WebKit decorates text with style attributes and <span>s. Left alone,
 * each edit adds markup that the next one builds on — the <span> pile-up the
 * editor exists to prevent.
 *
 * Every rule moves nodes rather than recreating them, so text nodes survive.
 * When a rule replaces, unwraps or removes an element that a caret boundary
 * points into, the boundary is moved with it (Tracker) — otherwise the caret
 * is lost: measured in Firefox and WebKit, renaming the <div> an emptied list
 * item leaves behind sent the next keystroke into a new block. Running the
 * function twice changes nothing the second time (tests check this).
 */
import { FORMATTING, isBlock, isElement, isText, isVisuallyEmpty } from './dom';
import allowlist from '../../allowlist.json';


const RENAMES: Record<string, string> = { b: 'strong', i: 'em', strike: 's' };

/** A selection boundary: [container, offset]. Mutated in place as the DOM changes. */
export type Boundary = [Node, number];

export interface NormalizeOptions {
  /** Caret boundaries to keep valid. Empty formatting around them is kept too (the user is about to type into it). */
  boundaries?: Boundary[];
}

const indexOf = (node: Node) => Array.prototype.indexOf.call(node.parentNode!.childNodes, node) as number;

/** Applies DOM changes while keeping caret boundaries pointing at the same place. */
export class Tracker {
  constructor(private readonly boundaries: Boundary[]) {}

  holds(el: Element): boolean {
    return this.boundaries.some(([n]) => el === n || el.contains(n));
  }

  rename(el: Element, name: string): Element {
    const next = el.ownerDocument.createElement(name);
    for (const attr of Array.from(el.attributes)) next.setAttribute(attr.name, attr.value);
    next.append(...Array.from(el.childNodes));
    el.replaceWith(next);
    for (const b of this.boundaries) if (b[0] === el) b[0] = next;
    return next;
  }

  /** Replaces `el` with its children. */
  unwrap(el: Element): void {
    const parent = el.parentNode!;
    const at = indexOf(el);
    const count = el.childNodes.length;
    for (const b of this.boundaries) {
      if (b[0] === el) {
        b[0] = parent;
        b[1] = at + b[1];
      } else if (b[0] === parent && b[1] > at) {
        b[1] += count - 1;
      }
    }
    el.replaceWith(...Array.from(el.childNodes));
  }

  remove(node: ChildNode): void {
    const parent = node.parentNode!;
    const at = indexOf(node);
    for (const b of this.boundaries) {
      if (node === b[0] || node.contains(b[0])) {
        b[0] = parent;
        b[1] = at;
      } else if (b[0] === parent && b[1] > at) {
        b[1] -= 1;
      }
    }
    node.remove();
  }

  /** Moves the consecutive siblings `nodes` into a new `name` element in their place. */
  wrap(nodes: ChildNode[], name: string): Element {
    const parent = nodes[0]!.parentNode!;
    const first = indexOf(nodes[0]!);
    const wrapper = parent.ownerDocument!.createElement(name);
    for (const b of this.boundaries) {
      if (b[0] !== parent) continue;
      if (b[1] >= first && b[1] <= first + nodes.length) {
        b[0] = wrapper;
        b[1] -= first;
      } else if (b[1] > first + nodes.length) {
        b[1] -= nodes.length - 1;
      }
    }
    parent.insertBefore(wrapper, nodes[0]!);
    wrapper.append(...nodes);
    return wrapper;
  }
}

export function normalize(content: Element, options: NormalizeOptions = {}): boolean {
  let changed = false;
  const mark = () => (changed = true);
  const track = new Tracker(options.boundaries ?? []);

  // Presentation the editor never produces itself.
  for (const el of Array.from(content.querySelectorAll('[style], [class], [id], [dir], [align]'))) {
    for (const a of ['style', 'class', 'id', 'dir', 'align']) el.removeAttribute(a);
    mark();
  }
  // Attributes the allowlist forces (every link: rel="noopener noreferrer"),
  // so links the editor creates look exactly like links the server keeps.
  for (const [name, attrs] of Object.entries(allowlist.forcedAttributes as Record<string, Record<string, string>>)) {
    for (const el of Array.from(content.querySelectorAll(name))) {
      for (const [attr, value] of Object.entries(attrs)) {
        if (el.getAttribute(attr) !== value) {
          el.setAttribute(attr, value);
          mark();
        }
      }
    }
  }
  // One attribute order for links (href, target, rel), whatever order they
  // were set in, so the same link always serialises to the same HTML.
  for (const a of Array.from(content.querySelectorAll('a'))) {
    const names = a.getAttributeNames();
    const order = ['href', 'target', 'rel'].filter((n) => names.includes(n));
    const rest = names.filter((n) => !order.includes(n));
    const wanted = [...order, ...rest];
    if (wanted.join() !== names.join()) {
      const values = wanted.map((n) => [n, a.getAttribute(n)!] as const);
      for (const n of names) a.removeAttribute(n);
      for (const [n, v] of values) a.setAttribute(n, v);
      mark();
    }
  }
  for (const el of Array.from(content.querySelectorAll('b, i, strike'))) {
    track.rename(el, RENAMES[el.localName]!);
    mark();
  }
  for (const el of Array.from(content.querySelectorAll('span, font'))) {
    track.unwrap(el);
    mark();
  }

  // Blocks inside a paragraph (Chromium's lists): split the paragraph around them.
  for (const p of Array.from(content.querySelectorAll('p'))) {
    if (!Array.from(p.childNodes).some(isBlock)) continue;
    splitAroundBlocks(p, track);
    mark();
  }

  // <div>: a paragraph at the top level, a wrapper elsewhere.
  for (const div of Array.from(content.querySelectorAll('div'))) {
    if (div.parentNode === content && !Array.from(div.childNodes).some(isBlock)) track.rename(div, 'p');
    else track.unwrap(div);
    mark();
  }

  if (wrapInlineRuns(content, track)) mark();
  for (const el of Array.from(content.querySelectorAll('blockquote'))) {
    if (wrapInlineRuns(el, track)) mark();
  }

  const formatting = Array.from(FORMATTING).join(',');
  // Adjacent identical formatting (<strong>a</strong><strong>b</strong>).
  for (const el of Array.from(content.querySelectorAll(formatting))) {
    const next = el.nextSibling;
    if (content.contains(el) && isElement(next) && next.localName === el.localName && !el.attributes.length && !next.attributes.length) {
      const moved = Array.from(next.childNodes);
      el.append(...moved);
      track.unwrap(next); // now empty: removes it and fixes boundaries pointing into it
      mark();
    }
  }

  // Empty formatting, unless the caret is inside it.
  for (const el of Array.from(content.querySelectorAll(formatting))) {
    if (content.contains(el) && isVisuallyEmpty(el) && !el.querySelector('br') && !track.holds(el)) {
      track.remove(el);
      mark();
    }
  }

  // A paragraph with no children at all cannot even hold a caret (an empty
  // one being typed into has a <br>): left over from splitting, drop it.
  for (const p of Array.from(content.querySelectorAll('p, h2, h3, h4'))) {
    if (!p.firstChild && !track.holds(p)) {
      track.remove(p);
      mark();
    }
  }

  // A trailing <br> after text is invisible (Firefox leaves one); a <br> that
  // ends an intentional empty line (<br><br>) or fills an empty block is kept.
  for (const br of Array.from(content.querySelectorAll('br'))) {
    const parent = br.parentElement;
    if (!parent || br.nextSibling || !isBlock(parent)) continue;
    const prev = br.previousSibling;
    if (prev && !(isElement(prev) && prev.localName === 'br') && !isVisuallyEmpty(parent)) {
      track.remove(br);
      mark();
    }
  }

  return changed;
}

/** Wraps each run of inline nodes directly inside `parent` in a <p>. */
function wrapInlineRuns(parent: Element, track: Tracker): boolean {
  let changed = false;
  let run: ChildNode[] = [];
  const flush = () => {
    if (run.length && run.some((n) => !isText(n) || n.data.trim() !== '')) {
      track.wrap(run, 'p');
      changed = true;
    } else {
      // Whitespace between blocks renders nothing: drop it.
      for (const n of run) {
        track.remove(n);
        changed = true;
      }
    }
    run = [];
  };
  for (const node of Array.from(parent.childNodes)) {
    if (isBlock(node)) flush();
    else if (node.nodeType === Node.COMMENT_NODE) track.remove(node);
    else run.push(node);
  }
  flush();
  return changed;
}

/** <p>a<ul>…</ul>b</p> → <p>a</p><ul>…</ul><p>b</p> (moving nodes). */
function splitAroundBlocks(p: Element, track: Tracker): void {
  // Move every child after the first block out of the paragraph, then wrap
  // the inline runs among them.
  const children = Array.from(p.childNodes);
  const firstBlock = children.findIndex(isBlock);
  const moved = children.slice(firstBlock);
  p.after(...moved);
  const parent = p.parentElement!;
  let run: ChildNode[] = [];
  const flush = () => {
    if (run.length) track.wrap(run, 'p');
    run = [];
  };
  for (const node of moved) {
    if (isBlock(node)) flush();
    else run.push(node);
  }
  flush();
  if (isVisuallyEmpty(p) && !p.querySelector('br') && !track.holds(p)) track.remove(p);
  void parent;
}
