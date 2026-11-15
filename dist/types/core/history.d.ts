/**
 * The editor's own undo history. The browser's history cannot be relied on:
 * it does not know about the editor's own DOM work (normalisation, lists,
 * code blocks, paste, uploads), so after those it undoes nothing or the
 * wrong step. Ctrl/Cmd+Z and the browser's undo (a cancelable beforeinput
 * historyUndo in all three engines) are routed here; so is an undo the
 * browser performed anyway (document.execCommand('undo') sends no
 * beforeinput in Chromium and Firefox) — the editor puts the content back
 * and takes its own step.
 */
import type { Path } from './selection';
export interface Snapshot {
    html: string;
    selection: {
        start: [Path, number];
        end: [Path, number];
    } | null;
}
export declare class History {
    #private;
    constructor(limit?: number);
    /** Starts over from `snapshot` (a new document was loaded). */
    reset(snapshot: Snapshot): void;
    /** Records `snapshot` unless it equals the current one. Drops any redo branch. */
    record(snapshot: Snapshot): boolean;
    undo(): Snapshot | null;
    redo(): Snapshot | null;
    get canUndo(): boolean;
    get canRedo(): boolean;
}
