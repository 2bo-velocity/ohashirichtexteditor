import { defineComponent as e, h as t } from "vue";
import { TAG_NAME as n, isOhashiEditorChange as r } from "@2bo-velocity/ohashirichtexteditor";
// resources/js/adapters/vue.ts
var i = e({
	name: "OhashiEditor",
	props: {
		modelValue: {
			type: String,
			default: ""
		},
		name: {
			type: String,
			default: void 0
		},
		htmlLint: {
			type: Boolean,
			default: !0
		}
	},
	emits: ["update:modelValue"],
	setup(e, { emit: i }) {
		return () => t(n, {
			".value": e.modelValue,
			name: e.name,
			"html-lint": String(e.htmlLint),
			onChange: (e) => {
				r(e) && i("update:modelValue", e.detail.html);
			}
		});
	}
});
export { i as OhashiEditor, i as default };
