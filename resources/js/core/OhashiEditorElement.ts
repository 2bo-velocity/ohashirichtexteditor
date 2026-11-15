import styles from './styles.css?inline';
import { sanitizeToFragment } from './sanitize';
import { normalize } from './normalize';
import { History, type Snapshot } from './history';
import { insertFragment, textToFragment } from './insert';
import { isVisuallyEmpty } from './dom';
import { bookmark, caretAfter, edge, intoBlock, nodeAt, pathOf, readRange, restore, selectedImage, supportsComposedRanges, writeRange, collapsedAt } from './selection';
import { COMMANDS, DEFAULT_TOOLBAR, applyLink, linkAt, removeLink, type Context, type ToolName } from './commands';
import { Toolbar, parseToolbar, type ToolState } from './toolbar';
import { LinkPopover } from './link-popover';
import { ImagePopover } from './image-popover';
import { Notices } from './notice';
import { ACCEPTED_TYPES, UploadError, uploadImage } from './upload';
import { errorMessage, resolveMessages, type Messages } from './i18n';
import type { Boundary } from './normalize';

/** Commands the editor performs itself by moving nodes; the caret is restored after them. */
const OWN_DOM_COMMANDS = new Set<ToolName>(['quote', 'ul', 'ol', 'code']);

/** Typing is recorded in the undo history once it pauses this long. */
const HISTORY_DEBOUNCE_MS = 400;

export const TAG_NAME = 'ohashi-rich-text-editor';

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

const EventBase: typeof Event = typeof Event === 'undefined' ? (class {} as unknown as typeof Event) : Event;

/**
 * The editor's `change` event: `detail.html` is the new value.
 *
 * Deliberately *not* a CustomEvent. Alpine's x-model — and with it
 * Livewire's wire:model — takes `event.detail` as the new value whenever the
 * event is a CustomEvent, so `wire:model.change` would have stored the
 * `{ html }` object instead of the HTML. As a plain Event it reads
 * `el.value`, like for any form control.
 */
export class OhashiEditorChangeEvent extends EventBase {
  readonly detail: OhashiEditorChangeDetail;

  constructor(html: string) {
    super('change', { bubbles: true, composed: true });
    this.detail = { html };
  }
}

/**
 * True for the editor's own `change` event. The name is shared with native
 * change events, which carry no `detail`; listeners must not assume one.
 */
export function isOhashiEditorChange(event: Event): event is OhashiEditorChangeEvent {
  const detail = (event as Partial<CustomEvent<unknown>>).detail as { html?: unknown } | null | undefined;
  return typeof detail?.html === 'string';
}

/**
 * <ohashi-rich-text-editor name="body" value="<p>…</p>">
 *
 * Everything lives in a closed-off Shadow DOM: page CSS (Bootstrap, Tailwind
 * resets) cannot reach in, and the host framework's virtual DOM only ever sees
 * this one element and its attributes — never the editable tree inside.
 *
 * The element is form-associated, so it takes part in <form> submission under
 * its `name` exactly like a <textarea>.
 */
// Server-side rendering (Inertia SSR) evaluates this module in Node, where
// HTMLElement does not exist and `extends HTMLElement` would throw at import
// time. The stand-in lets the module load; the element is only ever defined
// and constructed in a browser (see defineOhashiEditor()).
/**
 * The shadow root's stylesheet, shared by every editor on the page.
 *
 * A <style> element is inline CSS as far as Content-Security-Policy is
 * concerned: on pages that send `style-src 'self'` (common on hardened admin
 * screens) Chrome blocked it and the editor rendered unstyled. A constructed
 * stylesheet adopted by the shadow root is not subject to that directive.
 * Browsers without constructable stylesheets (Safari < 16.4) fall back to
 * <style>, which works wherever CSP allows inline styles.
 */
let sharedSheet: CSSStyleSheet | null | undefined;

function adoptStyles(root: ShadowRoot): void {
  if (sharedSheet === undefined) {
    try {
      sharedSheet = 'adoptedStyleSheets' in root ? new CSSStyleSheet() : null;
      sharedSheet?.replaceSync(styles);
    } catch {
      sharedSheet = null;
    }
  }
  if (sharedSheet) {
    root.adoptedStyleSheets = [sharedSheet];
  } else {
    const style = document.createElement('style');
    style.textContent = styles;
    root.prepend(style);
  }
}

const ElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

export class OhashiEditorElement extends ElementBase {
  static readonly formAssociated = true;

  static get observedAttributes(): string[] {
    return ['value', 'name', 'label', 'toolbar', 'locale', 'upload-url'];
  }

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  readonly #content: HTMLDivElement;
  readonly #history = new History();
  #abort: AbortController | null = null;
  /**
   * Stand-in for ElementInternals in browsers without it (Safari < 16.4).
   * Without one the value silently never reached the form.
   */
  #fallbackInput: HTMLInputElement | null = null;
  /** Between compositionstart and compositionend: the IME owns the DOM. */
  #composing = false;
  #historyTimer: ReturnType<typeof setTimeout> | null = null;
  /** A drag that started inside the editor: the browser moves the content itself. */
  #draggingFromInside = false;
  readonly #toolbar: Toolbar;
  readonly #popover: LinkPopover;
  readonly #imagePopover: ImagePopover;
  readonly #notices: Notices;
  readonly #fileInput: HTMLInputElement;
  /** The image the image popover edits. */
  #selectedImage: HTMLImageElement | null = null;
  /** Uploads in flight. */
  #uploads = 0;
  #messages: Messages = resolveMessages(null).messages;
  /** The last selection inside the editor: toolbar buttons and the link dialog act on it. */
  #savedRange: Range | null = null;
  #statePending = false;
  /**
   * The content as the editor last left it (normalised). An undo the browser
   * performs itself is rolled back to this before the editor's own runs.
   */
  #lastHtml = '';
  readonly #warned = new Set<string>();

