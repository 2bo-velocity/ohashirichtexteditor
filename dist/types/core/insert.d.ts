/** Plain text → paragraphs (one per line; blank lines dropped). */
export declare function textToFragment(text: string): DocumentFragment;
/**
 * Inserts `fragment` at `range` (its contents are replaced) and returns the
 * caret position just after the inserted content.
 *
 * Inside a list item, a code block or a table cell, block structure from
 * outside would tangle the surrounding structure, so the content goes in as
 * plain text (line breaks become <br>, or stay newlines in <pre>).
 */
export declare function insertFragment(content: Element, range: Range, fragment: DocumentFragment): Range;
