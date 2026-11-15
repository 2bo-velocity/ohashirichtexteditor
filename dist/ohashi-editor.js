/*! OhashiRichTextEditor | AGPL-3.0-or-later or commercial licence | Includes Lucide icons (ISC, (c) Lucide Icons and Contributors; parts MIT, (c) Cole Bemis) — see THIRD-PARTY-NOTICES.md */
// resources/js/core/styles.css?inline
var e = ":host{--orte-font-family:system-ui, -apple-system, \"Segoe UI\", Roboto, \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;--orte-text-color:#111827;--orte-muted-color:#6b7280;--orte-editor-bg:#fff;--orte-toolbar-bg:#f9fafb;--orte-border-color:#d1d5db;--orte-border-radius:.5rem;--orte-accent-color:#2563eb;--orte-danger-color:#dc2626;--orte-danger-bg:#fef2f2;--orte-code-bg:#1e293b;--orte-code-color:#f8fafc;--orte-icon-size:1.125rem;--orte-min-height:16rem;font-family:var(--orte-font-family);color:var(--orte-text-color);line-height:1.7;display:block}.orte-container{border:1px solid var(--orte-border-color);border-radius:var(--orte-border-radius);background:var(--orte-editor-bg);overflow:hidden}.orte-toolbar{background:var(--orte-toolbar-bg);border-bottom:1px solid var(--orte-border-color);flex-wrap:wrap;gap:2px;padding:4px;display:flex}[hidden]{display:none!important}.orte-toolbar-group{gap:2px;display:flex}.orte-toolbar-group+.orte-toolbar-group{border-left:1px solid var(--orte-border-color);margin-left:4px;padding-left:6px}.orte-btn{border-radius:calc(var(--orte-border-radius) * .75);min-width:2rem;height:2rem;color:inherit;font:inherit;cursor:pointer;background:0 0;border:1px solid #0000;justify-content:center;align-items:center;padding:0 .375rem;display:inline-flex}.orte-btn:hover:not(:disabled){background:color-mix(in srgb, var(--orte-text-color) 8%, transparent)}.orte-btn:focus-visible,.orte-input:focus-visible{outline:2px solid var(--orte-accent-color);outline-offset:1px}.orte-btn.is-active{background:color-mix(in srgb, var(--orte-accent-color) 14%, transparent);color:var(--orte-accent-color)}.orte-btn:disabled{opacity:.4;cursor:default}.orte-icon{width:var(--orte-icon-size);height:var(--orte-icon-size);display:inline-flex}.orte-icon svg,::slotted(*){width:100%;height:100%}.orte-popover{background:var(--orte-toolbar-bg);border-bottom:1px solid var(--orte-border-color);flex-wrap:wrap;align-items:center;gap:.5rem .75rem;padding:.5rem .75rem;font-size:.875rem;display:flex}.orte-popover-label{flex:16rem;align-items:center;gap:.5rem;display:flex}.orte-input{border:1px solid var(--orte-border-color);border-radius:calc(var(--orte-border-radius) * .75);background:var(--orte-editor-bg);min-width:0;color:inherit;font:inherit;flex:1;padding:.25rem .5rem}.orte-input[aria-invalid=true]{border-color:var(--orte-danger-color)}.orte-popover-check{align-items:center;gap:.375rem;display:flex}.orte-popover-error{background:var(--orte-danger-bg);color:var(--orte-danger-color);border-radius:.25rem;flex-basis:100%;margin:0;padding:.25rem .5rem}.orte-popover-actions{gap:.25rem;display:flex}.orte-btn--text{border-color:var(--orte-border-color);height:auto;padding:.25rem .625rem}.orte-btn--text[part~=btn-primary]{border-color:var(--orte-accent-color);background:var(--orte-accent-color);color:#fff}.orte-toolbar:empty{display:none}.orte-content{min-height:var(--orte-min-height);overflow-wrap:anywhere;outline:none;padding:.75rem 1rem}.orte-content>:first-child{margin-top:0}.orte-content :where(p,ul,ol,blockquote,pre){margin:0 0 .75em}.orte-content :where(h2){margin:1em 0 .5em;font-size:1.4em;line-height:1.3}.orte-content :where(h3){margin:1em 0 .5em;font-size:1.2em;line-height:1.35}.orte-content :where(ul,ol){padding-left:1.5em}.orte-content :where(blockquote){border-left:3px solid var(--orte-accent-color);color:var(--orte-muted-color);padding-left:1em}.orte-content :where(pre){border-radius:calc(var(--orte-border-radius) * .75);background:var(--orte-code-bg);color:var(--orte-code-color);white-space:pre;padding:.75em 1em;overflow-x:auto}.orte-content :where(code){font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em}.orte-content :where(a){color:var(--orte-accent-color)}.orte-content :where(img){max-width:100%;height:auto}.orte-notices:empty{display:none}.orte-notice{border-bottom:1px solid var(--orte-border-color);flex-wrap:wrap;align-items:center;gap:.25rem .5rem;padding:.5rem .75rem;font-size:.875rem;display:flex}.orte-notice--error,.orte-notice--warning{background:var(--orte-danger-bg);color:var(--orte-danger-color)}.orte-notice--info{background:var(--orte-toolbar-bg);color:var(--orte-muted-color)}.orte-notice-message{flex:12rem}.orte-notice-code{opacity:.8;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.75rem}.orte-notice-close{color:inherit;margin-left:auto}.orte-popover-widths{gap:.25rem;display:flex}.orte-popover-widths .orte-btn.is-active{border-color:var(--orte-accent-color)}.orte-popover-hint{color:var(--orte-muted-color);flex-basis:100%;margin:0;font-size:.8125rem}", t = {
	$comment: [
		"The single allowlist shared by the browser (resources/js/core/sanitize.ts) and",
		"the server (src/HtmlSanitizer.php). Change it here only; both sides read it.",
		"allow: kept, with the listed attributes. unwrap: the element is removed but its",
		"content kept. drop: removed together with its content. Any element in none of",
		"the three (non-standard or custom tags) is dropped with its content, matching",
		"symfony/html-sanitizer. tests/Arch checks every standard element is classified."
	],
	allow: {
		p: [],
		br: [],
		h2: [],
		h3: [],
		h4: [],
		strong: [],
		b: [],
		em: [],
		i: [],
		s: [],
		del: [],
		u: [],
		code: [],
		pre: [],
		blockquote: [],
		ul: [],
		ol: [],
		li: [],
		hr: [],
		a: ["href", "target"],
		img: [
			"src",
			"alt",
			"width"
		],
		table: [],
		thead: [],
		tbody: [],
		tr: [],
		th: ["colspan", "rowspan"],
		td: ["colspan", "rowspan"]
	},
	unwrap: /* @__PURE__ */ "abbr.acronym.address.article.aside.basefont.bdi.bdo.big.body.caption.center.cite.col.colgroup.data.dd.details.dfn.dir.div.dl.dt.fieldset.figcaption.figure.font.footer.h1.h5.h6.header.hgroup.html.ins.kbd.label.layer.legend.main.map.mark.marquee.menu.meter.nav.nobr.output.picture.popup.progress.q.rb.rp.rt.rtc.ruby.samp.section.slot.small.span.strike.sub.summary.sup.tfoot.time.tt.var.wbr".split("."),
	drop: /* @__PURE__ */ "applet.area.audio.base.bgsound.button.canvas.command.datalist.dialog.embed.form.frame.frameset.head.iframe.image.input.keygen.link.listing.math.meta.noscript.object.optgroup.option.plaintext.portal.script.select.selectmenu.source.style.svg.template.textarea.title.track.video.xmp".split("."),
	attributePatterns: {
		a: { target: "^_blank$" },
		img: { width: "^(?:[1-9][0-9]{0,3}|(?:100|[1-9][0-9]?)%)$" },
		th: {
			colspan: "^[1-9][0-9]?$",
			rowspan: "^[1-9][0-9]?$"
		},
		td: {
			colspan: "^[1-9][0-9]?$",
			rowspan: "^[1-9][0-9]?$"
		}
	},
	forcedAttributes: { a: { rel: "noopener noreferrer" } },
	linkSchemes: [
		"http",
		"https",
		"mailto",
		"tel"
	],
	mediaSchemes: ["http", "https"],
	dataImageTypes: [
		"png",
		"jpeg",
		"gif",
		"webp",
		"avif"
	]
}, n = t.allow, r = new Set(t.unwrap), i = t.attributePatterns, a = t.forcedAttributes, o = new Set(t.linkSchemes.map((e) => `${e}:`)), s = new Set(t.mediaSchemes.map((e) => `${e}:`)), c = RegExp(`^data:image/(?:${t.dataImageTypes.join("|")});base64,[a-z0-9+/=\\s]+$`, "i"), l = /* @__PURE__ */ new Set(["href", "src"]), u = /* @__PURE__ */ new Map();
function d(e, t) {
	let n = i[e]?.[t];
	if (n === void 0) return;
	let r = `${e}[${t}]`, a = u.get(r);
	return a || u.set(r, a = new RegExp(n, "u")), a;
}
function f(e, t) {
	let n = e.replace(/[\u0000- \u007f-\u009f]/g, ""), r = /^([a-z][a-z0-9+.-]*):/i.exec(n);
	if (!r) return !0;
	let i = `${r[1].toLowerCase()}:`;
	return t === "src" ? s.has(i) || c.test(n) : o.has(i);
}
function ee(e, t) {
	let n = e.localName;
	for (let r of Array.from(e.attributes)) {
		let i = r.name.toLowerCase();
		t.includes(i) && (!l.has(i) || f(r.value, i)) && (d(n, i)?.test(r.value) ?? !0) || e.removeAttribute(r.name);
	}
	for (let [t, r] of Object.entries(a[n] ?? {})) e.setAttribute(t, r);
}
function p(e) {
	for (let t of Array.from(e.childNodes)) {
		if (t.nodeType === Node.COMMENT_NODE || t.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
			t.remove();
			continue;
		}
		if (t.nodeType !== Node.ELEMENT_NODE) continue;
		let e = t, i = e.localName, a = n[i];
		a ? (p(e), ee(e, a)) : r.has(i) ? (p(e), e.replaceWith(...Array.from(e.childNodes))) : e.remove();
	}
}
function m(e) {
	let t = new DOMParser().parseFromString(`<!DOCTYPE html><body>${e}</body>`, "text/html");
	p(t.body);
	let n = Array.from(t.body.childNodes), r = document.createDocumentFragment();
	for (let e of n) r.append(document.adoptNode(e));
	return r;
}
function te(e) {
	return e.trim() !== "" && f(e.trim(), "href");
}
// resources/js/core/dom.ts
var ne = /* @__PURE__ */ new Set([
	"p",
	"h2",
	"h3",
	"h4",
	"blockquote",
	"ul",
	"ol",
	"li",
	"pre",
	"hr",
	"table",
	"div"
]), re = /* @__PURE__ */ new Set([
	"strong",
	"em",
	"s",
	"u",
	"code",
	"del"
]), h = (e) => !!e && e.nodeType === Node.ELEMENT_NODE, g = (e) => !!e && e.nodeType === Node.TEXT_NODE, _ = (e) => h(e) && ne.has(e.localName);
function v(e) {
	return g(e) ? e.data.replace(/[\s​]/g, "") === "" : h(e) ? [
		"img",
		"hr",
		"table"
	].includes(e.localName) || e.querySelector("img, hr, table") ? !1 : (e.textContent ?? "").replace(/[\s​]/g, "") === "" : !0;
}
// resources/js/core/normalize.ts
var ie = {
	b: "strong",
	i: "em",
	strike: "s"
}, y = (e) => Array.prototype.indexOf.call(e.parentNode.childNodes, e), b = class {
	boundaries;
	constructor(e) {
		this.boundaries = e;
	}
	holds(e) {
		return this.boundaries.some(([t]) => e === t || e.contains(t));
	}
	rename(e, t) {
		let n = e.ownerDocument.createElement(t);
		for (let t of Array.from(e.attributes)) n.setAttribute(t.name, t.value);
		n.append(...Array.from(e.childNodes)), e.replaceWith(n);
		for (let t of this.boundaries) t[0] === e && (t[0] = n);
		return n;
	}
	unwrap(e) {
		let t = e.parentNode, n = y(e), r = e.childNodes.length;
		for (let i of this.boundaries) i[0] === e ? (i[0] = t, i[1] = n + i[1]) : i[0] === t && i[1] > n && (i[1] += r - 1);
		e.replaceWith(...Array.from(e.childNodes));
	}
	remove(e) {
		let t = e.parentNode, n = y(e);
		for (let r of this.boundaries) e === r[0] || e.contains(r[0]) ? (r[0] = t, r[1] = n) : r[0] === t && r[1] > n && --r[1];
		e.remove();
	}
	wrap(e, t) {
		let n = e[0].parentNode, r = y(e[0]), i = n.ownerDocument.createElement(t);
		for (let t of this.boundaries) t[0] === n && (t[1] >= r && t[1] <= r + e.length ? (t[0] = i, t[1] -= r) : t[1] > r + e.length && (t[1] -= e.length - 1));
		return n.insertBefore(i, e[0]), i.append(...e), i;
	}
};
function x(e, n = {}) {
	let r = !1, i = () => r = !0, a = new b(n.boundaries ?? []);
	for (let t of Array.from(e.querySelectorAll("[style], [class], [id], [dir], [align]"))) {
		for (let e of [
			"style",
			"class",
			"id",
			"dir",
			"align"
		]) t.removeAttribute(e);
		i();
	}
	for (let [n, r] of Object.entries(t.forcedAttributes)) for (let t of Array.from(e.querySelectorAll(n))) for (let [e, n] of Object.entries(r)) t.getAttribute(e) !== n && (t.setAttribute(e, n), i());
	for (let t of Array.from(e.querySelectorAll("a"))) {
		let e = t.getAttributeNames(), n = [
			"href",
			"target",
			"rel"
		].filter((t) => e.includes(t)), r = e.filter((e) => !n.includes(e)), a = [...n, ...r];
		if (a.join() !== e.join()) {
			let n = a.map((e) => [e, t.getAttribute(e)]);
			for (let n of e) t.removeAttribute(n);
			for (let [e, r] of n) t.setAttribute(e, r);
			i();
		}
	}
	for (let t of Array.from(e.querySelectorAll("b, i, strike"))) a.rename(t, ie[t.localName]), i();
	for (let t of Array.from(e.querySelectorAll("span, font"))) a.unwrap(t), i();
	for (let t of Array.from(e.querySelectorAll("p"))) Array.from(t.childNodes).some(_) && (ae(t, a), i());
	for (let t of Array.from(e.querySelectorAll("div"))) t.parentNode === e && !Array.from(t.childNodes).some(_) ? a.rename(t, "p") : a.unwrap(t), i();
	S(e, a) && i();
	for (let t of Array.from(e.querySelectorAll("blockquote"))) S(t, a) && i();
	let o = Array.from(re).join(",");
	for (let t of Array.from(e.querySelectorAll(o))) {
		let n = t.nextSibling;
		if (e.contains(t) && h(n) && n.localName === t.localName && !t.attributes.length && !n.attributes.length) {
			let e = Array.from(n.childNodes);
			t.append(...e), a.unwrap(n), i();
		}
	}
	for (let t of Array.from(e.querySelectorAll(o))) e.contains(t) && v(t) && !t.querySelector("br") && !a.holds(t) && (a.remove(t), i());
	for (let t of Array.from(e.querySelectorAll("p, h2, h3, h4"))) !t.firstChild && !a.holds(t) && (a.remove(t), i());
	for (let t of Array.from(e.querySelectorAll("br"))) {
		let e = t.parentElement;
		if (!e || t.nextSibling || !_(e)) continue;
		let n = t.previousSibling;
		n && !(h(n) && n.localName === "br") && !v(e) && (a.remove(t), i());
	}
	return r;
}
function S(e, t) {
	let n = !1, r = [], i = () => {
		if (r.length && r.some((e) => !g(e) || e.data.trim() !== "")) t.wrap(r, "p"), n = !0;
		else for (let e of r) t.remove(e), n = !0;
		r = [];
	};
	for (let n of Array.from(e.childNodes)) _(n) ? i() : n.nodeType === Node.COMMENT_NODE ? t.remove(n) : r.push(n);
	return i(), n;
}
function ae(e, t) {
	let n = Array.from(e.childNodes), r = n.findIndex(_), i = n.slice(r);
	e.after(...i), e.parentElement;
	let a = [], o = () => {
		a.length && t.wrap(a, "p"), a = [];
	};
	for (let e of i) _(e) ? o() : a.push(e);
	o(), v(e) && !e.querySelector("br") && !t.holds(e) && t.remove(e);
}
// resources/js/core/history.ts
var oe = class {
	#e;
	#t = [];
	#n = -1;
	constructor(e = 50) {
		this.#e = e;
	}
	reset(e) {
		this.#t = [e], this.#n = 0;
	}
	record(e) {
		return this.#t[this.#n]?.html === e.html ? (this.#n >= 0 && (this.#t[this.#n] = e), !1) : (this.#t.splice(this.#n + 1), this.#t.push(e), this.#t.length > this.#e && this.#t.shift(), this.#n = this.#t.length - 1, !0);
	}
	undo() {
		return this.#n <= 0 ? null : this.#t[--this.#n];
	}
	redo() {
		return this.#n >= this.#t.length - 1 ? null : this.#t[++this.#n];
	}
	get canUndo() {
		return this.#n > 0;
	}
	get canRedo() {
		return this.#n < this.#t.length - 1;
	}
};
// resources/js/core/selection.ts
function se() {
	return typeof Selection < "u" && typeof Selection.prototype.getComposedRanges == "function";
}
function ce(e, t) {
	try {
		return e.getComposedRanges({ shadowRoots: [t] });
	} catch (n) {
		if (!(n instanceof TypeError)) throw n;
		return e.getComposedRanges(t);
	}
}
function C(e, t) {
	let n = document.getSelection();
	if (!n || n.rangeCount === 0 || !se()) return null;
	let [r] = ce(n, e);
	if (!r || !t.contains(r.startContainer) || !t.contains(r.endContainer)) return null;
	let i = document.createRange();
	return i.setStart(r.startContainer, r.startOffset), i.setEnd(r.endContainer, r.endOffset), i;
}
function w(e) {
	document.getSelection()?.setBaseAndExtent(e.startContainer, e.startOffset, e.endContainer, e.endOffset);
}
function T(e, t) {
	let n = document.createRange();
	return n.setStart(e, t), n;
}
function E(e) {
	if (e.nodeType === Node.TEXT_NODE) return T(e, e.length);
	let t = document.createRange();
	return t.setStartAfter(e), t;
}
function le(e, t) {
	if (!e.collapsed || e.startContainer !== t) return e;
	let n = t.childNodes[e.startOffset], r = t.childNodes[e.startOffset - 1];
	return n ? D(n, "start") : r ? D(r, "end") : e;
}
function D(e, t) {
	let n = e;
	for (; n.nodeType === Node.ELEMENT_NODE && n.childNodes.length && ![
		"br",
		"img",
		"hr"
	].includes(n.localName);) n = t === "start" ? n.firstChild : n.lastChild;
	if (n.nodeType === Node.TEXT_NODE) return T(n, t === "start" ? 0 : n.length);
	let r = document.createRange();
	return t === "start" ? r.setStartBefore(n) : r.setStartAfter(n), r;
}
function O(e, t) {
	if (e.collapsed) return null;
	let n = e.cloneContents();
	if ((n.textContent ?? "").trim() !== "" || n.querySelectorAll("img").length !== 1) return null;
	let r = Array.from(t.querySelectorAll("img")).filter((t) => e.intersectsNode(t));
	return r.length === 1 ? r[0] : null;
}
function ue(e) {
	return {
		start: [e.startContainer, e.startOffset],
		end: [e.endContainer, e.endOffset]
	};
}
function k(e, t) {
	let [n, r] = e.start, [i, a] = e.end;
	if (!t.contains(n) || !t.contains(i)) return !1;
	let o = (e, t) => Math.min(t, e.nodeType === Node.TEXT_NODE ? e.length : e.childNodes.length);
	return document.getSelection()?.setBaseAndExtent(n, o(n, r), i, o(i, a)), !0;
}
function de(e, t) {
	let n = [];
	for (let r = e; r && r !== t; r = r.parentNode) {
		if (!r.parentNode) return null;
		n.unshift(Array.prototype.indexOf.call(r.parentNode.childNodes, r));
	}
	return n;
}
function A(e, t) {
	let n = t;
	for (let t of e) n = n?.childNodes[t] ?? null;
	return n;
}
// resources/js/core/insert.ts
function fe(e) {
	let t = document.createDocumentFragment(), n = e.replace(/\r\n?/g, "\n").split("\n");
	if (n.length === 1) return t.append(n[0]), t;
	for (let e of n) {
		if (e.trim() === "") continue;
		let n = document.createElement("p");
		n.textContent = e, t.append(n);
	}
	return t;
}
function pe(e, t, n) {
	be(n), t.deleteContents();
	let r = _e(t.startContainer, e, [
		"li",
		"pre",
		"td",
		"th"
	]);
	if (r) return me(t, he(n), r.localName === "pre");
	let i = Array.from(n.childNodes);
	if (!i.length) return t;
	if (!i.some(_)) {
		let e = i[i.length - 1];
		return t.insertNode(n), j(e);
	}
	let a = ve(t.startContainer, e);
	if (!a) {
		let e = i[i.length - 1];
		return t.insertNode(n), j(e);
	}
	let o = document.createRange();
	o.setStart(t.startContainer, t.startOffset), o.setEndAfter(a.lastChild ?? a), a.lastChild || o.setEnd(a, 0);
	let s = a.cloneNode(!1);
	s.append(o.extractContents());
	let c = [];
	for (; i.length && !_(i[0]);) c.push(i.shift());
	let l = [];
	for (; i.length && !_(i[i.length - 1]);) l.unshift(i.pop());
	a.append(...c), s.prepend(...l), a.after(...i, s);
	let u = l[l.length - 1] ?? i[i.length - 1] ?? c[c.length - 1] ?? a;
	v(a) && !a.querySelector("br") && a.remove();
	let d = j(u);
	return v(s) && !s.querySelector("br") && s.remove(), d;
}
function me(e, t, n) {
	if (n || !t.includes("\n")) {
		let n = document.createTextNode(t);
		return e.insertNode(n), E(n);
	}
	let r = document.createDocumentFragment();
	t.split("\n").forEach((e, t) => {
		t && r.append(document.createElement("br")), r.append(e);
	});
	let i = r.lastChild;
	return e.insertNode(r), E(i);
}
function he(e) {
	let t = [];
	for (let n of Array.from(e.childNodes)) t.push(g(n) ? n.data : n.textContent ?? "");
	return t.join(ge(e) ? "\n" : "");
}
var ge = (e) => Array.from(e.childNodes).some(_);
function _e(e, t, n) {
	for (let r = e; r && r !== t; r = r.parentNode) if (h(r) && n.includes(r.localName)) return r;
	return null;
}
function ve(e, t) {
	for (let n = e; n && n !== t; n = n.parentNode) if (n.parentNode === t) return h(n) && _(n) ? n : null;
	return null;
}
function ye(e) {
	let t = document.createRange(), n = e.lastChild;
	return n && g(n) ? t.setStart(n, n.length) : t.setStart(e, e.childNodes.length), t;
}
function be(e) {
	e.normalize();
	let t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
	for (let e = n.nextNode(); e; e = n.nextNode()) e.parentElement?.closest("pre") || t.push(e);
	let r = (t) => {
		for (let n = t.parentNode; n && n !== e; n = n.parentNode) if (_(n)) return n;
		return null;
	}, i = (e) => e === void 0 || /[\s\u00a0]/.test(e);
	t.forEach((e, n) => {
		if (!e.data.includes("\xA0")) return;
		let a = n > 0 && r(t[n - 1]) === r(e) ? t[n - 1].data.at(-1) : void 0, o = n < t.length - 1 && r(t[n + 1]) === r(e) ? t[n + 1].data[0] : void 0, s = [...e.data];
		s.forEach((e, t) => {
			if (e !== "\xA0") return;
			let n = t > 0 ? s[t - 1] : a, r = t < s.length - 1 ? s[t + 1] : o;
			!i(n) && !i(r) && (s[t] = " ");
		});
		let c = s.join("");
		c !== e.data && (e.data = c);
	});
}
function j(e) {
	if (g(e)) return E(e);
	if (h(e)) {
		let t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), n = null;
		for (let e = t.nextNode(); e; e = t.nextNode()) n = e;
		if (n) return E(n);
		if (_(e)) return ye(e);
	}
	return E(e);
}
// resources/js/core/commands.ts
var xe = [
	"undo",
	"redo",
	"bold",
	"italic",
	"strike",
	"paragraph",
	"h2",
	"h3",
	"quote",
	"ul",
	"ol",
	"link",
	"code",
	"image"
], Se = {
	undo: "Mod+Z",
	redo: "Mod+Shift+Z",
	bold: "Mod+B",
	italic: "Mod+I",
	link: "Mod+K"
}, M = (e, t, n) => {
	for (let r = e; r && r !== t; r = r.parentNode) if (h(r) && n.includes(r.localName)) return r;
	return null;
}, N = (e, t) => M(e.range.startContainer, e.content, t) !== null;
function P(e) {
	let t = e.range;
	if (t.collapsed) return t.startContainer;
	let n = t.commonAncestorContainer, r = document.createTreeWalker(n.nodeType === Node.TEXT_NODE ? n.parentNode : n, NodeFilter.SHOW_TEXT);
	for (let e = r.nextNode(); e; e = r.nextNode()) {
		if (!t.intersectsNode(e)) continue;
		let n = e === t.startContainer ? t.startOffset : 0;
		if ((e === t.endContainer ? t.endOffset : e.length) > n) return e;
	}
	return t.startContainer;
}
var Ce = (e, t) => M(P(e), e.content, t) !== null, F = (e, t) => document.execCommand(e, !1, t);
function I(e, t) {
	return {
		isActive: (t) => Ce(t, e),
		isEnabled: (e) => !N(e, ["pre"]),
		run: () => void F(t)
	};
}
function L(e) {
	let t = (t) => {
		for (let n = t; n && n !== e.content; n = n.parentNode) {
			let t = n.parentNode;
			if (h(n) && (t === e.content || h(t) && t.localName === "blockquote")) return n;
		}
		return null;
	}, n = t(e.range.startContainer), r = t(e.range.endContainer) ?? n;
	if (!n) return [];
	if (!r || n.parentNode !== r.parentNode) return [n];
	let i = [];
	for (let e = n; e && (i.push(e), e !== r); e = e.nextElementSibling);
	return i;
}
function R(e) {
	return {
		isActive: (t) => M(t.range.startContainer, t.content, [
			"p",
			"h2",
			"h3",
			"h4"
		])?.localName === e && !N(t, ["li"]),
		isEnabled: (e) => !N(e, ["li", "pre"]),
		run: (t) => void F("formatBlock", e !== "p" && R(e).isActive(t) ? "p" : e)
	};
}
var we = {
	isActive: (e) => N(e, ["blockquote"]),
	isEnabled: () => !0,
	run(e) {
		let t = new b(e.boundaries), n = M(e.range.startContainer, e.content, ["blockquote"]);
		if (n) {
			t.unwrap(n);
			return;
		}
		let r = (t) => {
			for (let n = t; n; n = n.parentNode) if (n.parentNode === e.content) return n;
			return null;
		}, i = r(e.range.startContainer), a = r(e.range.endContainer) ?? i;
		if (!i) return;
		let o = [];
		for (let e = i; e && (o.push(e), e !== a); e = e.nextSibling);
		t.wrap(o, "blockquote");
	}
};
function z(e) {
	let t = e === "ul" ? "ol" : "ul";
	return {
		isActive: (t) => M(t.range.startContainer, t.content, ["li"])?.parentElement?.localName === e,
		isEnabled: (e) => !N(e, ["pre"]),
		run(n) {
			let r = new b(n.boundaries), i = M(n.range.startContainer, n.content, ["li"]), a = i?.parentElement;
			if (i && a && a.localName === t) {
				r.rename(a, e);
				return;
			}
			if (i && a && a.localName === e) {
				Te(n, r, a, i);
				return;
			}
			let o = L(n).filter((e) => [
				"p",
				"h2",
				"h3",
				"h4"
			].includes(e.localName));
			if (!o.length) return;
			let s = o.map((e) => r.rename(e, "li")), c = r.wrap(s, e), l = c.previousElementSibling;
			l?.localName === e && (l.append(...Array.from(c.childNodes)), r.remove(c));
		}
	};
}
function Te(e, t, n, r) {
	let i = Array.from(n.children), a = M(e.range.endContainer, e.content, ["li"]), o = i.indexOf(r), s = a && a.parentElement === n ? i.indexOf(a) : o, c = i.slice(s + 1);
	if (c.length) {
		let e = n.ownerDocument.createElement(n.localName);
		n.after(e), e.append(...c);
	}
	let l = i.slice(o, s + 1).map((e) => t.rename(e, "p"));
	n.after(...l), n.children.length || t.remove(n);
}
var Ee = {
	isActive: (e) => N(e, ["pre"]),
	isEnabled: (e) => !N(e, ["li"]),
	run(e) {
		let t = e.content.ownerDocument, n = M(e.range.startContainer, e.content, ["pre"]);
		if (n) {
			let r = (n.textContent ?? "").replace(/\n$/, "").split("\n").map((e) => {
				let n = t.createElement("p");
				return e ? n.textContent = e : n.append(t.createElement("br")), n;
			});
			n.replaceWith(...r), B(e, r[r.length - 1]);
			return;
		}
		let r = L(e).filter((e) => ![
			"ul",
			"ol",
			"table",
			"hr",
			"blockquote"
		].includes(e.localName));
		if (!r.length) return;
		let i = r.map((e) => e.textContent ?? "").join("\n"), a = t.createElement("pre"), o = t.createElement("code");
		o.textContent = i, a.append(o), r[0].before(a);
		for (let e of r) e.remove();
		B(e, o);
	}
};
function B(e, t) {
	let n = t.lastChild, r = n && g(n) ? [n, n.length] : [t, t.childNodes.length];
	for (let t of e.boundaries) t[0] = r[0], t[1] = r[1];
}
var V = {
	bold: I(["strong", "b"], "bold"),
	italic: I(["em", "i"], "italic"),
	strike: I([
		"s",
		"strike",
		"del"
	], "strikeThrough"),
	paragraph: R("p"),
	h2: R("h2"),
	h3: R("h3"),
	quote: we,
	ul: z("ul"),
	ol: z("ol"),
	code: Ee
}, H = (e) => M(P(e), e.content, ["a"]);
function De(e, t, n) {
	let r = t.trim();
	if (!te(r)) return "refused";
	let i = "applied", a = H(e), o;
	if (a) a.setAttribute("href", r), o = [a];
	else if (e.range.collapsed) {
		let t = e.content.ownerDocument.createElement("a");
		t.setAttribute("href", r), t.textContent = r, e.range.insertNode(t), B(e, t), i = "caret-moved", o = [t];
	} else F("createLink", r), o = Array.from(e.content.querySelectorAll("a")).filter((e) => e.getAttribute("href") === r);
	for (let e of o) n ? e.setAttribute("target", "_blank") : e.removeAttribute("target");
	return i;
}
function Oe(e) {
	let t = H(e);
	t && new b(e.boundaries).unwrap(t);
}
// resources/js/core/icons.ts
var ke = {
	undo: [["path", { d: "M9 14 4 9l5-5" }], ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" }]],
	redo: [["path", { d: "m15 14 5-5-5-5" }], ["path", { d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" }]],
	bold: [["path", { d: "M6 12h9a4 4 0 010 8H7a1 1 0 01-1-1V5a1 1 0 011-1h7a4 4 0 010 8" }]],
	italic: [
		["line", {
			x1: "19",
			x2: "10",
			y1: "4",
			y2: "4"
		}],
		["line", {
			x1: "14",
			x2: "5",
			y1: "20",
			y2: "20"
		}],
		["line", {
			x1: "15",
			x2: "9",
			y1: "4",
			y2: "20"
		}]
	],
	strike: [
		["path", { d: "M16 4H9a3 3 0 0 0-2.83 4" }],
		["path", { d: "M14 12a4 4 0 0 1 0 8H6" }],
		["line", {
			x1: "4",
			x2: "20",
			y1: "12",
			y2: "12"
		}]
	],
	paragraph: [
		["path", { d: "M13 4v16" }],
		["path", { d: "M17 4v16" }],
		["path", { d: "M19 4H9.5a4.5 4.5 0 0 0 0 9H13" }]
	],
	h2: [
		["path", { d: "M4 12h8" }],
		["path", { d: "M4 18V6" }],
		["path", { d: "M12 18V6" }],
		["path", { d: "M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" }]
	],
	h3: [
		["path", { d: "M4 12h8" }],
		["path", { d: "M4 18V6" }],
		["path", { d: "M12 18V6" }],
		["path", { d: "M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" }],
		["path", { d: "M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" }]
	],
	quote: [
		["path", { d: "M17 5H3" }],
		["path", { d: "M21 12H8" }],
		["path", { d: "M21 19H8" }],
		["path", { d: "M3 12v7" }]
	],
	ul: [
		["path", { d: "M3 5h.01" }],
		["path", { d: "M3 12h.01" }],
		["path", { d: "M3 19h.01" }],
		["path", { d: "M8 5h13" }],
		["path", { d: "M8 12h13" }],
		["path", { d: "M8 19h13" }]
	],
	ol: [
		["path", { d: "M11 5h10" }],
		["path", { d: "M11 12h10" }],
		["path", { d: "M11 19h10" }],
		["path", { d: "M4 4h1v5" }],
		["path", { d: "M4 9h2" }],
		["path", { d: "M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" }]
	],
	link: [["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]],
	code: [
		["path", { d: "m18 16 4-4-4-4" }],
		["path", { d: "m6 8-4 4 4 4" }],
		["path", { d: "m14.5 4-5 16" }]
	],
	image: [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			ry: "2"
		}],
		["circle", {
			cx: "9",
			cy: "9",
			r: "2"
		}],
		["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
	]
}, U = /* @__PURE__ */ new Map(), W = "http://www.w3.org/2000/svg";
function Ae(e) {
	if (!e || typeof e != "object") throw TypeError("[OE-CFG-1004] defineOhashiEditorIcons expects an object.");
	for (let [t, n] of Object.entries(e)) {
		if (!(typeof n == "string" && /^\s*<svg[\s>]/i.test(n) || typeof Element < "u" && n instanceof Element)) throw TypeError(`[OE-CFG-1004] Icon "${t}" must be an SVG string or an element.`);
		U.set(t, n);
	}
}
function je(e) {
	let t = U.get(e);
	if (typeof t == "string") {
		let e = document.createElement("template");
		return e.innerHTML = t.trim(), e.content.firstElementChild;
	}
	if (t) return t.cloneNode(!0);
	let n = ke[e];
	if (!n) return null;
	let r = document.createElementNS(W, "svg");
	for (let [e, t] of Object.entries({
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "2",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		"aria-hidden": "true",
		focusable: "false"
	})) r.setAttribute(e, t);
	for (let [e, t] of n) {
		let n = document.createElementNS(W, e);
		for (let [e, r] of Object.entries(t)) n.setAttribute(e, String(r));
		r.append(n);
	}
	return r;
}
// resources/js/core/toolbar.ts
function Me(e) {
	let t = [];
	return {
		groups: e.split("|").map((e) => e.trim().split(/\s+/).filter((e) => e ? xe.includes(e) ? !0 : (t.push(e), !1) : !1)).filter((e) => e.length),
		unknown: t
	};
}
var Ne = () => typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
function Pe(e) {
	return Ne() ? e.replace("Mod+", "⌘").replace("Shift+", "⇧") : e.replace("Mod+", "Ctrl+");
}
var Fe = class {
	#e;
	#t = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.#e = e, e.addEventListener("mousedown", (e) => {
			e.target.closest("button") && e.preventDefault();
		}), e.addEventListener("click", (e) => {
			let n = e.target.closest("button");
			n?.dataset.tool && t(n.dataset.tool);
		}), e.addEventListener("keydown", (e) => this.#i(e));
	}
	get tools() {
		return Array.from(this.#t.keys());
	}
	render(e, t) {
		let n = this.#e.ownerDocument;
		this.#t.clear(), this.#e.replaceChildren(), this.#e.setAttribute("aria-label", t.toolbar);
		for (let r of e) {
			let e = n.createElement("div");
			e.className = "orte-toolbar-group", e.setAttribute("part", "group"), e.setAttribute("role", "group");
			for (let i of r) {
				let r = n.createElement("button");
				r.type = "button", r.className = `orte-btn orte-btn--${i}`, r.setAttribute("part", `btn btn-${i}`), r.dataset.tool = i;
				let a = Se[i], o = t[i];
				r.setAttribute("aria-label", o), r.title = a ? `${o} (${Pe(a)})` : o, r.dataset.label = o, r.dataset.title = r.title, r.tabIndex = -1;
				let s = n.createElement("span");
				s.className = "orte-icon", s.setAttribute("part", "icon");
				let c = n.createElement("slot");
				c.name = `icon-${i}`;
				let l = je(i);
				l && c.append(l), s.append(c), r.append(s), e.append(r), this.#t.set(i, r);
			}
			this.#e.append(e);
		}
		this.#r();
	}
	update(e) {
		for (let [t, n] of this.#t) {
			let r = e.get(t) ?? {
				active: !1,
				enabled: !0
			};
			n.disabled = !r.enabled, t !== "undo" && t !== "redo" && t !== "image" && n.setAttribute("aria-pressed", String(r.active)), n.setAttribute("part", `btn btn-${t}${r.active ? " btn-active" : ""}`), n.classList.toggle("is-active", r.active);
			let i = r.label ?? n.dataset.label ?? "";
			n.getAttribute("aria-label") !== i && (n.setAttribute("aria-label", i), n.title = r.label ?? n.dataset.title ?? "");
		}
		this.#n().some((e) => e.tabIndex === 0) || this.#r();
	}
	#n() {
		return Array.from(this.#t.values()).filter((e) => !e.disabled);
	}
	#r() {
		let e = Array.from(this.#t.values());
		e.forEach((e) => e.tabIndex = -1);
		let t = e.find((e) => !e.disabled);
		t && (t.tabIndex = 0);
	}
	#i(e) {
		let t = this.#n(), n = t.indexOf(e.target);
		if (n < 0) return;
		let r = {
			ArrowRight: n + 1,
			ArrowLeft: n - 1,
			Home: 0,
			End: t.length - 1
		}[e.key];
		if (r === void 0) return;
		e.preventDefault();
		let i = t[(r + t.length) % t.length];
		t.forEach((e) => e.tabIndex = -1), i.tabIndex = 0, i.focus();
	}
}, Ie = class {
	el;
	#e;
	#t;
	#n;
	#r;
	#i = {};
	constructor(e, t) {
		let n = e.createElement("div");
		n.className = "orte-popover orte-popover--link", n.setAttribute("part", "popover popover-link"), n.setAttribute("role", "dialog"), n.hidden = !0;
		let r = e.createElement("label");
		r.className = "orte-popover-label";
		let i = e.createElement("span");
		this.#i.url = i, this.#e = e.createElement("input"), this.#e.type = "url", this.#e.className = "orte-input orte-input--url", this.#e.setAttribute("part", "input input-link-url"), this.#e.placeholder = "https://", r.append(i, this.#e);
		let a = e.createElement("label");
		a.className = "orte-popover-check", this.#t = e.createElement("input"), this.#t.type = "checkbox", this.#t.setAttribute("part", "input-link-blank");
		let o = e.createElement("span");
		this.#i.newTab = o, a.append(this.#t, o), this.#n = e.createElement("p"), this.#n.className = "orte-popover-error", this.#n.id = "orte-link-error", this.#n.hidden = !0;
		let s = e.createElement("div");
		s.className = "orte-popover-actions";
		let c = (t, n) => {
			let r = e.createElement("button");
			return r.type = "button", r.className = "orte-btn orte-btn--text", r.setAttribute("part", n), this.#i[t] = r, s.append(r), r;
		}, l = c("apply", "btn btn-primary btn-link-apply");
		this.#r = c("remove", "btn btn-link-remove");
		let u = c("close", "btn btn-popover-close"), d = () => {
			let e = t.apply({
				url: this.#e.value,
				newTab: this.#t.checked
			});
			this.#n.hidden = e, this.#e.setAttribute("aria-invalid", String(!e)), e || this.#e.setAttribute("aria-describedby", this.#n.id);
		};
		l.addEventListener("click", d), this.#r.addEventListener("click", () => t.remove()), u.addEventListener("click", () => t.close()), n.addEventListener("keydown", (e) => {
			e.isComposing || (e.key === "Escape" ? (e.preventDefault(), t.close()) : e.key === "Enter" && e.target === this.#e && (e.preventDefault(), d()));
		}), n.append(r, a, this.#n, s), this.el = n;
	}
	localize(e) {
		this.el.setAttribute("aria-label", e["link.dialog"]), this.#i.url.textContent = e["link.url"], this.#i.newTab.textContent = e["link.newTab"], this.#i.apply.textContent = e["link.apply"], this.#i.remove.textContent = e["link.remove"], this.#i.close.textContent = e["link.close"], this.#n.textContent = e["link.invalid"];
	}
	open(e) {
		this.#e.value = e.url, this.#t.checked = e.newTab, this.#r.hidden = !e.existing, this.#n.hidden = !0, this.#e.removeAttribute("aria-invalid"), this.el.hidden = !1, this.#e.focus(), this.#e.select();
	}
	close() {
		this.el.hidden = !0;
	}
	get isOpen() {
		return !this.el.hidden;
	}
}, Le = [
	25,
	50,
	75,
	100
], Re = class {
	el;
	#e;
	#t;
	#n = /* @__PURE__ */ new Map();
	#r;
	#i = {};
	constructor(e, t) {
		let n = e.createElement("div");
		n.className = "orte-popover orte-popover--image", n.setAttribute("part", "popover popover-image"), n.setAttribute("role", "dialog"), n.hidden = !0, this.#r = e.createElement("div"), this.#r.className = "orte-popover-widths", this.#r.setAttribute("role", "group");
		for (let n of Le) {
			let r = e.createElement("button");
			r.type = "button", r.className = "orte-btn orte-btn--text", r.textContent = `${n}%`, r.setAttribute("part", "btn btn-image-width"), r.setAttribute("aria-pressed", "false"), r.addEventListener("click", () => t.width(n)), this.#n.set(n, r), this.#r.append(r);
		}
		let r = e.createElement("label");
		r.className = "orte-popover-label";
		let i = e.createElement("span");
		this.#i.alt = i, this.#e = e.createElement("input"), this.#e.type = "text", this.#e.className = "orte-input", this.#e.setAttribute("part", "input input-image-alt"), r.append(i, this.#e), this.#t = e.createElement("p"), this.#t.className = "orte-popover-hint", this.#t.id = "orte-image-alt-hint", this.#e.addEventListener("input", () => this.#a());
		let a = e.createElement("div");
		a.className = "orte-popover-actions";
		let o = (t, n) => {
			let r = e.createElement("button");
			return r.type = "button", r.className = "orte-btn orte-btn--text", r.setAttribute("part", n), this.#i[t] = r, a.append(r), r;
		}, s = o("apply", "btn btn-primary btn-image-apply"), c = o("close", "btn btn-popover-close");
		s.addEventListener("click", () => t.apply(this.#e.value)), c.addEventListener("click", () => t.close()), n.addEventListener("keydown", (e) => {
			e.isComposing || (e.key === "Escape" ? (e.preventDefault(), t.close()) : e.key === "Enter" && e.target === this.#e && (e.preventDefault(), t.apply(this.#e.value)));
		}), n.append(this.#r, r, this.#t, a), this.el = n;
	}
	localize(e) {
		this.el.setAttribute("aria-label", e["image.dialog"]), this.#r.setAttribute("aria-label", e["image.width"]), this.#i.alt.textContent = e["image.alt"], this.#e.placeholder = e["image.altHint"], this.#t.textContent = e["image.altMissing"], this.#i.apply.textContent = e["image.apply"], this.#i.close.textContent = e["image.close"];
	}
	open(e) {
		this.#e.value = e.alt, this.#a(), this.setWidth(e.width), this.el.hidden = !1, this.#e.focus(), this.#e.select();
	}
	setWidth(e) {
		for (let [t, n] of this.#n) {
			let r = e === `${t}%`;
			n.setAttribute("part", `btn btn-image-width${r ? " btn-active" : ""}`), n.setAttribute("aria-pressed", String(r)), n.classList.toggle("is-active", r);
		}
	}
	#a() {
		let e = this.#e.value.trim() === "";
		this.#t.hidden = !e, e ? this.#e.setAttribute("aria-describedby", this.#t.id) : this.#e.removeAttribute("aria-describedby");
	}
	close() {
		this.el.hidden = !0;
	}
	get isOpen() {
		return !this.el.hidden;
	}
}, ze = class {
	el;
	#e = /* @__PURE__ */ new Map();
	#t = "Dismiss";
	#n;
	constructor(e, t) {
		this.el = e.createElement("div"), this.el.className = "orte-notices", this.#n = t;
	}
	show(e, t, n, r) {
		let i = this.el.ownerDocument, a = i.createElement("div");
		a.className = `orte-notice orte-notice--${t}`, a.setAttribute("part", `notice notice-${t}`), a.setAttribute("role", t === "info" ? "status" : "alert");
		let o = i.createElement("span");
		if (o.className = "orte-notice-message", o.setAttribute("part", "notice-message"), o.textContent = n, a.append(o), r) {
			let e = i.createElement("code");
			e.className = "orte-notice-code", e.setAttribute("part", "notice-code"), e.textContent = r, a.append(" ", e);
		}
		if (t !== "info") {
			let t = i.createElement("button");
			t.type = "button", t.className = "orte-btn orte-btn--text orte-notice-close", t.setAttribute("part", "btn btn-notice-close"), t.setAttribute("aria-label", this.#t), t.textContent = "×", t.addEventListener("click", () => {
				this.remove(e), this.#n();
			}), a.append(t);
		}
		let s = this.#e.get(e);
		s ? s.replaceWith(a) : this.el.append(a), this.#e.set(e, a);
	}
	remove(e) {
		this.#e.get(e)?.remove(), this.#e.delete(e);
	}
	localize(e) {
		this.#t = e["notice.close"];
		for (let e of this.el.querySelectorAll("[part~=\"btn-notice-close\"]")) e.setAttribute("aria-label", this.#t);
	}
}, G = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp"
], K = class extends Error {
	code;
	params;
	cause;
	constructor(e, t = {}, n) {
		super(`[${e}] Image upload failed.`), this.code = e, this.params = t, this.cause = n, this.name = "UploadError";
	}
};
function q(e) {
	let t = (e) => String(Math.floor(e * 10) / 10);
	return e >= 1048576 ? `${t(e / 1048576)} MB` : e >= 1024 ? `${t(e / 1024)} KB` : `${e} B`;
}
function Be(e, t) {
	if (e.type && !G.includes(e.type)) throw new K("OE-UPL-4002");
	if (t !== null && e.size > t) throw new K("OE-UPL-4001", { max: q(t) });
}
function Ve(e) {
	return e.origin === location.origin;
}
function He() {
	let e = {}, t = document.cookie.split("; ").find((e) => e.startsWith("XSRF-TOKEN="));
	if (t) try {
		e["X-XSRF-TOKEN"] = decodeURIComponent(t.slice(11));
	} catch {}
	let n = document.querySelector("meta[name=\"csrf-token\"]")?.content;
	return n && (e["X-CSRF-TOKEN"] = n), e;
}
function Ue(e) {
	if (typeof e != "string" || e.trim() === "") return !1;
	let t = /^([a-z][a-z0-9+.-]*):/i.exec(e.replace(/[\u0000- \u007f-\u009f]/g, ""));
	return !t || ["http", "https"].includes(t[1].toLowerCase());
}
async function We(e) {
	try {
		let t = await e.json();
		return t && typeof t == "object" ? t : null;
	} catch {
		return null;
	}
}
function Ge(e, t) {
	return e === 413 ? new K("OE-UPL-4001", t === null ? {} : { max: q(t) }) : e === 401 || e === 403 || e === 419 ? new K("OE-UPL-4004") : e === 429 ? new K("OE-UPL-4007") : e >= 500 ? new K("OE-UPL-4005") : new K("OE-UPL-4900");
}
async function Ke(e, t, n = {}) {
	let r = n.maxBytes ?? null;
	Be(t, r);
	let i = new URL(e, document.baseURI), a = new FormData();
	a.append("image", t, t.name || "image");
	let o = {
		Accept: "application/json",
		"X-Requested-With": "XMLHttpRequest"
	};
	Ve(i) && Object.assign(o, He());
	let s;
	try {
		s = await fetch(i, {
			method: "POST",
			body: a,
			headers: o,
			credentials: "same-origin",
			signal: n.signal
		});
	} catch (e) {
		throw e?.name === "AbortError" ? e : new K("OE-UPL-4003", {}, e);
	}
	if (s.status === 200 || s.status === 201) {
		let e = await We(s);
		if (e && Ue(e.url)) return e.url;
		throw new K("OE-UPL-4900", {}, s);
	}
	if (s.status === 422) {
		let e = await We(s), t = typeof e?.code == "string" && /^OE-UPL-\d{4}$/.test(e.code) ? e.code : "OE-UPL-4900", n = {};
		if (e?.params && typeof e.params == "object") for (let [t, r] of Object.entries(e.params)) (typeof r == "string" || typeof r == "number") && (n[t] = r);
		throw new K(t, n, s);
	}
	let c = Ge(s.status, r);
	throw new K(c.code, c.params, s);
}
// resources/js/core/i18n.ts
var J = {
	editor: "Rich text editor",
	toolbar: "Formatting",
	undo: "Undo",
	redo: "Redo",
	bold: "Bold",
	italic: "Italic",
	strike: "Strikethrough",
	paragraph: "Paragraph",
	h2: "Heading 2",
	h3: "Heading 3",
	quote: "Quote",
	ul: "Bulleted list",
	ol: "Numbered list",
	link: "Link",
	code: "Code block",
	image: "Image",
	"link.dialog": "Link",
	"link.url": "URL",
	"link.newTab": "Open in a new tab",
	"link.apply": "Apply",
	"link.remove": "Remove link",
	"link.close": "Close",
	"link.invalid": "Enter a URL starting with https://, http://, mailto: or tel:, or a path such as /page.",
	"image.dialog": "Image",
	"image.edit": "Edit image",
	"image.width": "Width",
	"image.alt": "Alternative text",
	"image.altHint": "Describe the image for people who cannot see it",
	"image.altMissing": "No alternative text yet. Describe the image — leave it empty only if the image is purely decorative.",
	"image.apply": "Apply",
	"image.close": "Close",
	"image.uploading": "Uploading image…",
	"notice.close": "Dismiss",
	"errors.OE-UPL-4001": "The image is too large. Choose an image of {max} or smaller.",
	"errors.OE-UPL-4001.short": "The image is too large. Choose a smaller image.",
	"errors.OE-UPL-4002": "This file type can't be uploaded. Choose a PNG, JPEG, GIF or WebP image.",
	"errors.OE-UPL-4003": "The image couldn't be uploaded. Check your connection and try again.",
	"errors.OE-UPL-4004": "Your session may have expired. Copy your text somewhere safe, then reload the page and try again.",
	"errors.OE-UPL-4005": "The server couldn't save the image. Please try again later.",
	"errors.OE-UPL-4006": "The image has too many pixels. Choose an image of at most {max} megapixels.",
	"errors.OE-UPL-4007": "Too many images were uploaded in a short time. Wait a minute and try again.",
	"errors.OE-UPL-4900": "The image couldn't be uploaded.",
	"errors.OE-CORE-9001": "Something went wrong in the editor. Copy your text somewhere safe before reloading the page."
}, Y = /* @__PURE__ */ new Map([["en", J], ["ja", {
	editor: "リッチテキストエディタ",
	toolbar: "書式",
	undo: "元に戻す",
	redo: "やり直す",
	bold: "太字",
	italic: "斜体",
	strike: "打ち消し線",
	paragraph: "段落",
	h2: "見出し 2",
	h3: "見出し 3",
	quote: "引用",
	ul: "箇条書き",
	ol: "番号付きリスト",
	link: "リンク",
	code: "コードブロック",
	image: "画像",
	"link.dialog": "リンク",
	"link.url": "URL",
	"link.newTab": "新しいタブで開く",
	"link.apply": "適用",
	"link.remove": "リンクを解除",
	"link.close": "閉じる",
	"link.invalid": "https://・http://・mailto:・tel: で始まる URL か、/page のようなパスを入力してください。",
	"image.dialog": "画像",
	"image.edit": "画像を編集",
	"image.width": "幅",
	"image.alt": "代替テキスト",
	"image.altHint": "画像が見えない人のために、画像の内容を説明します",
	"image.altMissing": "代替テキストがまだありません。画像の内容を説明してください（飾りだけの画像なら空のままで構いません）。",
	"image.apply": "適用",
	"image.close": "閉じる",
	"image.uploading": "画像をアップロードしています…",
	"notice.close": "閉じる",
	"errors.OE-UPL-4001": "画像のサイズが大きすぎます。{max} 以下の画像を選んでください。",
	"errors.OE-UPL-4001.short": "画像のサイズが大きすぎます。もっと小さい画像を選んでください。",
	"errors.OE-UPL-4002": "この形式のファイルはアップロードできません。PNG・JPEG・GIF・WebP の画像を選んでください。",
	"errors.OE-UPL-4003": "画像をアップロードできませんでした。通信状況を確認して、もう一度お試しください。",
	"errors.OE-UPL-4004": "セッションの有効期限が切れた可能性があります。入力した内容をコピーしてから、ページを再読み込みしてもう一度お試しください。",
	"errors.OE-UPL-4005": "サーバーで画像を保存できませんでした。時間をおいて、もう一度お試しください。",
	"errors.OE-UPL-4006": "画像の画素数が多すぎます。{max} メガピクセル以下の画像を選んでください。",
	"errors.OE-UPL-4007": "短い時間に多くの画像がアップロードされました。1 分ほど待ってから、もう一度お試しください。",
	"errors.OE-UPL-4900": "画像をアップロードできませんでした。",
	"errors.OE-CORE-9001": "エディタで予期しないエラーが発生しました。ページを再読み込みする前に、入力した内容をコピーしてください。"
}]]);
function qe(e, t) {
	if (typeof e != "string" || !/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(e)) throw TypeError(`[OE-CFG-1005] Invalid locale code: ${String(e)}`);
	if (!t || typeof t != "object" || Object.values(t).some((e) => typeof e != "string")) throw TypeError(`[OE-CFG-1005] Locale "${e}" must map message keys to strings.`);
	let n = e.toLowerCase();
	Y.set(n, {
		...Y.get(n) ?? {},
		...t
	});
}
function Je(e, t, n = {}) {
	let r = e, i = `errors.${t}`, a = r[i] ?? (t.startsWith("OE-CORE-") ? r["errors.OE-CORE-9001"] : r["errors.OE-UPL-4900"]);
	return ((e) => Array.from(e.matchAll(/\{(\w+)\}/g)).some((e) => n[e[1]] === void 0))(a) && r[`${i}.short`] && (a = r[`${i}.short`]), a.replace(/\{(\w+)\}/g, (e, t) => n[t] === void 0 ? e : String(n[t]));
}
function Ye(e) {
	if (!e) return {
		messages: J,
		supported: !0
	};
	let t = e.toLowerCase(), n = Y.get(t) ?? Y.get(t.split("-")[0]);
	return {
		messages: {
			...J,
			...n ?? {}
		},
		supported: n !== void 0
	};
}
// resources/js/core/OhashiEditorElement.ts
var Xe = /* @__PURE__ */ new Set([
	"quote",
	"ul",
	"ol",
	"code"
]), Ze = 400, Qe = "ohashi-rich-text-editor", $e = typeof Event > "u" ? class {} : Event, et = class extends $e {
	detail;
	constructor(e) {
		super("change", {
			bubbles: !0,
			composed: !0
		}), this.detail = { html: e };
	}
};
function tt(e) {
	return typeof e.detail?.html == "string";
}
var X;
function nt(t) {
	if (X === void 0) try {
		X = "adoptedStyleSheets" in t ? new CSSStyleSheet() : null, X?.replaceSync(e);
	} catch {
		X = null;
	}
	if (X) t.adoptedStyleSheets = [X];
	else {
		let n = document.createElement("style");
		n.textContent = e, t.prepend(n);
	}
}
var rt = typeof HTMLElement > "u" ? class {} : HTMLElement, it = class extends rt {
	static formAssociated = !0;
	static get observedAttributes() {
		return [
			"value",
			"name",
			"label",
			"toolbar",
			"locale",
			"upload-url"
		];
	}
	#e;
	#t;
	#n;
	#r = new oe();
	#i = null;
	#a = null;
	#o = !1;
	#s = null;
	#c = !1;
	#l;
	#u;
	#d;
	#f;
	#p;
	#m = null;
	#h = 0;
	#g = Ye(null).messages;
	#_ = null;
	#v = !1;
	#y = "";
	#b = /* @__PURE__ */ new Set();
	constructor() {
		super(), this.#e = typeof this.attachInternals == "function" ? this.attachInternals() : null;
		let e = this.attachShadow({ mode: "open" });
		this.#t = e;
		let t = document.createElement("div");
		t.className = "orte-container", t.setAttribute("part", "container");
		let n = document.createElement("div");
		n.className = "orte-toolbar", n.setAttribute("part", "toolbar"), n.setAttribute("role", "toolbar"), this.#n = document.createElement("div"), this.#n.className = "orte-content", this.#n.setAttribute("part", "content"), this.#n.contentEditable = "true", this.#n.setAttribute("role", "textbox"), this.#n.setAttribute("aria-multiline", "true"), this.#ie(), this.#l = new Fe(n, (e) => this.#te(() => this.#E(e))), this.#u = new Ie(document, {
			apply: (e) => this.#O(e.url, e.newTab),
			remove: () => this.#te(() => this.#k()),
			close: () => this.#A()
		}), this.#d = new Re(document, {
			width: (e) => this.#te(() => this.#z(e)),
			apply: (e) => this.#te(() => this.#B(e)),
			close: () => this.#te(() => this.#V())
		}), this.#f = new ze(document, () => this.#T(this.#_)), this.#p = document.createElement("input"), this.#p.type = "file", this.#p.accept = G.join(","), this.#p.multiple = !0, this.#p.hidden = !0, this.#p.tabIndex = -1, this.#p.addEventListener("change", () => this.#te(() => {
			let e = Array.from(this.#p.files ?? []);
			this.#p.value = "", e.length && this.#M(e, this.#_);
		})), t.append(n, this.#f.el, this.#u.el, this.#d.el, this.#n), e.append(t, this.#p), nt(e), this.#x(), this.#r.reset(this.#J());
	}
	get value() {
		return v(this.#n) ? "" : at(this.#n.innerHTML);
	}
	set value(e) {
		let t = document.createElement("div");
		t.append(m(e == null ? "" : String(e))), x(t);
		let n = this.#n.innerHTML, r = t.innerHTML;
		r === n || r === at(n) || v(t) && v(this.#n) || (this.#n.replaceChildren(...Array.from(t.childNodes)), this.#_ = null, this.#V(!1), this.#q(), this.#r.reset(this.#J()), this.#y = this.#n.innerHTML, this.#oe());
	}
	get name() {
		return this.getAttribute("name") ?? "";
	}
	set name(e) {
		this.setAttribute("name", e);
	}
	undo() {
		this.#K();
		let e = this.#r.undo();
		return e ? (this.#Y(e), !0) : !1;
	}
	redo() {
		this.#K();
		let e = this.#r.redo();
		return e ? (this.#Y(e), !0) : !1;
	}
	connectedCallback() {
		let e = this.#ae("value");
		this.#ae("name"), e === void 0 ? this.hasAttribute("value") && (this.value = this.getAttribute("value")) : this.value = e, !this.#e && !this.#a && (this.#a = document.createElement("input"), this.#a.type = "hidden", this.appendChild(this.#a)), this.#oe(), this.#i = new AbortController();
		let t = (e, t) => this.#n.addEventListener(e, (e) => this.#te(() => t(e)), { signal: this.#i.signal });
		t("compositionstart", () => {
			this.#o = !0;
		}), t("compositionend", () => {
			this.#o = !1, this.#G("debounce");
		}), t("input", (e) => {
			e.stopPropagation();
			let t = e.inputType;
			t === "historyUndo" || t === "historyRedo" ? (this.#n.replaceChildren(m(this.#y)), t === "historyUndo" ? this.undo() : this.redo()) : this.#o || e.isComposing ? (this.#oe(), this.#re()) : this.#G("debounce");
		}), t("keydown", (e) => this.#X(e)), t("beforeinput", (e) => this.#W(e)), document.addEventListener("selectionchange", () => this.#te(() => this.#H()), { signal: this.#i.signal }), this.#x(), t("paste", (e) => this.#Z(e)), t("dragstart", () => {
			this.#c = !0;
		}), t("dragend", () => {
			this.#c = !1;
		}), t("drop", (e) => this.#Q(e)), t("click", (e) => this.#I(e));
	}
	disconnectedCallback() {
		this.#K(), this.#i?.abort(), this.#i = null;
	}
	attributeChangedCallback(e, t, n) {
		e === "value" && this.isConnected ? this.value = n : e === "name" ? this.#oe() : e === "label" ? this.#ie() : (e === "toolbar" || e === "locale" || e === "upload-url") && this.#x();
	}
	#x() {
		let { messages: e, supported: t } = Ye(this.getAttribute("locale"));
		t || this.#S(`locale:${this.getAttribute("locale")}`, `[OE-CFG-1002] Unsupported locale "${this.getAttribute("locale")}"; using English.`), this.#g = e;
		let n = this.getAttribute("toolbar"), { groups: r, unknown: i } = Me(n ?? "undo redo | bold italic strike | paragraph h2 h3 quote | ul ol | link code image");
		for (let e of i) this.#S(`tool:${e}`, `[OE-CFG-1001] Unknown toolbar item "${e}".`);
		let a = !!this.getAttribute("upload-url");
		n !== null && /(^|\s|\|)image(\s|\||$)/.test(n) && !a && this.#S("image", "[OE-CFG-1003] \"image\" is in the toolbar but no upload-url is set; the button is hidden.");
		let o = a ? r : r.map((e) => e.filter((e) => e !== "image")).filter((e) => e.length);
		this.#l.render(o, e), this.#C("image") || this.#V(!1), this.#u.localize(e), this.#d.localize(e), this.#f.localize(e), this.#ie(), this.#U();
	}
	#S(e, t) {
		this.#b.has(e) || (this.#b.add(e), console.warn(t));
	}
	#C(e) {
		return this.#l.tools.includes(e);
	}
	#w() {
		let e = C(this.#t, this.#n) ?? this.#_;
		if (!e || !this.#n.contains(e.startContainer)) return null;
		let t = le(e, this.#n), n = [[t.startContainer, t.startOffset], [t.endContainer, t.endOffset]];
		return {
			content: this.#n,
			range: t,
			boundaries: n
		};
	}
	#T(e) {
		this.#t.activeElement !== this.#n && this.#n.focus({ preventScroll: !0 }), e && this.#n.contains(e.startContainer) && w(e);
	}
	#E(e) {
		if (!this.#C(e)) return;
		if (e === "undo") return void this.undo();
		if (e === "redo") return void this.redo();
		if (e === "link") return this.#D();
		if (e === "image") return this.#j();
		let t = this.#w();
		if (!t) return;
		let n = V[e];
		if (n.isEnabled(t)) {
			if (this.#T(t.range), this.#K(), n.run(t), Xe.has(e)) {
				let [e, n] = t.boundaries;
				k({
					start: e,
					end: n
				}, this.#n);
			}
			this.#G("now");
		}
	}
	#D() {
		let e = this.#w();
		if (!e || ot(e)) return;
		this.#_ = e.range.cloneRange(), this.#V(!1);
		let t = H(e);
		this.#u.open({
			url: t?.getAttribute("href") ?? "",
			newTab: t?.getAttribute("target") === "_blank",
			existing: !!t
		});
	}
	#O(e, t) {
		let n = !1;
		return this.#te(() => {
			let r = this.#_;
			this.#T(r);
			let i = this.#w();
			if (!i) return;
			this.#K();
			let a = De(i, e, t);
			if (n = a !== "refused", !n) {
				this.#u.el.querySelector("input")?.focus();
				return;
			}
			let [o, s] = i.boundaries;
			a === "caret-moved" && k({
				start: o,
				end: s
			}, this.#n), this.#u.close(), this.#G("now");
		}), n;
	}
	#k() {
		this.#T(this.#_);
		let e = this.#w();
		if (e) {
			this.#K(), Oe(e);
			let [t, n] = e.boundaries;
			k({
				start: t,
				end: n
			}, this.#n), this.#G("now");
		}
		this.#u.close();
	}
	#A() {
		this.#u.close(), this.#T(this.#_);
	}
	#j() {
		let e = this.#w(), t = e && O(e.range, this.#n);
		if (t) return this.#L(t);
		e && (this.#_ = e.range.cloneRange()), this.#p.click();
	}
	async #M(e, t) {
		let n = this.getAttribute("upload-url");
		if (!n) return;
		let r = Number(this.getAttribute("upload-max-size")), i = Number.isFinite(r) && r > 0 ? r : null, a = this.#i?.signal, o = t ? t.cloneRange() : null;
		for (let t of e) {
			if (a?.aborted) return;
			this.#N();
			try {
				let e = await Ke(n, t, {
					maxBytes: i,
					signal: a
				});
				this.#te(() => {
					o = this.#F(e, o);
				});
			} catch (e) {
				if (a?.aborted) return;
				this.#te(() => {
					e instanceof K ? this.#ne(e.code, e.params, e.cause ?? e) : this.#ne("OE-UPL-4900", {}, e);
				});
			} finally {
				this.#P();
			}
		}
	}
	#N() {
		this.#h++ === 0 && (this.#f.show("uploading", "info", this.#g["image.uploading"]), this.#n.setAttribute("aria-busy", "true"));
	}
	#P() {
		--this.#h === 0 && (this.#f.remove("uploading"), this.#n.removeAttribute("aria-busy"));
	}
	#F(e, t) {
		let n = document.createElement("img");
		n.setAttribute("src", e), n.setAttribute("alt", "");
		let r;
		t instanceof HTMLImageElement && this.#n.contains(t) ? r = E(t) : t instanceof Range && this.#n.contains(t.startContainer) ? (r = t.cloneRange(), r.collapse(!1)) : (r = document.createRange(), r.selectNodeContents(this.#n), r.collapse(!1)), this.#K();
		let i = Z(r.startContainer, this.#n);
		if (i) {
			let e = document.createElement("p");
			e.append(n), i.after(e);
		} else r.insertNode(n);
		return this.#t.activeElement === this.#n && w(E(n)), this.#G("now"), n;
	}
	#I(e) {
		let t = e.target;
		t && t.localName === "img" && this.#C("image") && this.#L(t);
	}
	#L(e) {
		this.#m = e, this.#u.close(), this.#d.open({
			width: e.getAttribute("width"),
			alt: e.getAttribute("alt") ?? ""
		});
	}
	#R() {
		let e = this.#m;
		return e && this.#n.contains(e) ? e : (this.#V(!1), null);
	}
	#z(e) {
		let t = this.#R();
		t && (this.#K(), t.setAttribute("width", `${e}%`), this.#d.setWidth(t.getAttribute("width")), this.#G("now"));
	}
	#B(e) {
		let t = this.#R();
		t && (this.#K(), t.setAttribute("alt", e.trim()), this.#G("now"), this.#V());
	}
	#V(e = !0) {
		if (!this.#d.isOpen) return;
		let t = this.#m;
		this.#d.close(), this.#m = null, e && t && this.#n.contains(t) && (this.#n.focus({ preventScroll: !0 }), w(E(t)));
	}
	#H() {
		let e = C(this.#t, this.#n);
		e && (this.#_ = e), this.#U();
	}
	#U() {
		if (this.#v) return;
		this.#v = !0;
		let e = () => {
			this.#v = !1;
			let e = this.#w(), t = /* @__PURE__ */ new Map(), n = se();
			for (let r of this.#l.tools) if (!n && r !== "undo" && r !== "redo") t.set(r, {
				active: !1,
				enabled: !1
			});
			else if (r === "undo") t.set(r, {
				active: !1,
				enabled: this.#r.canUndo || this.#s !== null
			});
			else if (r === "redo") t.set(r, {
				active: !1,
				enabled: this.#r.canRedo
			});
			else if (r === "link") t.set(r, {
				active: !!e && !!H(e),
				enabled: !e || !ot(e)
			});
			else if (r === "image") {
				let n = !!e && !!O(e.range, this.#n);
				t.set(r, {
					active: !1,
					enabled: !0,
					label: n ? this.#g["image.edit"] : void 0
				});
			} else {
				let n = V[r];
				t.set(r, {
					active: !!e && n.isActive(e),
					enabled: !e || n.isEnabled(e)
				});
			}
			this.#l.update(t);
		};
		typeof requestAnimationFrame == "function" ? requestAnimationFrame(() => this.#te(e)) : this.#te(e);
	}
	#W(e) {
		if (e.inputType === "historyUndo" || e.inputType === "historyRedo") {
			e.preventDefault(), e.inputType === "historyUndo" ? this.undo() : this.redo();
			return;
		}
		let t = {
			formatBold: "bold",
			formatItalic: "italic",
			formatStrikeThrough: "strike",
			formatUnderline: null
		};
		if (e.inputType in t) {
			let n = t[e.inputType];
			n && this.#C(n) || e.preventDefault();
		} else if ((e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") && !e.isComposing) {
			let t = C(this.#t, this.#n), n = e.inputType === "insertParagraph" && t?.collapsed ? dt(t, this.#n) : null;
			if (n) {
				e.preventDefault(), this.#K(), ft(n), this.#G("now");
				return;
			}
			let r = t && Z(t.startContainer, this.#n);
			t && r && (e.preventDefault(), e.inputType === "insertParagraph" && t.collapsed && ct(t, r) ? (this.#K(), pt(r), this.#G("now")) : (mt(t, r), this.#G("debounce")));
		}
	}
	#G(e) {
		let t = C(this.#t, this.#n), n = t ? ue(t) : null;
		x(this.#n, { boundaries: n ? [n.start, n.end] : [] }) && n && k(n, this.#n), e === "now" ? (this.#q(), this.#r.record(this.#J())) : (this.#q(), this.#s = setTimeout(() => this.#K(), Ze)), this.#y = this.#n.innerHTML, this.#oe(), this.#re(), this.#U();
	}
	#K() {
		this.#s !== null && (this.#q(), this.#r.record(this.#J()), this.#U());
	}
	#q() {
		this.#s !== null && clearTimeout(this.#s), this.#s = null;
	}
	#J() {
		let e = this.isConnected ? C(this.#t, this.#n) : null, t = (e, t) => {
			let n = de(e, this.#n);
			return n ? [n, t] : null;
		}, n = e && t(e.startContainer, e.startOffset), r = e && t(e.endContainer, e.endOffset);
		return {
			html: this.#n.innerHTML,
			selection: n && r ? {
				start: n,
				end: r
			} : null
		};
	}
	#Y(e) {
		this.#n.replaceChildren(m(e.html)), this.#V(!1);
		let t = e.selection && A(e.selection.start[0], this.#n), n = e.selection && A(e.selection.end[0], this.#n);
		e.selection && t && n ? k({
			start: [t, e.selection.start[1]],
			end: [n, e.selection.end[1]]
		}, this.#n) : this.#t.activeElement === this.#n && this.#n.lastChild && w(D(this.#n.lastChild, "end")), this.#_ = C(this.#t, this.#n), this.#y = this.#n.innerHTML, this.#oe(), this.#re(), this.#U();
	}
	#X(e) {
		if (this.#o || e.isComposing || e.keyCode === 229) return;
		if ((e.key === "ArrowDown" || e.key === "ArrowRight") && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
			let t = C(this.#t, this.#n), n = this.#n.lastElementChild;
			if (t?.collapsed && n && n.localName !== "p" && n.contains(t.startContainer) && ut(t, n)) {
				e.preventDefault(), this.#K();
				let t = document.createElement("p");
				t.append(document.createElement("br")), n.after(t), w(T(t, 0)), this.#G("now");
			}
			return;
		}
		if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && this.#C("image")) {
			let t = this.#w(), n = t && O(t.range, this.#n);
			n && (e.preventDefault(), this.#L(n));
			return;
		}
		if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
		let t = e.key.toLowerCase(), n = (t) => {
			e.preventDefault(), this.#C(t) && this.#E(t);
		};
		t === "z" && !e.shiftKey ? n("undo") : t === "z" && e.shiftKey || t === "y" && e.ctrlKey && !e.metaKey ? n("redo") : t === "b" && !e.shiftKey ? n("bold") : t === "i" && !e.shiftKey ? n("italic") : t === "k" && !e.shiftKey ? n("link") : t === "u" && !e.shiftKey && e.preventDefault();
	}
	#Z(e) {
		let t = e.clipboardData;
		if (!t) return;
		e.preventDefault();
		let n = C(this.#t, this.#n);
		n && (t.files.length && !t.types.includes("text/html") ? this.#C("image") && this.#M(Array.from(t.files), n) : this.#$(n, t));
	}
	#Q(e) {
		if (this.#c) return;
		let t = e.dataTransfer;
		if (e.preventDefault(), !t) return;
		let n = this.#ee(e.clientX, e.clientY) ?? C(this.#t, this.#n);
		t.files.length && !t.types.includes("text/html") ? this.#C("image") && this.#M(Array.from(t.files), n) : n && this.#$(n, t);
	}
	#$(e, t) {
		let n = t.getData("text/html"), r = n ? m(n) : fe(t.getData("text/plain"));
		r.childNodes.length && (this.#K(), w(pe(this.#n, e, r)), this.#G("now"));
	}
	#ee(e, t) {
		let n = document;
		if (typeof n.caretPositionFromPoint == "function") {
			let r = n.caretPositionFromPoint(e, t, { shadowRoots: [this.#t] });
			if (r && this.#n.contains(r.offsetNode)) return T(r.offsetNode, r.offset);
		}
		if (typeof document.caretRangeFromPoint == "function") {
			let n = document.caretRangeFromPoint(e, t);
			if (n && this.#n.contains(n.startContainer)) return n;
		}
		return null;
	}
	#te(e) {
		try {
			e();
		} catch (e) {
			console.error("[OE-CORE-9001] Unexpected error in the editor.", e);
			try {
				this.#ne("OE-CORE-9001", {}, e);
			} catch {}
		}
	}
	#ne(e, t, n) {
		let r = Je(this.#g, e, t);
		this.dispatchEvent(new CustomEvent("ohashi-error", {
			detail: {
				code: e,
				message: r,
				params: t,
				cause: n
			},
			bubbles: !0,
			composed: !0,
			cancelable: !0
		})) && this.#f.show(e, "error", r, e);
	}
	#re() {
		this.dispatchEvent(new Event("input", {
			bubbles: !0,
			composed: !0
		})), this.dispatchEvent(new et(this.value));
	}
	#ie() {
		this.#n.setAttribute("aria-label", this.getAttribute("label") || this.#g.editor);
	}
	#ae(e) {
		if (!Object.prototype.hasOwnProperty.call(this, e)) return;
		let t = this[e];
		return delete this[e], e === "name" && t != null && (this.name = String(t)), t;
	}
	#oe() {
		this.#e ? this.#e.setFormValue(this.value) : this.#a && (this.#a.name = this.name, this.#a.value = this.value);
	}
};
function at(e) {
	return e.replace(/\n((?:<\/code>)?<\/pre>)/g, "$1").replace(/(?:<p>(?:<br>)?<\/p>)+$/, "");
}
function Z(e, t) {
	for (let n = e; n && n !== t; n = n.parentNode) if (n.nodeType === Node.ELEMENT_NODE && n.localName === "pre") return n;
	return null;
}
var ot = (e) => Z(e.range.startContainer, e.content) !== null;
function st(e, t) {
	let n = document.createRange();
	return n.setStart(e.startContainer, e.startOffset), n.setEnd(t, t.childNodes.length), n.toString();
}
function ct(e, t) {
	let n = document.createRange();
	return n.setStart(t, 0), n.setEnd(e.startContainer, e.startOffset), st(e, t).replace(/\n/g, "") === "" && n.toString().endsWith("\n");
}
var lt = /* @__PURE__ */ new Set([
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"li",
	"pre",
	"blockquote",
	"td",
	"th",
	"div"
]);
function Q(e, t) {
	for (let n = e; n && n !== t; n = n.parentNode) if (n.nodeType === Node.ELEMENT_NODE && lt.has(n.localName)) return n;
	return t;
}
function ut(e, t) {
	let n = document.createRange();
	if (n.setStart(e.startContainer, e.startOffset), n.setEnd(t, t.childNodes.length), t.localName === "pre") return n.toString().replace(/\n/g, "") === "";
	if (n.toString() !== "" || n.cloneContents().querySelector("img")) return !1;
	let r = D(t, "end");
	return Q(e.startContainer, t) === Q(r.startContainer, t);
}
function dt(e, t) {
	let n = Array.from(t.children).find((t) => t.localName === "blockquote" && t.contains(e.startContainer));
	if (!n) return null;
	let r = Q(e.startContainer, n);
	return r.localName !== "p" || r.parentNode !== n || r !== n.lastElementChild || r.textContent !== "" || r.querySelector("img") ? null : r;
}
function ft(e) {
	let t = e.parentNode, n = document.createElement("p");
	n.append(document.createElement("br")), t.children.length === 1 ? t.replaceWith(n) : (e.remove(), t.after(n)), w(T(n, 0));
}
function pt(e) {
	let t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), n = [];
	for (let e = t.nextNode(); e; e = t.nextNode()) n.push(e);
	for (let e = n.length - 1; e >= 0; e--) {
		let t = n[e];
		if (t.data = t.data.replace(/\n+$/, ""), t.data !== "") break;
		t.remove();
	}
	let r = document.createElement("p");
	r.append(document.createElement("br")), e.after(r), w(T(r, 0));
}
function mt(e, t) {
	e.deleteContents();
	let n = document.createTextNode("\n");
	e.insertNode(n);
	let r = document.createRange();
	r.setStartAfter(n), r.setEndAfter(t.lastChild ?? t), /\S|\n/.test(r.toString()) || n.after(document.createTextNode("\n"));
	let i = document.createRange();
	i.setStartAfter(n), w(i);
}
// resources/js/index.ts
function $() {
	typeof customElements < "u" && (customElements.get("ohashi-rich-text-editor") || customElements.define(Qe, it));
}
$();
export { et as OhashiEditorChangeEvent, it as OhashiEditorElement, Qe as TAG_NAME, $ as defineOhashiEditor, Ae as defineOhashiEditorIcons, qe as defineOhashiEditorLocale, tt as isOhashiEditorChange };
