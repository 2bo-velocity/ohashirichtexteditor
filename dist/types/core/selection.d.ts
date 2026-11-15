/**
 * Reading and writing the selection inside the editor's shadow root.
 *
 * Measured across engines: document.getSelection() points outside the shadow
 * root in Chromium and WebKit, and shadowRoot.getSelection() exists only in
 * Chromium — but Selection.getComposedRanges({ shadowRoots }) reports the
 * right position in all three. That is the one way the editor reads it.
 * Writing uses setBaseAndExtent, which accepts shadow-tree nodes everywhere.
 */
export declare function supportsComposedRanges(): boolean;
/** The current selection as a live Range inside `content`, or null. */
export declare function readRange(root: ShadowRoot, content: Element): Range | null;
export declare function writeRange(range: Range): void;
export declare function collapsedAt(node: Node, offset: number): Range;
/** Caret placed just after `node`'s content (end of a text node, or after an element). */
export declare function caretAfter(node: Node): Range;
/**
 * A collapsed range inside a block rather than between blocks: a caret on
 * `content` itself (content, n) moves to the start of the child at n, or the
 * end of the one before it. Engines disagree on what commands do with a
 * caret between blocks — Firefox's formatBlock made a new, empty heading
 * there — so the editor never acts on one.
 */
export declare function intoBlock(range: Range, content: Element): Range;
/** The first / last caret position inside `node` (its deepest first or last text, else the node itself). */
export declare function edge(node: Node, side: 'start' | 'end'): Range;
/**
 * The image a selection consists of, if it selects exactly one image and no
 * text — what Shift+Arrow next to an image gives. Engines put the boundaries
 * differently (WebKit starts it at the end of the preceding text), so the
 * selected content is inspected rather than the boundaries.
 */
export declare function selectedImage(range: Range, content: Element): HTMLImageElement | null;
/**
 * A selection that survives DOM restructuring. Normalisation moves nodes
 * rather than recreating them, so boundaries held on text nodes stay valid;
 * boundaries on elements are kept by reference too and checked on restore.
 */
export interface Bookmark {
    start: [Node, number];
    end: [Node, number];
}
export declare function bookmark(range: Range): Bookmark;
export declare function restore(mark: Bookmark, content: Element): boolean;
/** Index path from `root` to `node`, for restoring a selection after the DOM is rebuilt (undo). */
export type Path = number[];
export declare function pathOf(node: Node, root: Node): Path | null;
export declare function nodeAt(path: Path, root: Node): Node | null;
