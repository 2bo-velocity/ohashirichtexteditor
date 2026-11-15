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
  selection: { start: [Path, number]; end: [Path, number] } | null;
}

export class History {
  readonly #limit: number;
  #stack: Snapshot[] = [];
  #index = -1;

  constructor(limit = 50) {
    this.#limit = limit;
  }

  /** Starts over from `snapshot` (a new document was loaded). */
  reset(snapshot: Snapshot): void {
    this.#stack = [snapshot];
    this.#index = 0;
  }

  /** Records `snapshot` unless it equals the current one. Drops any redo branch. */
  record(snapshot: Snapshot): boolean {
    if (this.#stack[this.#index]?.html === snapshot.html) {
      // Same content: just remember the newer caret position.
      if (this.#index >= 0) this.#stack[this.#index] = snapshot;
      return false;
    }
    this.#stack.splice(this.#index + 1);
    this.#stack.push(snapshot);
    if (this.#stack.length > this.#limit) this.#stack.shift();
    this.#index = this.#stack.length - 1;
    return true;
  }

  undo(): Snapshot | null {
    if (this.#index <= 0) return null;
    return this.#stack[--this.#index]!;
  }

  redo(): Snapshot | null {
    if (this.#index >= this.#stack.length - 1) return null;
    return this.#stack[++this.#index]!;
  }

  get canUndo(): boolean {
    return this.#index > 0;
  }

  get canRedo(): boolean {
    return this.#index < this.#stack.length - 1;
  }
}
