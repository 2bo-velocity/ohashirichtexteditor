import { type PropType } from 'vue';
/**
 * <OhashiEditor v-model="form.body" name="body" />
 *
 * A thin wrapper: the custom element does all the work. Only the value crosses
 * the boundary — Vue never renders into the editor's shadow tree.
 *
 * Other attributes and listeners fall through to the element unchanged:
 * `upload-url`, `upload-max-size`, `toolbar`, `locale`, `label`,
 * `@ohashi-error`.
 */
export declare const OhashiEditor: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    modelValue: {
        type: StringConstructor;
        default: string;
    };
    name: {
        type: StringConstructor;
        default: undefined;
    };
    htmlLint: {
        type: PropType<boolean>;
        default: boolean;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    modelValue: {
        type: StringConstructor;
        default: string;
    };
    name: {
        type: StringConstructor;
        default: undefined;
    };
    htmlLint: {
        type: PropType<boolean>;
        default: boolean;
    };
}>> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    modelValue: string;
    name: string;
    htmlLint: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default OhashiEditor;
