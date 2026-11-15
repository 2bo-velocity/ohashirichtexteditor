/**
 * Replaces default icons for every editor on the page.
 *
 * String values are inserted as markup: they must be SVG written by the
 * developer, never anything an end user supplied.
 */
export declare function defineOhashiEditorIcons(icons: Record<string, string | Element>): void;
/** A fresh icon element for `name`. */
export declare function iconFor(name: string): Element | null;
