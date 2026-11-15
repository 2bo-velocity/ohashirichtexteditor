import { OhashiEditorChangeEvent, OhashiEditorElement, TAG_NAME, isOhashiEditorChange } from './core/OhashiEditorElement';
export { OhashiEditorChangeEvent, OhashiEditorElement, TAG_NAME, isOhashiEditorChange };
export type { OhashiEditorChangeDetail, OhashiEditorErrorDetail } from './core/OhashiEditorElement';
export { defineOhashiEditorIcons } from './core/icons';
export { defineOhashiEditorLocale, type Messages as OhashiEditorMessages } from './core/i18n';
/** Registers the custom element once, however many times the bundle is loaded. */
export declare function defineOhashiEditor(): void;
