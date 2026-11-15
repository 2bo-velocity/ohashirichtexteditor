/**
 * The image editor, opened by clicking an image in the content: width presets
 * (25 / 50 / 75 / 100 %, stored as the `width` attribute — free resizing would
 * leave inline styles behind) and the alternative text.
 */
import type { Messages } from './i18n';
export declare const IMAGE_WIDTHS: readonly [25, 50, 75, 100];
export declare class ImagePopover {
    #private;
    readonly el: HTMLElement;
    constructor(doc: Document, handlers: {
        width(percent: number): void;
        apply(alt: string): void;
        close(): void;
    });
    localize(messages: Messages): void;
    open(values: {
        width: string | null;
        alt: string;
    }): void;
    /** Marks the preset matching the image's current width, if any. */
    setWidth(width: string | null): void;
    close(): void;
    get isOpen(): boolean;
}
