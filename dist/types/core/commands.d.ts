/**
 * The command layer: what each toolbar button and shortcut does.
 *
 * Measured across engines (see the engine survey tests), some formatting can
 * be delegated to document.execCommand — its output is identical in
 * Chromium, Firefox and WebKit and is normalised right after. Lists are NOT:
 * Chromium nests them inside <p>, and WebKit copies the editor's host element
 * into the list, breaking the shadow root. Lists, quotes and code blocks are
 * therefore done here, moving nodes through the Tracker so the caret stays
 * where it was. All delegation to execCommand goes through this file, so
 * replacing it one day touches nothing else.
 */
import { BLOCK } from './dom';
import { type Boundary } from './normalize';
export declare const TOOL_NAMES: readonly ['undo', 'redo', 'bold', 'italic', 'strike', 'paragraph', 'h2', 'h3', 'quote', 'ul', 'ol', 'link', 'code', 'image'];
export type ToolName = (typeof TOOL_NAMES)[number];
export declare const DEFAULT_TOOLBAR = "undo redo | bold italic strike | paragraph h2 h3 quote | ul ol | link code image";
/** Shortcuts, by tool. Shown in tooltips; a tool left out of the toolbar loses its shortcut too. */
export declare const SHORTCUTS: Partial<Record<ToolName, string>>;
export interface Context {
    content: HTMLElement;
    range: Range;
    /** Boundaries of `range`, kept valid while nodes move. */
    boundaries: Boundary[];
}
interface Command {
    isActive(ctx: Context): boolean;
    isEnabled(ctx: Context): boolean;
    run(ctx: Context): void;
}
export declare const COMMANDS: Record<Exclude<ToolName, 'undo' | 'redo' | 'link' | 'image'>, Command>;
export declare const linkAt: (ctx: Context) => HTMLAnchorElement | null;
/**
 * Creates or updates a link over the range. Returns 'refused' (and changes
 * nothing) for a URL that is not allowed — the same check the sanitiser
 * applies, so the editor never creates a link the server would strip.
 * 'caret-moved' means ctx.boundaries now hold where the caret should go.
 */
export declare function applyLink(ctx: Context, url: string, newTab: boolean): 'refused' | 'applied' | 'caret-moved';
export declare function removeLink(ctx: Context): void;
export { BLOCK };
