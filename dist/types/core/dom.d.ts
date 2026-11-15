/** Element classes shared by normalisation and insertion. */
export declare const BLOCK: Set<string>;
/** Inline formatting that may be merged when adjacent, or dropped when empty. */
export declare const FORMATTING: Set<string>;
export declare const isElement: (n: Node | null | undefined) => n is Element;
export declare const isText: (n: Node | null | undefined) => n is Text;
export declare const isBlock: (n: Node | null | undefined) => boolean;
/** True when the node renders nothing a user would call content. */
export declare function isVisuallyEmpty(node: Node): boolean;
