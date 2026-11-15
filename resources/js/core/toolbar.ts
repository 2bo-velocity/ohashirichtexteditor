/**
 * The toolbar: buttons built from the `toolbar` attribute, with roving focus
 * (one Tab stop; arrow keys, Home and End move between buttons), pressed
 * state as aria-pressed plus the `btn-active` part, and icons that can be
 * replaced through `icon-<name>` slots.
 */
import { SHORTCUTS, TOOL_NAMES, type ToolName } from './commands';
import type { Messages } from './i18n';
import { iconFor } from './icons';

export interface ToolState {
  active: boolean;
  enabled: boolean;
  /** Replaces the button's name while set (the image button reads "Edit image" on a selected image). */
  label?: string;
}

/** Parses "bold italic | link" into groups. Unknown names are reported, not thrown. */
export function parseToolbar(spec: string): { groups: ToolName[][]; unknown: string[] } {
  const unknown: string[] = [];
  const groups = spec
    .split('|')
    .map((group) =>
      group
        .trim()
        .split(/\s+/)
        .filter((name) => {
          if (!name) return false;
          if ((TOOL_NAMES as readonly string[]).includes(name)) return true;
          unknown.push(name);
          return false;
        }) as ToolName[],
    )
    .filter((group) => group.length);
  return { groups, unknown };
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function shortcutLabel(shortcut: string): string {
  return isMac()
    ? shortcut.replace('Mod+', '⌘').replace('Shift+', '⇧')
    : shortcut.replace('Mod+', 'Ctrl+');
}

export class Toolbar {
  readonly #el: HTMLElement;
  #buttons = new Map<ToolName, HTMLButtonElement>();

  constructor(el: HTMLElement, onTool: (tool: ToolName) => void) {
    this.#el = el;
    // Keep the selection (and focus) in the editing area when a button is clicked.
    el.addEventListener('mousedown', (e) => {
      if ((e.target as Element).closest('button')) e.preventDefault();
    });
    el.addEventListener('click', (e) => {
      const button = (e.target as Element).closest('button');
      if (button?.dataset.tool) onTool(button.dataset.tool as ToolName);
    });
    el.addEventListener('keydown', (e) => this.#onKeydown(e));
  }

  get tools(): ToolName[] {
    return Array.from(this.#buttons.keys());
  }

  render(groups: ToolName[][], messages: Messages): void {
    const doc = this.#el.ownerDocument;
    this.#buttons.clear();
    this.#el.replaceChildren();
    this.#el.setAttribute('aria-label', messages.toolbar);
    for (const group of groups) {
      const groupEl = doc.createElement('div');
      groupEl.className = 'orte-toolbar-group';
      groupEl.setAttribute('part', 'group');
      groupEl.setAttribute('role', 'group');
      for (const tool of group) {
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = `orte-btn orte-btn--${tool}`;
        button.setAttribute('part', `btn btn-${tool}`);
        button.dataset.tool = tool;
        const shortcut = SHORTCUTS[tool];
        const label = messages[tool];
        button.setAttribute('aria-label', label);
        button.title = shortcut ? `${label} (${shortcutLabel(shortcut)})` : label;
        button.dataset.label = label;
        button.dataset.title = button.title;
        button.tabIndex = -1;
        const icon = doc.createElement('span');
        icon.className = 'orte-icon';
        icon.setAttribute('part', 'icon');
        const slot = doc.createElement('slot');
        slot.name = `icon-${tool}`;
        const fallback = iconFor(tool);
        if (fallback) slot.append(fallback);
        icon.append(slot);
        button.append(icon);
        groupEl.append(button);
        this.#buttons.set(tool, button);
      }
      this.#el.append(groupEl);
    }
    this.#resetTabStop();
  }

  update(states: Map<ToolName, ToolState>): void {
    for (const [tool, button] of this.#buttons) {
      const state = states.get(tool) ?? { active: false, enabled: true };
      button.disabled = !state.enabled;
      // Undo, redo and image are actions, not on/off states: no aria-pressed.
      const toggles = tool !== 'undo' && tool !== 'redo' && tool !== 'image';
      if (toggles) button.setAttribute('aria-pressed', String(state.active));
      button.setAttribute('part', `btn btn-${tool}${state.active ? ' btn-active' : ''}`);
      button.classList.toggle('is-active', state.active);
      const label = state.label ?? button.dataset.label ?? '';
      if (button.getAttribute('aria-label') !== label) {
        button.setAttribute('aria-label', label);
        button.title = state.label ?? button.dataset.title ?? '';
      }
    }
    if (!this.#focusable().some((b) => b.tabIndex === 0)) this.#resetTabStop();
  }

  #focusable(): HTMLButtonElement[] {
    return Array.from(this.#buttons.values()).filter((b) => !b.disabled);
  }

  #resetTabStop(): void {
    const buttons = Array.from(this.#buttons.values());
    buttons.forEach((b) => (b.tabIndex = -1));
    const first = buttons.find((b) => !b.disabled);
    if (first) first.tabIndex = 0;
  }

  #onKeydown(e: KeyboardEvent): void {
    const buttons = this.#focusable();
    const current = buttons.indexOf(e.target as HTMLButtonElement);
    if (current < 0) return;
    const next = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: buttons.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = buttons[(next + buttons.length) % buttons.length]!;
    buttons.forEach((b) => (b.tabIndex = -1));
    target.tabIndex = 0;
    target.focus();
  }
}
