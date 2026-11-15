import { TAG_NAME as e, isOhashiEditorChange as t } from "@2bo-velocity/ohashirichtexteditor";
import { createElement as n, useEffect as r, useRef as i } from "react";
// resources/js/adapters/react.ts
function a({ value: a, onChange: o, name: s, uploadUrl: c, uploadMaxSize: l, toolbar: u, locale: d, label: f, onError: p }) {
	let m = i(null), h = i(o);
	h.current = o;
	let g = i(p);
	return g.current = p, r(() => {
		m.current && (m.current.value = a);
	}, [a]), r(() => {
		let e = m.current;
		if (!e) return;
		let n = (e) => {
			t(e) && h.current(e.detail.html);
		}, r = (e) => g.current?.(e);
		return e.addEventListener("change", n), e.addEventListener("ohashi-error", r), () => {
			e.removeEventListener("change", n), e.removeEventListener("ohashi-error", r);
		};
	}, []), n(e, {
		ref: m,
		name: s,
		"upload-url": c,
		"upload-max-size": l === void 0 ? void 0 : String(l),
		toolbar: u,
		locale: d,
		label: f
	});
}
export { a as OhashiEditor, a as default };
