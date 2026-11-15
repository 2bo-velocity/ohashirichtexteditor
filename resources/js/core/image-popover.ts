/**
 * The image editor, opened by clicking an image in the content: width presets
 * (25 / 50 / 75 / 100 %, stored as the `width` attribute — free resizing would
 * leave inline styles behind) and the alternative text.
 */
import type { Messages } from './i18n';

export const IMAGE_WIDTHS = [25, 50, 75, 100] as const;

export class ImagePopover {
  readonly el: HTMLElement;
  readonly #alt: HTMLInputElement;
  /** Shown while the alternative text is empty: a nudge, not an error (decorative images rightly have none). */
  readonly #altHint: HTMLElement;
  readonly #widths = new Map<number, HTMLButtonElement>();
  readonly #widthGroup: HTMLElement;
  readonly #texts: Record<string, HTMLElement> = {};

  constructor(
    doc: Document,
    handlers: { width(percent: number): void; apply(alt: string): void; close(): void },
  ) {
    const el = doc.createElement('div');
    el.className = 'orte-popover orte-popover--image';
    el.setAttribute('part', 'popover popover-image');
    el.setAttribute('role', 'dialog');
    el.hidden = true;

    this.#widthGroup = doc.createElement('div');
    this.#widthGroup.className = 'orte-popover-widths';
    this.#widthGroup.setAttribute('role', 'group');
    for (const percent of IMAGE_WIDTHS) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'orte-btn orte-btn--text';
      b.textContent = `${percent}%`;
      b.setAttribute('part', 'btn btn-image-width');
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => handlers.width(percent));
      this.#widths.set(percent, b);
      this.#widthGroup.append(b);
    }

    const label = doc.createElement('label');
    label.className = 'orte-popover-label';
    const labelText = doc.createElement('span');
    this.#texts.alt = labelText;
    this.#alt = doc.createElement('input');
    this.#alt.type = 'text';
    this.#alt.className = 'orte-input';
    this.#alt.setAttribute('part', 'input input-image-alt');
    label.append(labelText, this.#alt);

    this.#altHint = doc.createElement('p');
    this.#altHint.className = 'orte-popover-hint';
    this.#altHint.id = 'orte-image-alt-hint';
    this.#alt.addEventListener('input', () => this.#syncHint());

    const actions = doc.createElement('div');
    actions.className = 'orte-popover-actions';
    const button = (key: string, part: string) => {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'orte-btn orte-btn--text';
      b.setAttribute('part', part);
      this.#texts[key] = b;
      actions.append(b);
      return b;
    };
    const apply = button('apply', 'btn btn-primary btn-image-apply');
    const close = button('close', 'btn btn-popover-close');

    apply.addEventListener('click', () => handlers.apply(this.#alt.value));
    close.addEventListener('click', () => handlers.close());
    el.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.close();
      } else if (e.key === 'Enter' && e.target === this.#alt) {
        e.preventDefault();
        handlers.apply(this.#alt.value);
      }
    });

    el.append(this.#widthGroup, label, this.#altHint, actions);
    this.el = el;
  }

  localize(messages: Messages): void {
    this.el.setAttribute('aria-label', messages['image.dialog']);
    this.#widthGroup.setAttribute('aria-label', messages['image.width']);
    this.#texts.alt!.textContent = messages['image.alt'];
    this.#alt.placeholder = messages['image.altHint'];
    this.#altHint.textContent = messages['image.altMissing'];
    this.#texts.apply!.textContent = messages['image.apply'];
    this.#texts.close!.textContent = messages['image.close'];
  }

  open(values: { width: string | null; alt: string }): void {
    this.#alt.value = values.alt;
    this.#syncHint();
    this.setWidth(values.width);
    this.el.hidden = false;
    this.#alt.focus();
    this.#alt.select();
  }

  /** Marks the preset matching the image's current width, if any. */
  setWidth(width: string | null): void {
    for (const [percent, b] of this.#widths) {
      const active = width === `${percent}%`;
      b.setAttribute('part', `btn btn-image-width${active ? ' btn-active' : ''}`);
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('is-active', active);
    }
  }

  #syncHint(): void {
    const empty = this.#alt.value.trim() === '';
    this.#altHint.hidden = !empty;
    if (empty) this.#alt.setAttribute('aria-describedby', this.#altHint.id);
    else this.#alt.removeAttribute('aria-describedby');
  }

  close(): void {
    this.el.hidden = true;
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }
}
