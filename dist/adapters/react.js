import { TAG_NAME as e, isOhashiEditorChange as t } from "@2bo-velocity/ohashirichtexteditor";
import { createElement as n, useEffect as r, useRef as i } from "react";
// resources/js/adapters/react.ts
function a({ value: a, onChange: o, name: s, htmlLint: c = !0, uploadUrl: l, uploadMaxSize: u, toolbar: d, locale: f, label: p, onError: m }) {
	let h = i(null), g = i(o);
	g.current = o;
	let _ = i(m);
	return _.current = m, r(() => {
		h.current && (h.current.value = a);
	}, [a]), r(() => {
		let e = h.current;
		if (!e) return;
		let n = (e) => {
			t(e) && g.current(e.detail.html);
		}, r = (e) => _.current?.(e);
		return e.addEventListener("change", n), e.addEventListener("ohashi-error", r), () => {
			e.removeEventListener("change", n), e.removeEventListener("ohashi-error", r);
		};
	}, []), n(e, {
		ref: h,
		name: s,
		"html-lint": String(c),
		"upload-url": l,
		"upload-max-size": u === void 0 ? void 0 : String(u),
		toolbar: d,
		locale: f,
		label: p
	});
}
export { a as OhashiEditor, a as default };
