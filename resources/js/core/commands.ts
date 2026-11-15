/**
 * The command layer: what each toolbar button and shortcut does.
 *
 * Measured across engines (see the engine survey tests), some formatting can
 * be delegated to document.execCommand — its output is identical in
 * Chromium, Firefox and WebKit and is normalised right after. Lists are NOT:
 * Chromium nests them inside <p>, and WebKit copies the editor's host element
 * into the list, breaking the shadow root. Lists, quotes and code blocks are
 * therefore done here, moving nodes through the Tracker so the caret stays
 * where it was. All delegation to execCommand goes through this file, so
 * replacing it one day touches nothing else.
 */
import { BLOCK, isElement, isText } from './dom';
import { Tracker, type Boundary } from './normalize';
import { isSafeLinkUrl } from './sanitize';

export const TOOL_NAMES = ['undo', 'redo', 'bold', 'italic', 'strike', 'paragraph', 'h2', 'h3', 'quote', 'ul', 'ol', 'link', 'code', 'image'] as const;
export type ToolName = (typeof TOOL_NAMES)[number];
export const DEFAULT_TOOLBAR = 'undo redo | bold italic strike | paragraph h2 h3 quote | ul ol | link code image';

/** Shortcuts, by tool. Shown in tooltips; a tool left out of the toolbar loses its shortcut too. */
export const SHORTCUTS: Partial<Record<ToolName, string>> = {
  undo: 'Mod+Z', redo: 'Mod+Shift+Z', bold: 'Mod+B', italic: 'Mod+I', link: 'Mod+K',
};

export interface Context {
  content: HTMLElement;
  range: Range;
  /** Boundaries of `range`, kept valid while nodes move. */
  boundaries: Boundary[];
}

interface Command {
  isActive(ctx: Context): boolean;
  isEnabled(ctx: Context): boolean;
  run(ctx: Context): void;
}

const closest = (node: Node, content: Element, names: string[]): Element | null => {
  for (let n: Node | null = node; n && n !== content; n = n.parentNode) {
    if (isElement(n) && names.includes(n.localName)) return n;
  }
  return null;
};
const inside = (ctx: Context, names: string[]) => closest(ctx.range.startContainer, ctx.content, names) !== null;

/**
 * The node whose formatting a selection "has": for a caret, where it is; for
 * a selection, the first character actually selected. After execCommand,
 * WebKit puts the start of the selection at the end of the text *before* the
 * new <strong> (measured), so the start container alone says "not bold".
 */
function formattingNode(ctx: Context): Node {
  const r = ctx.range;
  if (r.collapsed) return r.startContainer;
  const root = r.commonAncestorContainer;
  const walker = document.createTreeWalker(root.nodeType === Node.TEXT_NODE ? root.parentNode! : root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (!r.intersectsNode(n)) continue;
    const start = n === r.startContainer ? r.startOffset : 0;
    const end = n === r.endContainer ? r.endOffset : n.length;
    if (end > start) return n;
  }
  return r.startContainer;
}
const formattedAs = (ctx: Context, names: string[]) => closest(formattingNode(ctx), ctx.content, names) !== null;
const exec = (command: string, value?: string) => document.execCommand(command, false, value);

function inline(names: string[], command: string): Command {
  return {
    isActive: (ctx) => formattedAs(ctx, names),
    isEnabled: (ctx) => !inside(ctx, ['pre']),
    run: () => void exec(command),
  };
}

/** The block-level element the range starts / ends in: a direct child of `content` or of a <blockquote>. */
function blocksInRange(ctx: Context): Element[] {
  const blockOf = (node: Node): Element | null => {
    for (let n: Node | null = node; n && n !== ctx.content; n = n.parentNode) {
      const parent = n.parentNode;
      if (isElement(n) && (parent === ctx.content || (isElement(parent) && parent.localName === 'blockquote'))) return n;
    }
    return null;
  };
  const first = blockOf(ctx.range.startContainer);
  const last = blockOf(ctx.range.endContainer) ?? first;
  if (!first) return [];
  if (!last || first.parentNode !== last.parentNode) return [first];
  const blocks: Element[] = [];
  for (let n: Element | null = first; n; n = n.nextElementSibling) {
    blocks.push(n);
    if (n === last) break;
  }
  return blocks;
}

