import { defineComponent, h, type PropType } from 'vue';
// Importing the core by package name (not by relative path) registers the
// custom element and keeps it out of this bundle: the build marks the name
// external, so in the host app it resolves to the one installed copy instead
// of a second bundled one.
import { TAG_NAME, isOhashiEditorChange } from '@2bo-velocity/ohashirichtexteditor';

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
export const OhashiEditor = defineComponent({
  name: 'OhashiEditor',
  props: {
    modelValue: { type: String, default: '' },
    name: { type: String, default: undefined },
    // Reserved for HTML lint (v1.1); has no effect yet.
    htmlLint: { type: Boolean as PropType<boolean>, default: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(TAG_NAME, {
        // `.value` sets the DOM property rather than the attribute, so the
        // element's no-op-on-same-value setter is what absorbs v-model's echo.
        '.value': props.modelValue,
        name: props.name,
        onChange: (event: Event) => {
          if (isOhashiEditorChange(event)) emit('update:modelValue', event.detail.html);
        },
      });
  },
});

export default OhashiEditor;
