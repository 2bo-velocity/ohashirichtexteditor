import { describe, expect, it } from 'vitest';
import { selectedImage } from '../../resources/js/core/selection';

function setup(html: string) {
  const content = document.createElement('div');
  content.innerHTML = html;
  return { content, p: content.firstChild as HTMLElement, img: content.querySelector('img') };
}

describe('selectedImage', () => {
  it('finds an image selected as a node, or from the end of the text before it (WebKit)', () => {
    const { content, p, img } = setup('<p>a<img src="x.png">b</p>');
    const r = document.createRange();
    r.setStart(p, 1);
    r.setEnd(p, 2);
    expect(selectedImage(r, content)).toBe(img);
    r.setStart(p.firstChild!, 1);
    expect(selectedImage(r, content)).toBe(img);
  });

  it('is null for a caret, a selection with text, or two images', () => {
    const { content, p } = setup('<p>a<img src="x.png"><img src="y.png">b</p>');
    const r = document.createRange();
    r.setStart(p, 1);
    r.collapse(true); // happy-dom does not collapse on its own when the range moves to another tree
    expect(selectedImage(r, content)).toBeNull();
    r.setEnd(p, 3);
    expect(selectedImage(r, content)).toBeNull();
    r.setStart(p.firstChild!, 0);
    r.setEnd(p, 2);
    expect(selectedImage(r, content)).toBeNull();
  });
});
