/**
 * UI text. English is the default; Japanese ships with the editor. The
 * language is chosen by whoever integrates the editor, through the `locale`
 * attribute — never guessed from the browser, and not taken from `lang`,
 * which also governs the content being written.
 */
declare const EN: {
    editor: string;
    toolbar: string;
    undo: string;
    redo: string;
    bold: string;
    italic: string;
    strike: string;
    paragraph: string;
    h2: string;
    h3: string;
    quote: string;
    ul: string;
    ol: string;
    link: string;
    code: string;
    image: string;
    'link.dialog': string;
    'link.url': string;
    'link.newTab': string;
    'link.apply': string;
    'link.remove': string;
    'link.close': string;
    'link.invalid': string;
    'image.dialog': string;
    'image.edit': string;
    'image.width': string;
    'image.alt': string;
    'image.altHint': string;
    'image.altMissing': string;
    'image.apply': string;
    'image.close': string;
    'image.uploading': string;
    'notice.close': string;
    'errors.OE-UPL-4001': string;
    'errors.OE-UPL-4001.short': string;
    'errors.OE-UPL-4002': string;
    'errors.OE-UPL-4003': string;
    'errors.OE-UPL-4004': string;
    'errors.OE-UPL-4005': string;
    'errors.OE-UPL-4006': string;
    'errors.OE-UPL-4007': string;
    'errors.OE-UPL-4900': string;
    'errors.OE-CORE-9001': string;
};
export type MessageKey = keyof typeof EN;
export type Messages = Record<MessageKey, string>;
/**
 * Adds a language, or overrides strings of an existing one. Missing keys fall
 * back to English.
 *
 *   defineOhashiEditorLocale('fr', { bold: 'Gras', italic: 'Italique' });
 */
export declare function defineOhashiEditorLocale(code: string, messages: Partial<Messages>): void;
/**
 * The user-facing message for an error code, with `{name}` placeholders
 * filled in. A code the editor does not know (a newer server, a custom
 * endpoint) falls back to the generic upload message — the code itself is
 * shown next to it, so support can still tell what happened. A message whose
 * placeholder has no value uses its `.short` variant when there is one.
 */
export declare function errorMessage(messages: Messages, code: string, params?: Record<string, string | number>): string;
/** Messages for `code` (exact, then its base language), falling back to English. */
export declare function resolveMessages(code: string | null): {
    messages: Messages;
    supported: boolean;
};
export {};