function heading(tag: 'p' | 'h2' | 'h3'): Command {
  return {
    isActive: (ctx) => closest(ctx.range.startContainer, ctx.content, ['p', 'h2', 'h3', 'h4'])?.localName === tag && !inside(ctx, ['li']),
    isEnabled: (ctx) => !inside(ctx, ['li', 'pre']),
    // Pressing an active heading turns it back into a paragraph.
    run: (ctx) => void exec('formatBlock', tag !== 'p' && heading(tag).isActive(ctx) ? 'p' : tag),
  };
}

const quote: Command = {
  isActive: (ctx) => inside(ctx, ['blockquote']),
  isEnabled: () => true,
  run(ctx) {
    const track = new Tracker(ctx.boundaries);
    const existing = closest(ctx.range.startContainer, ctx.content, ['blockquote']);
    if (existing) {
      track.unwrap(existing);
      return;
    }
    // Quote whole top-level blocks (a list is quoted as a whole).
    const top = (node: Node): ChildNode | null => {
      for (let n: Node | null = node; n; n = n.parentNode) if (n.parentNode === ctx.content) return n as ChildNode;
      return null;
    };
    const first = top(ctx.range.startContainer);
    const last = top(ctx.range.endContainer) ?? first;
    if (!first) return;
    const nodes: ChildNode[] = [];
    for (let n: ChildNode | null = first; n; n = n.nextSibling) {
      nodes.push(n);
      if (n === last) break;
    }
    track.wrap(nodes, 'blockquote');
  },
};

function list(type: 'ul' | 'ol'): Command {
  const other = type === 'ul' ? 'ol' : 'ul';
  return {
    isActive: (ctx) => closest(ctx.range.startContainer, ctx.content, ['li'])?.parentElement?.localName === type,
    isEnabled: (ctx) => !inside(ctx, ['pre']),
    run(ctx) {
      const track = new Tracker(ctx.boundaries);
      const li = closest(ctx.range.startContainer, ctx.content, ['li']);
      const current = li?.parentElement;
      if (li && current && current.localName === other) {
        track.rename(current, type); // switch the list's type
        return;
      }
      if (li && current && current.localName === type) {
        unlist(ctx, track, current, li);
        return;
      }
      // Paragraphs and headings become items of one new list.
      const blocks = blocksInRange(ctx).filter((b) => ['p', 'h2', 'h3', 'h4'].includes(b.localName));
      if (!blocks.length) return;
      const items = blocks.map((b) => track.rename(b, 'li') as ChildNode);
      const created = track.wrap(items, type);
      // Join a list of the same type right before it.
      const prev = created.previousElementSibling;
      if (prev?.localName === type) {
        prev.append(...Array.from(created.childNodes));
        track.remove(created);
      }
    },
  };
}

/** Turns the selected items of `list` back into paragraphs, splitting the list around them. */
function unlist(ctx: Context, track: Tracker, list: Element, startItem: Element): void {
  const items = Array.from(list.children);
  const endItem = closest(ctx.range.endContainer, ctx.content, ['li']);
  const from = items.indexOf(startItem);
  const to = endItem && endItem.parentElement === list ? items.indexOf(endItem) : from;
  const after = items.slice(to + 1);
  if (after.length) {
    const rest = list.ownerDocument.createElement(list.localName);
    list.after(rest);
    rest.append(...after);
  }
  const paragraphs = items.slice(from, to + 1).map((item) => track.rename(item, 'p'));
  list.after(...paragraphs);
  if (!list.children.length) track.remove(list);
}

