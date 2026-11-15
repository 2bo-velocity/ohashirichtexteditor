/** Parses `html` inertly and returns a cleaned fragment ready to insert. */
export declare function sanitizeToFragment(html: string): DocumentFragment;
/** Whether `url` may be a link target: an allowed scheme, or relative. */
export declare function isSafeLinkUrl(url: string): boolean;
