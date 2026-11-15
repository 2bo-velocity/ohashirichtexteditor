/** Element classes shared by normalisation and insertion. */

export const BLOCK = new Set(['p', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'pre', 'hr', 'table', 'div']);

/** Inline formatting that may be merged when adjacent, or dropped when empty. */
export const FORMATTING = new Set(['strong', 'em', 's', 'u', 'code', 'del']);

export const isElement = (n: Node | null | undefined): n is Element => !!n && n.nodeType === Node.ELEMENT_NODE;
export const isText = (n: Node | null | undefined): n is Text => !!n && n.nodeType === Node.TEXT_NODE;
export const isBlock = (n: Node | null | undefined): boolean => isElement(n) && BLOCK.has(n.localName);

/** True when the node renders nothing a user would call content. */
export function isVisuallyEmpty(node: Node): boolean {
  if (isText(node)) return node.data.replace(/[\s​]/g, '') === '';
  if (!isElement(node)) return true;
  if (['img', 'hr', 'table'].includes(node.localName)) return false;
  if (node.querySelector('img, hr, table')) return false;
  return (node.textContent ?? '').replace(/[\s​]/g, '') === '';
}
