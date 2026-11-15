export declare const TAG_NAME = "ohashi-rich-text-editor";
export interface OhashiEditorChangeDetail {
    html: string;
}
/** `detail` of the `ohashi-error` event: a failure the person using the editor ran into. */
export interface OhashiEditorErrorDetail {
    /** 'OE-UPL-4001' and so on: where it failed, for developers and support. */
    code: string;
    /** The message in the editor's UI language, as the editor shows it. */
    message: string;
    params: Record<string, string | number>;
    /** The original exception or Response, for logging. */
    cause?: unknown;
}
declare const EventBase: typeof Event;
/**
 * The editor's `change` event: `detail.html` is the new value.
 *
 * Deliberately *not* a CustomEvent. Alpine's x-model — and with it
 * Livewire's wire:model — takes `event.detail` as the new value whenever the
 * event is a CustomEvent, so `wire:model.change` would have stored the
 * `{ html }` object instead of the HTML. As a plain Event it reads
 * `el.value`, like for any form control.
 */
export declare class OhashiEditorChangeEvent extends EventBase {
    readonly detail: OhashiEditorChangeDetail;
    constructor(html: string);
}
/**
 * True for the editor's own `change` event. The name is shared with native
 * change events, which carry no `detail`; listeners must not assume one.
 */
export declare function isOhashiEditorChange(event: Event): event is OhashiEditorChangeEvent;
declare const ElementBase: typeof HTMLElement;
export declare class OhashiEditorElement extends ElementBase {
    #private;
    static readonly formAssociated = true;
    static get observedAttributes(): string[];
    constructor();
    /** The editor's HTML, normalised. An editor with nothing in it is ''. */
    get value(): string;
    /**
     * Accepts what frameworks actually pass: null and undefined (a nullable
     * column bound with `value={data.body}`) mean empty, not the text
     * "undefined".
     *
     * The HTML is cleaned before it touches the live DOM (see sanitize.ts):
     * stored content must never execute on the page that loads it. It is then
     * normalised, so the editor always holds one consistent shape of HTML.
     *
     * Writing back the value the editor already holds is a no-op. Vue's v-model
     * and React's controlled props echo every change straight back; replacing
     * the content on each echo would reset the caret and break IME composition.
     */
    set value(html: string | null | undefined);
    /**
     * Reflects the `name` attribute. It must have a setter: Vue and React 19 set
     * a custom element's *property* rather than its attribute whenever the
     * property exists, so a getter-only `name` silently dropped the field name
     * passed through the adapters — and with it, the form submission.
     */
    get name(): string;
    set name(value: string);
    /** Steps back through the editor's own history. Returns false when there is nothing to undo. */
    undo(): boolean;
    redo(): boolean;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _old: string | null, next: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: OhashiEditorElement;
    }
}
export {};
