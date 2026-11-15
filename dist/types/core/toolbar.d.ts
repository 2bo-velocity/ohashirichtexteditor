/**
 * The toolbar: buttons built from the `toolbar` attribute, with roving focus
 * (one Tab stop; arrow keys, Home and End move between buttons), pressed
 * state as aria-pressed plus the `btn-active` part, and icons that can be
 * replaced through `icon-<name>` slots.
 */
import { type ToolName } from './commands';
import type { Messages } from './i18n';
export interface ToolState {
    active: boolean;
    enabled: boolean;
    /** Replaces the button's name while set (the image button reads "Edit image" on a selected image). */
    label?: string;
}
/** Parses "bold italic | link" into groups. Unknown names are reported, not thrown. */
export declare function parseToolbar(spec: string): {
    groups: ToolName[][];
    unknown: string[];
};
export declare class Toolbar {
    #private;
    constructor(el: HTMLElement, onTool: (tool: ToolName) => void);
    get tools(): ToolName[];
    render(groups: ToolName[][], messages: Messages): void;
    update(states: Map<ToolName, ToolState>): void;
}
