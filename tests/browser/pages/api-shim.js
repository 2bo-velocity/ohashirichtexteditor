// Loaded before the editor by toolbar.html. ?api=old imitates Safari 17/18,
// whose getComposedRanges takes ShadowRoots as arguments and throws a
// TypeError for the dictionary; ?api=none removes it (Firefox < 142).
const api = new URLSearchParams(location.search).get('api');
const real = Selection.prototype.getComposedRanges;
if (api === 'old' && real) {
  Selection.prototype.getComposedRanges = function (...roots) {
    if (roots.some((r) => !(r instanceof ShadowRoot))) throw new TypeError("Argument 1 ('shadowRoots') must be an instance of ShadowRoot");
    return real.call(this, { shadowRoots: roots });
  };
} else if (api === 'none') {
  delete Selection.prototype.getComposedRanges;
}
