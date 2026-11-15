import { OhashiEditorChangeEvent, OhashiEditorElement, TAG_NAME, isOhashiEditorChange } from './core/OhashiEditorElement';

export { OhashiEditorChangeEvent, OhashiEditorElement, TAG_NAME, isOhashiEditorChange };
export type { OhashiEditorChangeDetail, OhashiEditorErrorDetail } from './core/OhashiEditorElement';
export { defineOhashiEditorIcons } from './core/icons';
export { defineOhashiEditorLocale, type Messages as OhashiEditorMessages } from './core/i18n';

/** Registers the custom element once, however many times the bundle is loaded. */
export function defineOhashiEditor(): void {
  // No custom element registry outside a browser (SSR): nothing to define.
  if (typeof customElements === 'undefined') return;
  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, OhashiEditorElement);
  }
}

defineOhashiEditor();
