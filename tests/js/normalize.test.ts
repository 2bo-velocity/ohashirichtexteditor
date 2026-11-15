// Normalisation rules, one by one, plus idempotence: running it twice must
// change nothing the second time, or every save would grow the HTML.
import { describe, expect, it } from 'vitest';
import { normalize, type Boundary } from '../../resources/js/core/normalize';

function run(html: string, caret?: (root: Element) => Boundary): { html: string; changed: boolean } {
  const div = document.createElement('div');
  div.innerHTML = html;
  const changed = normalize(div, { boundaries: caret ? [caret(div)] : [] });
  return { html: div.innerHTML, changed };
}

const cases: [string, string, string][] = [
  ['execCommand inline output', '<p>a <b>b</b> <i>i</i> <strike>s</strike></p>', '<p>a <strong>b</strong> <em>i</em> <s>s</s></p>'],
  ['spans and fonts are unwrapped', '<p><span style="color: rgb(0, 0, 0);">x</span><font color="red">y</font></p>', '<p>xy</p>'],
  ['style, class, id are removed', '<p style="margin:0" class="c" id="i">x</p>', '<p>x</p>'],
  ['top-level div becomes p (emptied list item)', '<ul><li>a</li></ul><div><br></div>', '<ul><li>a</li></ul><p><br></p>'],
  ['nested divs collapse to one paragraph', '<div><div>x</div></div>', '<p>x</p>'],
  ['list nested in p is moved out (Chromium)', '<p><ul><li>x</li></ul></p>', '<ul><li>x</li></ul>'],
  ['text around a nested list keeps its paragraphs', '<p>a<ul><li>x</li></ul>b</p>', '<p>a</p><ul><li>x</li></ul><p>b</p>'],
  ['bare top-level text is wrapped', 'hello', '<p>hello</p>'],
  ['bare inline run is wrapped once', 'a<strong>b</strong>c<p>d</p>e', '<p>a<strong>b</strong>c</p><p>d</p><p>e</p>'],
  ['whitespace between blocks is dropped', '<p>a</p>\n  <p>b</p>', '<p>a</p><p>b</p>'],
  ['blockquote inline content is wrapped (formatBlock)', '<blockquote>hello</blockquote>', '<blockquote><p>hello</p></blockquote>'],
  ['adjacent identical formatting merges', '<p><strong>a</strong><strong>b</strong></p>', '<p><strong>ab</strong></p>'],
  ['empty formatting is removed', '<p>a<strong></strong>b</p>', '<p>ab</p>'],
  ['empty paragraph without a br is removed', '<p>a</p><p></p>', '<p>a</p>'],
  ['empty paragraph with a br is kept (caret holder)', '<p>a</p><p><br></p>', '<p>a</p><p><br></p>'],
  ['trailing br after text is removed (Firefox)', '<p>hello<br></p>', '<p>hello</p>'],
  ['intentional empty last line is kept', '<p>hello<br><br></p>', '<p>hello<br><br></p>'],
  ['link attributes in one order', '<p><a rel="noopener noreferrer" target="_blank" href="/x">l</a></p>', '<p><a href="/x" target="_blank" rel="noopener noreferrer">l</a></p>'],
  ['links get the allowlist\'s forced rel', '<p><a href="/x">l</a></p>', '<p><a href="/x" rel="noopener noreferrer">l</a></p>'],
  ['already-normal HTML is untouched', '<h2>T</h2><p><strong>b</strong> <a href="/x" rel="noopener noreferrer">l</a></p><ul><li>u</li></ul>', '<h2>T</h2><p><strong>b</strong> <a href="/x" rel="noopener noreferrer">l</a></p><ul><li>u</li></ul>'],
];

describe('normalize', () => {
  for (const [name, input, expected] of cases) {
    it(name, () => {
      const first = run(input);
      expect(first.html).toBe(expected);
      const second = run(first.html);
      expect(second.html).toBe(expected);
      expect(second.changed).toBe(false);
    });
  }

  it('reports no change for normal HTML', () => {
    expect(run('<p>a</p>').changed).toBe(false);
  });

  it('keeps empty formatting that holds the caret', () => {
    const out = run('<p>a<strong></strong></p>', (root) => [root.querySelector('strong')!, 0]);
    expect(out.html).toBe('<p>a<strong></strong></p>');
  });

  describe('caret boundaries follow the DOM changes', () => {
    const follow = (html: string, at: (root: Element) => Boundary) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      const b = at(div);
      normalize(div, { boundaries: [b] });
      return { div, b };
    };

    it('into the <p> that replaces the <div> it was in (Firefox/WebKit list exit)', () => {
      const { div, b } = follow('<ul><li>a</li></ul><div><br></div>', (r) => [r.querySelector('div')!, 0]);
      expect(div.innerHTML).toBe('<ul><li>a</li></ul><p><br></p>');
      expect(b[0]).toBe(div.querySelector('p'));
      expect(b[1]).toBe(0);
    });

    it('out of an unwrapped <span> into its parent at the same spot', () => {
      const { div, b } = follow('<p>a<span>bc</span>d</p>', (r) => [r.querySelector('span')!, 1]);
      expect(div.innerHTML).toBe('<p>abcd</p>');
      expect(b[0]).toBe(div.querySelector('p'));
      expect(b[1]).toBe(2); // after "a" and "bc"
    });

    it('into the <p> that wraps bare top-level text', () => {
      const { div, b } = follow('hello', (r) => [r, 1]);
      expect(div.innerHTML).toBe('<p>hello</p>');
      expect(b).toEqual([div.querySelector('p'), 1]);
    });

    it('past a removed trailing <br>', () => {
      const { div, b } = follow('<p>hello<br></p>', (r) => [r.querySelector('p')!, 2]);
      expect(div.innerHTML).toBe('<p>hello</p>');
      expect(b).toEqual([div.querySelector('p'), 1]);
    });
  });

  it('moves text nodes instead of recreating them (the caret survives)', () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>a <b>bold</b></p>';
    const text = div.querySelector('b')!.firstChild!;
    normalize(div);
    expect(div.querySelector('strong')!.firstChild).toBe(text);
  });
});