const code: Command = {
  isActive: (ctx) => inside(ctx, ['pre']),
  isEnabled: (ctx) => !inside(ctx, ['li']),
  run(ctx) {
    const doc = ctx.content.ownerDocument;
    const pre = closest(ctx.range.startContainer, ctx.content, ['pre']);
    if (pre) {
      // Back to paragraphs: one per line.
      const lines = (pre.textContent ?? '').replace(/\n$/, '').split('\n');
      const paragraphs = lines.map((line) => {
        const p = doc.createElement('p');
        if (line) p.textContent = line;
        else p.append(doc.createElement('br'));
        return p;
      });
      pre.replaceWith(...paragraphs);
      caretAtEnd(ctx, paragraphs[paragraphs.length - 1]!);
      return;
    }
    const blocks = blocksInRange(ctx).filter((b) => !['ul', 'ol', 'table', 'hr', 'blockquote'].includes(b.localName));
    if (!blocks.length) return;
    const text = blocks.map((b) => b.textContent ?? '').join('\n');
    const newPre = doc.createElement('pre');
    const codeEl = doc.createElement('code');
    codeEl.textContent = text;
    newPre.append(codeEl);
    blocks[0]!.before(newPre);
    for (const b of blocks) b.remove();
    caretAtEnd(ctx, codeEl);
  },
};

/** Moves the command's caret to the end of `el` (used when nodes are rebuilt, not moved). */
function caretAtEnd(ctx: Context, el: Element): void {
  const last = el.lastChild;
  const target: Boundary = last && isText(last) ? [last, last.length] : [el, el.childNodes.length];
  for (const b of ctx.boundaries) {
    b[0] = target[0];
    b[1] = target[1];
  }
}

export const COMMANDS: Record<Exclude<ToolName, 'undo' | 'redo' | 'link' | 'image'>, Command> = {
  bold: inline(['strong', 'b'], 'bold'),
  italic: inline(['em', 'i'], 'italic'),
  strike: inline(['s', 'strike', 'del'], 'strikeThrough'),
  paragraph: heading('p'),
  h2: heading('h2'),
  h3: heading('h3'),
  quote,
  ul: list('ul'),
  ol: list('ol'),
  code,
};

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const linkAt = (ctx: Context): HTMLAnchorElement | null =>
  closest(formattingNode(ctx), ctx.content, ['a']) as HTMLAnchorElement | null;

/**
 * Creates or updates a link over the range. Returns 'refused' (and changes
 * nothing) for a URL that is not allowed — the same check the sanitiser
 * applies, so the editor never creates a link the server would strip.
 * 'caret-moved' means ctx.boundaries now hold where the caret should go.
 */
export function applyLink(ctx: Context, url: string, newTab: boolean): 'refused' | 'applied' | 'caret-moved' {
  const href = url.trim();
  if (!isSafeLinkUrl(href)) return 'refused';
  let result: 'applied' | 'caret-moved' = 'applied';
  const existing = linkAt(ctx);
  let links: HTMLAnchorElement[];
  if (existing) {
    existing.setAttribute('href', href);
    links = [existing];
  } else if (ctx.range.collapsed) {
    // Nothing selected: the URL itself becomes the link text.
    const a = ctx.content.ownerDocument.createElement('a');
    a.setAttribute('href', href);
    a.textContent = href;
    ctx.range.insertNode(a);
    caretAtEnd(ctx, a);
    result = 'caret-moved';
    links = [a];
  } else {
    exec('createLink', href);
    links = Array.from(ctx.content.querySelectorAll('a')).filter((a) => a.getAttribute('href') === href) as HTMLAnchorElement[];
  }
  for (const a of links) {
    if (newTab) a.setAttribute('target', '_blank');
    else a.removeAttribute('target');
  }
  return result;
}

export function removeLink(ctx: Context): void {
  const a = linkAt(ctx);
  if (a) new Tracker(ctx.boundaries).unwrap(a);
}

export { BLOCK };
