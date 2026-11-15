/** The link editor: URL, "open in a new tab", apply / remove / close. */
import type { Messages } from './i18n';

export interface LinkValues {
  url: string;
  newTab: boolean;
}

export class LinkPopover {
  readonly el: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #newTab: HTMLInputElement;
  readonly #error: HTMLElement;
  readonly #remove: HTMLButtonElement;
  readonly #texts: Record<string, HTMLElement> = {};

  constructor(
    doc: Document,
    handlers: { apply(values: LinkValues): boolean; remove(): void; close(): void },
  ) {
    const el = doc.createElement('div');
    el.className = 'orte-popover orte-popover--link';
    el.setAttribute('part', 'popover popover-link');
    el.setAttribute('role', 'dialog');
    el.hidden = true;

    const label = doc.createElement('label');
    label.className = 'orte-popover-label';
    const labelText = doc.createElement('span');
    this.#texts.url = labelText;
    this.#input = doc.createElement('input');
    this.#input.type = 'url';
    this.#input.className = 'orte-input orte-input--url';
    this.#input.setAttribute('part', 'input input-link-url');
    this.#input.placeholder = 'https://';
    label.append(labelText, this.#input);

    const check = doc.createElement('label');
    check.className = 'orte-popover-check';
    this.#newTab = doc.createElement('input');
    this.#newTab.type = 'checkbox';
    this.#newTab.setAttribute('part', 'input-link-blank');
    const checkText = doc.createElement('span');
    this.#texts.newTab = checkText;
    check.append(this.#newTab, checkText);

    this.#error = doc.createElement('p');
    this.#error.className = 'orte-popover-error';
    this.#error.id = 'orte-link-error';
    this.#error.hidden = true;

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
    const apply = button('apply', 'btn btn-primary btn-link-apply');
    this.#remove = button('remove', 'btn btn-link-remove');
    const close = button('close', 'btn btn-popover-close');

    const submit = () => {
      const ok = handlers.apply({ url: this.#input.value, newTab: this.#newTab.checked });
      this.#error.hidden = ok;
      this.#input.setAttribute('aria-invalid', String(!ok));
      if (!ok) this.#input.setAttribute('aria-describedby', this.#error.id);
    };
    apply.addEventListener('click', submit);
    this.#remove.addEventListener('click', () => handlers.remove());
    close.addEventListener('click', () => handlers.close());
    el.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.close();
      } else if (e.key === 'Enter' && e.target === this.#input) {
        e.preventDefault();
        submit();
      }
    });

    el.append(label, check, this.#error, actions);
    this.el = el;
  }

  localize(messages: Messages): void {
    this.el.setAttribute('aria-label', messages['link.dialog']);
    this.#texts.url!.textContent = messages['link.url'];
    this.#texts.newTab!.textContent = messages['link.newTab'];
    this.#texts.apply!.textContent = messages['link.apply'];
    this.#texts.remove!.textContent = messages['link.remove'];
    this.#texts.close!.textContent = messages['link.close'];
    this.#error.textContent = messages['link.invalid'];
  }

  open(values: LinkValues & { existing: boolean }): void {
    this.#input.value = values.url;
    this.#newTab.checked = values.newTab;
    this.#remove.hidden = !values.existing;
    this.#error.hidden = true;
    this.#input.removeAttribute('aria-invalid');
    this.el.hidden = false;
    this.#input.focus();
    this.#input.select();
  }

  close(): void {
    this.el.hidden = true;
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }
}
