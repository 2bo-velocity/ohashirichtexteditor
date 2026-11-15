import { type OhashiEditorElement, type OhashiEditorErrorDetail } from '@2bo-velocity/ohashirichtexteditor';
export interface OhashiEditorProps {
    value: string;
    onChange: (html: string) => void;
    name?: string;
    htmlLint?: boolean;
    /** Where images are uploaded, e.g. route('ohashi-editor.images.store'). Without it there is no image button. */
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
export declare function OhashiEditor({ value, onChange, name, htmlLint, uploadUrl, uploadMaxSize, toolbar, locale, label, onError }: OhashiEditorProps): import("react").ReactElement<{
    ref: import("react").RefObject<OhashiEditorElement | null>;
    name: string | undefined;
    'html-lint': string;
    'upload-url': string | undefined;
    'upload-max-size': string | undefined;
    toolbar: string | undefined;
    locale: string | undefined;
    label: string | undefined;
}, string | import("react").JSXElementConstructor<any>>;
export default OhashiEditor;
