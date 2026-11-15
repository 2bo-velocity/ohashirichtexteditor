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

export class Notices {
  readonly el: HTMLElement;
  readonly #items = new Map<string, HTMLElement>();
  #closeLabel = 'Dismiss';
  readonly #onDismiss: () => void;

  constructor(doc: Document, onDismiss: () => void) {
    this.el = doc.createElement('div');
    this.el.className = 'orte-notices';
    this.#onDismiss = onDismiss;
  }

  /** Shows a notice under `key` (an error code, or a name for progress), replacing one with the same key. */
  show(key: string, kind: NoticeKind, message: string, code?: string): void {
    const doc = this.el.ownerDocument;
    const item = doc.createElement('div');
    item.className = `orte-notice orte-notice--${kind}`;
    item.setAttribute('part', `notice notice-${kind}`);
    item.setAttribute('role', kind === 'info' ? 'status' : 'alert');

    const text = doc.createElement('span');
    text.className = 'orte-notice-message';
    text.setAttribute('part', 'notice-message');
    text.textContent = message;
    item.append(text);

    if (code) {
      const codeEl = doc.createElement('code');
      codeEl.className = 'orte-notice-code';
      codeEl.setAttribute('part', 'notice-code');
      codeEl.textContent = code;
      item.append(' ', codeEl);
    }

    if (kind !== 'info') {
      const close = doc.createElement('button');
      close.type = 'button';
      close.className = 'orte-btn orte-btn--text orte-notice-close';
      close.setAttribute('part', 'btn btn-notice-close');
      close.setAttribute('aria-label', this.#closeLabel);
      close.textContent = '×';
      close.addEventListener('click', () => {
        this.remove(key);
        this.#onDismiss();
      });
      item.append(close);
    }

    const previous = this.#items.get(key);
    if (previous) previous.replaceWith(item);
    else this.el.append(item);
    this.#items.set(key, item);
  }

  remove(key: string): void {
    this.#items.get(key)?.remove();
    this.#items.delete(key);
  }

  localize(messages: Messages): void {
    this.#closeLabel = messages['notice.close'];
    for (const button of this.el.querySelectorAll('[part~="btn-notice-close"]')) {
      button.setAttribute('aria-label', this.#closeLabel);
    }
  }
}
