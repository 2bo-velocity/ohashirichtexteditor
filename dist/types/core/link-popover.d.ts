/** The link editor: URL, "open in a new tab", apply / remove / close. */
import type { Messages } from './i18n';
export interface LinkValues {
    url: string;
    newTab: boolean;
}
export declare class LinkPopover {
    #private;
    readonly el: HTMLElement;
    constructor(doc: Document, handlers: {
        apply(values: LinkValues): boolean;
        remove(): void;
        close(): void;
    });
    localize(messages: Messages): void;
    open(values: LinkValues & {
        existing: boolean;
    }): void;
    close(): void;
    get isOpen(): boolean;
}
