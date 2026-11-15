import { createElement, useEffect, useRef } from 'react';
// Importing the core by package name (not by relative path) registers the
// custom element and keeps it out of this bundle: the build marks the name
// external, so in the host app it resolves to the one installed copy instead
// of a second bundled one.
import {
  TAG_NAME,
  isOhashiEditorChange,
  type OhashiEditorElement,
  type OhashiEditorErrorDetail,
} from '@2bo-velocity/ohashirichtexteditor';

export interface OhashiEditorProps {
  value: string;
  onChange: (html: string) => void;
  name?: string;
  /** Reserved for HTML lint (v1.1); has no effect yet. */
  htmlLint?: boolean;
  /**
   * Where images are uploaded. Give a path on the page's own origin — with
   * Ziggy, route('ohashi-editor.images.store', undefined, false) — so the
   * session cookie and CSRF token are sent. Without it there is no image button.
   */
  uploadUrl?: string;
  /** The largest file (bytes) the endpoint accepts; larger files are refused before sending. */
  uploadMaxSize?: number;
  toolbar?: string;
  locale?: string;
  label?: string;
  /** A failure the person using the editor ran into. Call `event.preventDefault()` to show it yourself instead of the editor's notice. */
  onError?: (event: CustomEvent<OhashiEditorErrorDetail>) => void;
}

/**
 * <OhashiEditor value={data.body} onChange={(html) => setData('body', html)} />
 *
 * The value is pushed through the DOM property and the change event is bound by
 * hand: React's synthetic onChange does not see a custom element's CustomEvent.
 */
export function OhashiEditor({ value, onChange, name, uploadUrl, uploadMaxSize, toolbar, locale, label, onError }: OhashiEditorProps) {
  const ref = useRef<OhashiEditorElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (ref.current) ref.current.value = value;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const listener = (event: Event) => {
      if (isOhashiEditorChange(event)) onChangeRef.current(event.detail.html);
    };
    const errorListener = (event: Event) => onErrorRef.current?.(event as CustomEvent<OhashiEditorErrorDetail>);
    el.addEventListener('change', listener);
    el.addEventListener('ohashi-error', errorListener);
    return () => {
      el.removeEventListener('change', listener);
      el.removeEventListener('ohashi-error', errorListener);
    };
  }, []);

  return createElement(TAG_NAME, {
    ref,
    name,
    'upload-url': uploadUrl,
    'upload-max-size': uploadMaxSize === undefined ? undefined : String(uploadMaxSize),
    toolbar,
    locale,
    label,
  });
}

export default OhashiEditor;
