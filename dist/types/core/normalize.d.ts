/** A selection boundary: [container, offset]. Mutated in place as the DOM changes. */
export type Boundary = [Node, number];
export interface NormalizeOptions {
    /** Caret boundaries to keep valid. Empty formatting around them is kept too (the user is about to type into it). */
    boundaries?: Boundary[];
}
/** Applies DOM changes while keeping caret boundaries pointing at the same place. */
export declare class Tracker {
    private readonly boundaries;
    constructor(boundaries: Boundary[]);
    holds(el: Element): boolean;
    rename(el: Element, name: string): Element;
    /** Replaces `el` with its children. */
    unwrap(el: Element): void;
    remove(node: ChildNode): void;
    /** Moves the consecutive siblings `nodes` into a new `name` element in their place. */
    wrap(nodes: ChildNode[], name: string): Element;
}
export declare function normalize(content: Element, options?: NormalizeOptions): boolean;
