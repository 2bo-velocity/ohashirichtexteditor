/**
 * Messages for the person using the editor, shown between the toolbar and
 * the content (never over it). Errors stay until dismissed; a newer notice
 * with the same code replaces the older one rather than stacking.
 *
 *   <div part="notice notice-error" role="alert">
 *     <span part="notice-message">…</span> <code part="notice-code">OE-UPL-4001</code>
 *     <button part="btn btn-notice-close">…</button>
 *   </div>
 *
 * Progress ("Uploading image…") is a `notice-info` with role="status": it is
 * announced politely and removed by the editor when the work is done.
 */
import type { Messages } from './i18n';
export type NoticeKind = 'error' | 'warning' | 'info';
export declare class Notices {
    #private;
    readonly el: HTMLElement;
    constructor(doc: Document, onDismiss: () => void);
    /** Shows a notice under `key` (an error code, or a name for progress), replacing one with the same key. */
    show(key: string, kind: NoticeKind, message: string, code?: string): void;
    remove(key: string): void;
    localize(messages: Messages): void;
}