  constructor() {
    super();
    this.#internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;

    const root = this.attachShadow({ mode: 'open' });
    this.#root = root;

    const container = document.createElement('div');
    container.className = 'orte-container';
    container.setAttribute('part', 'container');

    const toolbar = document.createElement('div');
    toolbar.className = 'orte-toolbar';
    toolbar.setAttribute('part', 'toolbar');
    toolbar.setAttribute('role', 'toolbar');

    this.#content = document.createElement('div');
    this.#content.className = 'orte-content';
    this.#content.setAttribute('part', 'content');
    this.#content.contentEditable = 'true';
    this.#content.setAttribute('role', 'textbox');
    this.#content.setAttribute('aria-multiline', 'true');
    this.#syncLabel();

    this.#toolbar = new Toolbar(toolbar, (tool) => this.#guard(() => this.#runTool(tool)));
    this.#popover = new LinkPopover(document, {
      apply: (values) => this.#applyLink(values.url, values.newTab),
      remove: () => this.#guard(() => this.#removeLink()),
      close: () => this.#closePopover(),
    });

    this.#imagePopover = new ImagePopover(document, {
      width: (percent) => this.#guard(() => this.#setImageWidth(percent)),
      apply: (alt) => this.#guard(() => this.#setImageAlt(alt)),
      close: () => this.#guard(() => this.#closeImagePopover()),
    });
    this.#notices = new Notices(document, () => this.#refocus(this.#savedRange));

    // The file picker behind the image button. It never takes part in a form.
    this.#fileInput = document.createElement('input');
    this.#fileInput.type = 'file';
    this.#fileInput.accept = ACCEPTED_TYPES.join(',');
    this.#fileInput.multiple = true;
    this.#fileInput.hidden = true;
    this.#fileInput.tabIndex = -1;
    this.#fileInput.addEventListener('change', () =>
      this.#guard(() => {
        const files = Array.from(this.#fileInput.files ?? []);
        this.#fileInput.value = '';
        if (files.length) void this.#uploadFiles(files, this.#savedRange);
      }),
    );

    container.append(toolbar, this.#notices.el, this.#popover.el, this.#imagePopover.el, this.#content);
    root.append(container, this.#fileInput);
    adoptStyles(root);
    this.#render();
    this.#history.reset(this.#snapshot());
  }

  /** The editor's HTML, normalised. An editor with nothing in it is ''. */
  get value(): string {
    return isVisuallyEmpty(this.#content) ? '' : serialize(this.#content.innerHTML);
  }

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
  set value(html: string | null | undefined) {
    const probe = document.createElement('div');
    probe.append(sanitizeToFragment(html == null ? '' : String(html)));
    normalize(probe);
    // Compared in the serialised form `value` returns, so a framework echoing
    // `value` back is recognised as the same content.
    const current = this.#content.innerHTML;
    const next = probe.innerHTML;
    if (next === current || next === serialize(current) || (isVisuallyEmpty(probe) && isVisuallyEmpty(this.#content))) return;

    this.#content.replaceChildren(...Array.from(probe.childNodes));
    // The remembered selection pointed into the nodes just replaced.
    this.#savedRange = null;
    this.#closeImagePopover(false);
    this.#cancelPendingHistory();
    this.#history.reset(this.#snapshot());
    this.#lastHtml = this.#content.innerHTML;
    this.#syncForm();
  }

  /**
   * Reflects the `name` attribute. It must have a setter: Vue and React 19 set
   * a custom element's *property* rather than its attribute whenever the
   * property exists, so a getter-only `name` silently dropped the field name
   * passed through the adapters — and with it, the form submission.
   */
  get name(): string {
    return this.getAttribute('name') ?? '';
  }

  set name(value: string) {
    this.setAttribute('name', value);
  }

  /** Steps back through the editor's own history. Returns false when there is nothing to undo. */
  undo(): boolean {
    this.#flushHistory();
    const snapshot = this.#history.undo();
    if (!snapshot) return false;
    this.#apply(snapshot);
    return true;
  }

  redo(): boolean {
    this.#flushHistory();
    const snapshot = this.#history.redo();
    if (!snapshot) return false;
    this.#apply(snapshot);
    return true;
  }

  connectedCallback(): void {
    // A page script may have set these before this class was defined (module
    // scripts are deferred). Such a write creates a plain own property that
    // shadows the accessor for good: the editor showed nothing while the form
    // kept submitting the stale value. Re-apply it through the accessor.
    // A property set that way is the more recent intent, so it wins over the
    // value attribute.
    const early = this.#takeEarlyProperty('value');
    this.#takeEarlyProperty('name');
    if (early !== undefined) {
      this.value = early as string | null | undefined;
    } else if (this.hasAttribute('value')) {
      this.value = this.getAttribute('value');
    }

    if (!this.#internals && !this.#fallbackInput) {
      this.#fallbackInput = document.createElement('input');
      this.#fallbackInput.type = 'hidden';
      this.appendChild(this.#fallbackInput);
    }
    this.#syncForm();

    // One controller per connection: Inertia swaps pages without a reload, so
    // anything not torn down in disconnectedCallback would pile up.
    this.#abort = new AbortController();
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) =>
      this.#content.addEventListener(type, (e) => this.#guard(() => fn(e)), { signal: this.#abort!.signal });

    on('compositionstart', () => {
      this.#composing = true;
    });
    on('compositionend', () => {
      this.#composing = false;
      this.#afterChange('debounce');
    });
    on('input', (e) => {
      // The browser's own input event stays inside: it fires before the
      // editor has normalised the DOM, and not at all for undo, paste, lists
      // or uploads. The host fires its own `input` for every change instead
      // (see #emitChange), which is what wire:model / x-model listen to.
      e.stopPropagation();
      // An undo / redo the editor could not cancel: Chromium and Firefox
      // send no beforeinput for document.execCommand('undo') (a page script,
      // an extension), so the browser has already changed the DOM by its own
      // history, which knows nothing of the editor's. Put the content back
      // and take the step from the editor's history instead — the same
      // result as Ctrl+Z and as WebKit, where the beforeinput does arrive.
      const inputType = (e as InputEvent).inputType;
      if (inputType === 'historyUndo' || inputType === 'historyRedo') {
        this.#content.replaceChildren(sanitizeToFragment(this.#lastHtml));
        if (inputType === 'historyUndo') this.undo();
        else this.redo();
        return;
      }
      // During composition the IME owns the DOM: rewriting it would break the
      // conversion. Keep the form value current, change nothing else.
      if (this.#composing || (e as InputEvent).isComposing) {
        this.#syncForm();
        this.#emitChange();
        return;
      }
      this.#afterChange('debounce');
    });
    on('keydown', (e) => this.#onKeydown(e));
    on('beforeinput', (e) => this.#onBeforeInput(e));
    document.addEventListener('selectionchange', () => this.#guard(() => this.#onSelectionChange()), { signal: this.#abort.signal });
    this.#render();
    on('paste', (e) => this.#onPaste(e));
    on('dragstart', () => {
      this.#draggingFromInside = true;
    });
    on('dragend', () => {
      this.#draggingFromInside = false;
    });
    on('drop', (e) => this.#onDrop(e));
    on('click', (e) => this.#onContentClick(e));
  }

  disconnectedCallback(): void {
    this.#flushHistory();
    this.#abort?.abort();
    this.#abort = null;
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (name === 'value' && this.isConnected) {
      this.value = next;
    } else if (name === 'name') {
      this.#syncForm();
    } else if (name === 'label') {
      this.#syncLabel();
    } else if (name === 'toolbar' || name === 'locale' || name === 'upload-url') {
      this.#render();
    }
  }

  // ---------------------------------------------------------------------
  // Toolbar and commands
  // ---------------------------------------------------------------------

  /** Builds the toolbar from the `toolbar` and `locale` attributes. */
  #render(): void {
    const { messages, supported } = resolveMessages(this.getAttribute('locale'));
    if (!supported) this.#warn(`locale:${this.getAttribute('locale')}`, `[OE-CFG-1002] Unsupported locale "${this.getAttribute('locale')}"; using English.`);
    this.#messages = messages;

    const spec = this.getAttribute('toolbar');
    const { groups, unknown } = parseToolbar(spec ?? DEFAULT_TOOLBAR);
    for (const name of unknown) this.#warn(`tool:${name}`, `[OE-CFG-1001] Unknown toolbar item "${name}".`);
    // Images need somewhere to upload to. An explicitly requested `image`
    // without an upload URL is a configuration mistake worth reporting; the
    // default toolbar's `image` is simply left out.
    const canUpload = !!this.getAttribute('upload-url');
    if (spec !== null && /(^|\s|\|)image(\s|\||$)/.test(spec) && !canUpload) {
      this.#warn('image', '[OE-CFG-1003] "image" is in the toolbar but no upload-url is set; the button is hidden.');
    }
    const visible = canUpload ? groups : groups.map((g) => g.filter((t) => t !== 'image')).filter((g) => g.length);

    this.#toolbar.render(visible, messages);
    if (!this.#has('image')) this.#closeImagePopover(false);
    this.#popover.localize(messages);
    this.#imagePopover.localize(messages);
    this.#notices.localize(messages);
    this.#syncLabel();
    this.#updateStates();
  }

  #warn(key: string, message: string): void {
    if (this.#warned.has(key)) return;
    this.#warned.add(key);
    console.warn(message);
  }

  #has(tool: ToolName): boolean {
    return this.#toolbar.tools.includes(tool);
  }

  /** The selection to act on: the live one if it is in the editor, else the last one that was. */
  #context(): Context | null {
    const found = readRange(this.#root, this.#content) ?? this.#savedRange;
    if (!found || !this.#content.contains(found.startContainer)) return null;
    const range = intoBlock(found, this.#content);
    const boundaries: Boundary[] = [
      [range.startContainer, range.startOffset],
      [range.endContainer, range.endOffset],
    ];
    return { content: this.#content, range, boundaries };
  }

  /** Puts focus and the selection back into the editing area (after a toolbar button or the dialog took focus). */
  #refocus(range: Range | null): void {
    if (this.#root.activeElement !== this.#content) this.#content.focus({ preventScroll: true });
    if (range && this.#content.contains(range.startContainer)) writeRange(range);
  }

  #runTool(tool: ToolName): void {
    if (!this.#has(tool)) return;
    if (tool === 'undo') return void this.undo();
    if (tool === 'redo') return void this.redo();
    if (tool === 'link') return this.#openLink();
    if (tool === 'image') return this.#chooseImage();

    const ctx = this.#context();
    if (!ctx) return;
    const command = COMMANDS[tool];
    if (!command.isEnabled(ctx)) return;
    this.#refocus(ctx.range);
    this.#flushHistory();
    command.run(ctx);
    if (OWN_DOM_COMMANDS.has(tool)) {
      const [start, end] = ctx.boundaries as [Boundary, Boundary];
      restore({ start, end }, this.#content);
    }
    this.#afterChange('now');
  }

  #openLink(): void {
    const ctx = this.#context();
    if (!ctx || inPre(ctx)) return;
    this.#savedRange = ctx.range.cloneRange();
    this.#closeImagePopover(false);
    const existing = linkAt(ctx);
    this.#popover.open({
      url: existing?.getAttribute('href') ?? '',
      newTab: existing?.getAttribute('target') === '_blank',
      existing: !!existing,
    });
  }

  #applyLink(url: string, newTab: boolean): boolean {
    let ok = false;
    this.#guard(() => {
      const range = this.#savedRange;
      this.#refocus(range);
      const ctx = this.#context();
      if (!ctx) return;
      this.#flushHistory();
      const result = applyLink(ctx, url, newTab);
      ok = result !== 'refused';
      if (!ok) {
        this.#popover.el.querySelector('input')?.focus();
        return;
      }
      const [start, end] = ctx.boundaries as [Boundary, Boundary];
      if (result === 'caret-moved') restore({ start, end }, this.#content);
      this.#popover.close();
      this.#afterChange('now');
    });
    return ok;
  }

  #removeLink(): void {
    this.#refocus(this.#savedRange);
    const ctx = this.#context();
    if (ctx) {
      this.#flushHistory();
      removeLink(ctx);
      const [start, end] = ctx.boundaries as [Boundary, Boundary];
      restore({ start, end }, this.#content);
      this.#afterChange('now');
    }
    this.#popover.close();
  }

  #closePopover(): void {
    this.#popover.close();
    this.#refocus(this.#savedRange);
  }

  // ---------------------------------------------------------------------
  // Images: upload, insert, width and alternative text
  // ---------------------------------------------------------------------

  /**
   * The image button: with an image selected (Shift+Arrow next to it) it
   * edits that image — the keyboard way to the image settings — otherwise
   * it uploads a new one. A caret merely next to an image still uploads, so
   * adding several images in a row keeps working.
   */
  #chooseImage(): void {
    const ctx = this.#context();
    const img = ctx && selectedImage(ctx.range, this.#content);
    if (img) return this.#openImagePopover(img);
    if (ctx) this.#savedRange = ctx.range.cloneRange();
    this.#fileInput.click();
  }

  /**
   * Uploads the files one after another and inserts each image where the
   * caret was when the upload started (or after the previous image). The
   * person can keep writing meanwhile: the range is live, so it follows
   * edits made in between. A failed file is reported and the next one still
   * goes.
   */
  async #uploadFiles(files: File[], at: Range | null): Promise<void> {
    const endpoint = this.getAttribute('upload-url');
    if (!endpoint) return;
    const max = Number(this.getAttribute('upload-max-size'));
    const maxBytes = Number.isFinite(max) && max > 0 ? max : null;
    const signal = this.#abort?.signal;
    let anchor: Range | HTMLImageElement | null = at ? at.cloneRange() : null;

    for (const file of files) {
      if (signal?.aborted) return;
      this.#uploadStarted();
      try {
        const url = await uploadImage(endpoint, file, { maxBytes, signal });
        this.#guard(() => {
          anchor = this.#insertImage(url, anchor);
        });
      } catch (error) {
        // Disconnected (an Inertia page change): nobody is left to tell.
        if (signal?.aborted) return;
        this.#guard(() => {
          if (error instanceof UploadError) this.#reportError(error.code, error.params, error.cause ?? error);
          else this.#reportError('OE-UPL-4900', {}, error);
        });
      } finally {
        this.#uploadFinished();
      }
    }
  }

  #uploadStarted(): void {
    if (this.#uploads++ === 0) {
      this.#notices.show('uploading', 'info', this.#messages['image.uploading']);
      this.#content.setAttribute('aria-busy', 'true');
    }
  }

  #uploadFinished(): void {
    if (--this.#uploads === 0) {
      this.#notices.remove('uploading');
      this.#content.removeAttribute('aria-busy');
    }
  }

  /** Inserts an uploaded image at `anchor` (a range, or the image inserted before it). */
  #insertImage(url: string, anchor: Range | HTMLImageElement | null): HTMLImageElement {
    const img = document.createElement('img');
    img.setAttribute('src', url);
    img.setAttribute('alt', '');

    let range: Range;
    if (anchor instanceof HTMLImageElement && this.#content.contains(anchor)) {
      range = caretAfter(anchor);
    } else if (anchor instanceof Range && this.#content.contains(anchor.startContainer)) {
      range = anchor.cloneRange();
      // Time has passed since the upload began; whatever is selected now was
      // not chosen to be replaced.
      range.collapse(false);
    } else {
      range = document.createRange();
      range.selectNodeContents(this.#content);
      range.collapse(false);
    }

    this.#flushHistory();
    const pre = closestPre(range.startContainer, this.#content);
    if (pre) {
      // Not inside code: after it, in a paragraph of its own.
      const p = document.createElement('p');
      p.append(img);
      pre.after(p);
    } else {
      range.insertNode(img);
    }
    // Only move the caret if the person is still in the editor.
    if (this.#root.activeElement === this.#content) writeRange(caretAfter(img));
    this.#afterChange('now');
    return img;
  }

  #onContentClick(e: MouseEvent): void {
    const target = e.target as Element | null;
    if (!target || target.localName !== 'img' || !this.#has('image')) return;
    this.#openImagePopover(target as HTMLImageElement);
  }

  #openImagePopover(img: HTMLImageElement): void {
    this.#selectedImage = img;
    this.#popover.close();
    this.#imagePopover.open({ width: img.getAttribute('width'), alt: img.getAttribute('alt') ?? '' });
  }

  /** The image being edited, if it is still in the content (undo may have removed it). */
  #editedImage(): HTMLImageElement | null {
    const img = this.#selectedImage;
    if (img && this.#content.contains(img)) return img;
    this.#closeImagePopover(false);
    return null;
  }

  #setImageWidth(percent: number): void {
    const img = this.#editedImage();
    if (!img) return;
    this.#flushHistory();
    img.setAttribute('width', `${percent}%`);
    this.#imagePopover.setWidth(img.getAttribute('width'));
    this.#afterChange('now');
  }

  #setImageAlt(alt: string): void {
    const img = this.#editedImage();
    if (!img) return;
    this.#flushHistory();
    img.setAttribute('alt', alt.trim());
    this.#afterChange('now');
    this.#closeImagePopover();
  }

  /** Closes the image popover; with `refocus`, the caret goes back right after the image. */
  #closeImagePopover(refocus = true): void {
    if (!this.#imagePopover.isOpen) return;
    const img = this.#selectedImage;
    this.#imagePopover.close();
    this.#selectedImage = null;
    if (refocus && img && this.#content.contains(img)) {
      this.#content.focus({ preventScroll: true });
      writeRange(caretAfter(img));
    }
  }

  #onSelectionChange(): void {
    const range = readRange(this.#root, this.#content);
    if (range) this.#savedRange = range;
    this.#updateStates();
  }

  /** Recomputes pressed / enabled states, at most once per frame. */
  #updateStates(): void {
    if (this.#statePending) return;
    this.#statePending = true;
    const run = () => {
      this.#statePending = false;
      const ctx = this.#context();
      const states = new Map<ToolName, ToolState>();
      // Without Selection.getComposedRanges (Firefox before 142) the editor
      // cannot tell where the caret is inside its shadow root. Typing, paste,
      // undo and saving work; commands that act on the selection are shown
      // disabled rather than doing nothing when pressed.
      const canSelect = supportsComposedRanges();
      for (const tool of this.#toolbar.tools) {
        if (!canSelect && tool !== 'undo' && tool !== 'redo') {
          states.set(tool, { active: false, enabled: false });
          continue;
        }
        if (tool === 'undo') states.set(tool, { active: false, enabled: this.#history.canUndo || this.#historyTimer !== null });
        else if (tool === 'redo') states.set(tool, { active: false, enabled: this.#history.canRedo });
        else if (tool === 'link') states.set(tool, { active: !!ctx && !!linkAt(ctx), enabled: !ctx || !inPre(ctx) });
        else if (tool === 'image') {
          const editing = !!ctx && !!selectedImage(ctx.range, this.#content);
          states.set(tool, { active: false, enabled: true, label: editing ? this.#messages['image.edit'] : undefined });
        }
        else {
          const command = COMMANDS[tool];
          states.set(tool, { active: !!ctx && command.isActive(ctx), enabled: !ctx || command.isEnabled(ctx) });
        }
      }
      this.#toolbar.update(states);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this.#guard(run));
    else this.#guard(run);
  }

  #onBeforeInput(e: InputEvent): void {
    // The browser's Edit menu / touch bar undo: route it to our history.
    if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
      e.preventDefault();
      if (e.inputType === 'historyUndo') this.undo();
      else this.redo();
      return;
    }
    // Formatting the editor does not offer (or that is switched off) must not
    // arrive through the browser's own shortcuts or menus either.
    const blocked: Record<string, ToolName | null> = { formatBold: 'bold', formatItalic: 'italic', formatStrikeThrough: 'strike', formatUnderline: null };
    if (e.inputType in blocked) {
      const tool = blocked[e.inputType];
      if (!tool || !this.#has(tool)) e.preventDefault();
      return;
    }
    // Enter inside a code block adds a line, not a new block — except on an
    // empty last line, where it leaves the block (Enter twice at the end).
    // Without that, a code block at the end of the content could never be
    // followed by anything.
    if ((e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') && !e.isComposing) {
      const range = readRange(this.#root, this.#content);
      // Enter on an empty last line of a quote leaves the quote, as Enter on
      // an empty last list item leaves the list. Without it the engines only
      // add empty lines inside the quote.
      const line = e.inputType === 'insertParagraph' && range?.collapsed ? emptyLastLineOfQuote(range, this.#content) : null;
      if (line) {
        e.preventDefault();
        this.#flushHistory();
        leaveQuote(line);
        this.#afterChange('now');
        return;
      }
      const pre = range && closestPre(range.startContainer, this.#content);
      if (range && pre) {
        e.preventDefault();
        if (e.inputType === 'insertParagraph' && range.collapsed && onEmptyLastLine(range, pre)) {
          this.#flushHistory();
          leaveCodeBlock(pre);
          this.#afterChange('now');
        } else {
          insertNewlineInCode(range, pre);
          this.#afterChange('debounce');
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // The input pipeline: change → normalise → history → form value + event
  // ---------------------------------------------------------------------

  /**
   * Runs after every change the user (or a command) made. `record` decides
   * when the undo history takes a snapshot: typing is grouped until it
   * pauses; paste, drop and commands are recorded at once.
   */
  #afterChange(record: 'debounce' | 'now'): void {
    const range = readRange(this.#root, this.#content);
    const mark = range ? bookmark(range) : null;
    // The boundaries are updated in place as normalisation moves nodes.
    if (normalize(this.#content, { boundaries: mark ? [mark.start, mark.end] : [] }) && mark) restore(mark, this.#content);

    if (record === 'now') {
      this.#cancelPendingHistory();
      this.#history.record(this.#snapshot());
    } else {
      this.#cancelPendingHistory();
      this.#historyTimer = setTimeout(() => this.#flushHistory(), HISTORY_DEBOUNCE_MS);
    }
    this.#lastHtml = this.#content.innerHTML;
    this.#syncForm();
    this.#emitChange();
    this.#updateStates();
  }

  #flushHistory(): void {
    if (this.#historyTimer === null) return;
    this.#cancelPendingHistory();
    this.#history.record(this.#snapshot());
    this.#updateStates();
  }

  #cancelPendingHistory(): void {
    if (this.#historyTimer !== null) clearTimeout(this.#historyTimer);
    this.#historyTimer = null;
  }

  #snapshot(): Snapshot {
    const range = this.isConnected ? readRange(this.#root, this.#content) : null;
    const at = (node: Node, offset: number): [number[], number] | null => {
      const path = pathOf(node, this.#content);
      return path ? [path, offset] : null;
    };
    const start = range && at(range.startContainer, range.startOffset);
    const end = range && at(range.endContainer, range.endOffset);
    return { html: this.#content.innerHTML, selection: start && end ? { start, end } : null };
  }

  #apply(snapshot: Snapshot): void {
    // Snapshots are the editor's own normalised DOM, but they go back through
    // the sanitiser anyway: the history must never be a way around it.
    this.#content.replaceChildren(sanitizeToFragment(snapshot.html));
    this.#closeImagePopover(false);
    const start = snapshot.selection && nodeAt(snapshot.selection.start[0], this.#content);
    const end = snapshot.selection && nodeAt(snapshot.selection.end[0], this.#content);
    if (snapshot.selection && start && end) {
      restore({ start: [start, snapshot.selection.start[1]], end: [end, snapshot.selection.end[1]] }, this.#content);
    } else if (this.#root.activeElement === this.#content && this.#content.lastChild) {
      // A snapshot taken while the editor had no focus (the initial value)
      // holds no caret; replacing the content would leave it before the
      // first paragraph, outside any block. Put it at the end instead.
      writeRange(edge(this.#content.lastChild, 'end'));
    }
    // The remembered selection pointed into the replaced nodes; a toolbar
    // button pressed after focus has left acts on it. In Firefox it was left
    // at the start of the content, and `h2` made a new, empty heading there
    // instead of turning the paragraph into one.
    this.#savedRange = readRange(this.#root, this.#content);
    this.#lastHtml = this.#content.innerHTML;
    this.#syncForm();
    this.#emitChange();
    this.#updateStates();
  }

  #onKeydown(e: KeyboardEvent): void {
    // keyCode 229: a key the IME is handling, even where isComposing lags.
    if (this.#composing || e.isComposing || e.keyCode === 229) return;
    // ArrowDown / ArrowRight at the end of a code block, quote, list or
    // heading that ends the content: there is nowhere to go, so make a
    // paragraph to go to (a trailing empty paragraph is not saved).
    if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const range = readRange(this.#root, this.#content);
      const last = this.#content.lastElementChild;
      if (range?.collapsed && last && last.localName !== 'p' && last.contains(range.startContainer) && atEndOfBlock(range, last)) {
        e.preventDefault();
        this.#flushHistory();
        const p = document.createElement('p');
        p.append(document.createElement('br'));
        last.after(p);
        writeRange(collapsedAt(p, 0));
        this.#afterChange('now');
      }
      return;
    }
    // Enter on a selected image opens its settings, instead of replacing the
    // image with a line break.
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && this.#has('image')) {
      const ctx = this.#context();
      const img = ctx && selectedImage(ctx.range, this.#content);
      if (img) {
        e.preventDefault();
        this.#openImagePopover(img);
      }
      return;
    }
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    const shortcut = (tool: ToolName) => {
      // A tool left out of the toolbar loses its shortcut — including the
      // browser's built-in one for it.
      e.preventDefault();
      if (this.#has(tool)) this.#runTool(tool);
    };
    if (key === 'z' && !e.shiftKey) shortcut('undo');
    else if ((key === 'z' && e.shiftKey) || (key === 'y' && e.ctrlKey && !e.metaKey)) shortcut('redo');
    else if (key === 'b' && !e.shiftKey) shortcut('bold');
    else if (key === 'i' && !e.shiftKey) shortcut('italic');
    else if (key === 'k' && !e.shiftKey) shortcut('link');
    else if (key === 'u' && !e.shiftKey) e.preventDefault(); // underline is not something the editor produces
  }

  /**
   * The browser's own paste is cancelled: measured across engines it carries
   * the source page's styling in (WebKit wraps every run of text in a styled
   * <span>). The clipboard HTML is cleaned with the allowlist and inserted
   * by the editor.
   */
  #onPaste(e: ClipboardEvent): void {
    const data = e.clipboardData;
    if (!data) return;
    e.preventDefault();
    const range = readRange(this.#root, this.#content);
    if (!range) return;
    // A screenshot or a copied file: upload it. When HTML comes along (a
    // copied web page, Word — which adds a picture of the selection), the
    // HTML is what was meant.
    if (data.files.length && !data.types.includes('text/html')) {
      if (this.#has('image')) void this.#uploadFiles(Array.from(data.files), range);
      return;
    }
    this.#insert(range, data);
  }

  #onDrop(e: DragEvent): void {
    // Moving content within the editor: the browser handles it, and the
    // input event that follows normalises the result.
    if (this.#draggingFromInside) return;
    const data = e.dataTransfer;
    e.preventDefault();
    if (!data) return;
    const range = this.#rangeAtPoint(e.clientX, e.clientY) ?? readRange(this.#root, this.#content);
    // Dropped files are uploaded (the server decides what is an image). With
    // uploads off nothing is inserted — and the browser must not navigate
    // away to the dropped file either, hence the preventDefault above.
    if (data.files.length && !data.types.includes('text/html')) {
      if (this.#has('image')) void this.#uploadFiles(Array.from(data.files), range);
      return;
    }
    if (!range) return;
    this.#insert(range, data);
  }

  #insert(range: Range, data: DataTransfer): void {
    const html = data.getData('text/html');
    const fragment = html ? sanitizeToFragment(html) : textToFragment(data.getData('text/plain'));
    if (!fragment.childNodes.length) return;
    this.#flushHistory();
    const caret = insertFragment(this.#content, range, fragment);
    writeRange(caret);
    this.#afterChange('now');
  }

  /** The caret position under a point, inside the shadow root. */
  #rangeAtPoint(x: number, y: number): Range | null {
    const doc = document as Document & {
      caretPositionFromPoint?: (x: number, y: number, options?: { shadowRoots?: ShadowRoot[] }) => CaretPosition | null;
    };
    if (typeof doc.caretPositionFromPoint === 'function') {
      const position = doc.caretPositionFromPoint(x, y, { shadowRoots: [this.#root] });
      if (position && this.#content.contains(position.offsetNode)) {
        return collapsedAt(position.offsetNode, position.offset);
      }
    }
    if (typeof document.caretRangeFromPoint === 'function') {
      const range = document.caretRangeFromPoint(x, y);
      if (range && this.#content.contains(range.startContainer)) return range;
    }
    return null;
  }

  /**
   * An exception inside the editor must not escape into the host page's
   * error handling (jQuery handlers, framework error boundaries). It is
   * reported to the console; the content is left as it is.
   */
  #guard(fn: () => void): void {
    try {
      fn();
    } catch (error) {
      console.error('[OE-CORE-9001] Unexpected error in the editor.', error);
      try {
        this.#reportError('OE-CORE-9001', {}, error);
      } catch {
        // Reporting must never be the second failure that reaches the page.
      }
    }
  }

  /**
   * Tells the person using the editor that something failed: an `ohashi-error`
   * event first, then the in-editor notice unless a listener called
   * preventDefault() (to show the message its own way).
   */
  #reportError(code: string, params: Record<string, string | number>, cause?: unknown): void {
    const message = errorMessage(this.#messages, code, params);
    const proceed = this.dispatchEvent(
      new CustomEvent<OhashiEditorErrorDetail>('ohashi-error', {
        detail: { code, message, params, cause },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (proceed) this.#notices.show(code, 'error', message, code);
  }

  /**
   * Announces a new value: `input` (a plain Event, like a form control's;
   * read `el.value`) and then `change` with `detail.html`. Both fire for every
   * change — typing, commands, undo, paste, uploads — but not when the value
   * is set from outside, so a framework writing the value back causes no loop.
   */
  #emitChange(): void {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new OhashiEditorChangeEvent(this.value));
  }

  /**
   * The editable area is the element assistive technology lands on, and it
   * lives in the shadow tree, where a page's <label for> cannot point. Its
   * name therefore comes from the host's `label` attribute.
   */
  #syncLabel(): void {
    this.#content.setAttribute('aria-label', this.getAttribute('label') || this.#messages.editor);
  }

  /** Removes an own property set before upgrade and returns its value. */
  #takeEarlyProperty(key: 'value' | 'name'): unknown {
    if (!Object.prototype.hasOwnProperty.call(this, key)) return undefined;
    const value = (this as Record<string, unknown>)[key];
    delete (this as Record<string, unknown>)[key];
    if (key === 'name' && value != null) this.name = String(value);
    return value;
  }

  #syncForm(): void {
    if (this.#internals) {
      this.#internals.setFormValue(this.value);
    } else if (this.#fallbackInput) {
      this.#fallbackInput.name = this.name;
      this.#fallbackInput.value = this.value;
    }
  }
}

/**
 * The HTML as it leaves the editor. The editor itself keeps both of these
 * (the caret may be about to use them); the saved HTML does not:
 *
 *  - A newline at the very end of a code block shows nothing, and engines
 *    disagree on whether one is left there after typing on a new last line
 *    (Firefox keeps the one the editor adds to make that line visible;
 *    Chromium and WebKit do not). Dropped, so every engine yields the same
 *    value.
 *  - Empty paragraphs at the end — Enter pressed at the end of the text, or
 *    the paragraph made to leave a final code block and not used — would be
 *    saved as blank space after the article.
 */
function serialize(html: string): string {
  return html.replace(/\n((?:<\/code>)?<\/pre>)/g, '$1').replace(/(?:<p>(?:<br>)?<\/p>)+$/, '');
}

function closestPre(node: Node, content: Element): Element | null {
  for (let n: Node | null = node; n && n !== content; n = n.parentNode) {
    if (n.nodeType === Node.ELEMENT_NODE && (n as Element).localName === 'pre') return n as Element;
  }
  return null;
}

const inPre = (ctx: Context) => closestPre(ctx.range.startContainer, ctx.content) !== null;

/** The text between the caret and the end of `pre`. */
function textAfter(range: Range, pre: Element): string {
  const after = document.createRange();
  after.setStart(range.startContainer, range.startOffset);
  after.setEnd(pre, pre.childNodes.length);
  return after.toString();
}

/** The caret is on a line of its own at the end of `pre`: only newlines after it, a newline right before it. */
function onEmptyLastLine(range: Range, pre: Element): boolean {
  const before = document.createRange();
  before.setStart(pre, 0);
  before.setEnd(range.startContainer, range.startOffset);
  return textAfter(range, pre).replace(/\n/g, '') === '' && before.toString().endsWith('\n');
}

const LINE_BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre', 'blockquote', 'td', 'th', 'div']);

/** The innermost line-level block holding `node`, up to `top`. */
function lineBlock(node: Node, top: Element): Element {
  for (let n: Node | null = node; n && n !== top; n = n.parentNode) {
    if (n.nodeType === Node.ELEMENT_NODE && LINE_BLOCKS.has((n as Element).localName)) return n as Element;
  }
  return top;
}

/** The caret is at the end of the last line of `block`: nothing visible after it. */
function atEndOfBlock(range: Range, block: Element): boolean {
  const after = document.createRange();
  after.setStart(range.startContainer, range.startOffset);
  after.setEnd(block, block.childNodes.length);
  if (block.localName === 'pre') return after.toString().replace(/\n/g, '') === '';
  if (after.toString() !== '' || after.cloneContents().querySelector('img')) return false;
  // An empty line further down (<p><br></p> at the end of a quote) is somewhere to go.
  const end = edge(block, 'end');
  return lineBlock(range.startContainer, block) === lineBlock(end.startContainer, block);
}

/** The empty paragraph the caret is in, when it is the last line of a top-level quote. */
function emptyLastLineOfQuote(range: Range, content: Element): Element | null {
  const quote = Array.from(content.children).find((c) => c.localName === 'blockquote' && c.contains(range.startContainer));
  if (!quote) return null;
  const line = lineBlock(range.startContainer, quote);
  if (line.localName !== 'p' || line.parentNode !== quote || line !== quote.lastElementChild) return null;
  if (line.textContent !== '' || line.querySelector('img')) return null;
  return line;
}

/** Moves the empty last line out of its quote, below it, with the caret in it. */
function leaveQuote(line: Element): void {
  const quote = line.parentNode as Element;
  const p = document.createElement('p');
  p.append(document.createElement('br'));
  if (quote.children.length === 1) quote.replaceWith(p);
  else {
    line.remove();
    quote.after(p);
  }
  writeRange(collapsedAt(p, 0));
}

/** Drops the empty last line(s) of `pre` and puts the caret in a new paragraph after it. */
function leaveCodeBlock(pre: Element): void {
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) texts.push(n);
  for (let i = texts.length - 1; i >= 0; i--) {
    const text = texts[i]!;
    text.data = text.data.replace(/\n+$/, '');
    if (text.data !== '') break;
    text.remove();
  }
  const p = document.createElement('p');
  p.append(document.createElement('br'));
  pre.after(p);
  writeRange(collapsedAt(p, 0));
}

/**
 * Inserts a newline at the caret inside <pre>. A newline at the very end of a
 * <pre> renders nothing, so when the caret is at the end a second one keeps
 * the new, still empty line visible.
 */
function insertNewlineInCode(range: Range, pre: Element): void {
  range.deleteContents();
  const newline = document.createTextNode('\n');
  range.insertNode(newline);
  const after = document.createRange();
  after.setStartAfter(newline);
  after.setEndAfter(pre.lastChild ?? pre);
  if (!/\S|\n/.test(after.toString())) newline.after(document.createTextNode('\n'));
  const caret = document.createRange();
  caret.setStartAfter(newline);
  writeRange(caret);
}

declare global {
  interface HTMLElementTagNameMap {
    [TAG_NAME]: OhashiEditorElement;
  }
}
