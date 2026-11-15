// The events frameworks bind to. Alpine's x-model (and so Livewire's
// wire:model) listens for `input` and reads `el.value`; for any CustomEvent
// it would read `event.detail` instead.
import { afterEach, describe, expect, it } from 'vitest';
import { OhashiEditorChangeEvent, TAG_NAME, isOhashiEditorChange, type OhashiEditorElement } from '../../resources/js/index';

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(): { el: OhashiEditorElement; events: string[] } {
  document.body.innerHTML = `<${TAG_NAME} name="body"></${TAG_NAME}>`;
  const el = document.querySelector(TAG_NAME) as OhashiEditorElement;
  const events: string[] = [];
  el.addEventListener('input', (e) => events.push(`input:${e.constructor.name === 'Event' ? 'Event' : e.constructor.name}:${el.value}`));
  el.addEventListener('change', (e) => events.push(`change:${(e as OhashiEditorChangeEvent).detail.html}`));
  return { el, events };
}

describe('input and change', () => {
  it('change carries detail.html but is not a CustomEvent', () => {
    const event = new OhashiEditorChangeEvent('<p>x</p>');
    expect(event).not.toBeInstanceOf(CustomEvent);
    expect(event.detail).toEqual({ html: '<p>x</p>' });
    expect([event.type, event.bubbles, event.composed]).toEqual(['change', true, true]);
    expect(isOhashiEditorChange(event)).toBe(true);
    expect(isOhashiEditorChange(new Event('change'))).toBe(false);
  });

  it('fire for changes the browser makes no input event for (undo), input first', () => {
    const { el, events } = mount();
    el.value = '<p>a</p>';
    // Setting the value from outside is not announced (no echo loops).
    expect(events).toEqual([]);

    const content = el.shadowRoot!.querySelector('[part~="content"]')!;
    content.querySelector('p')!.append('b');
    content.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    expect(events).toEqual(['input:Event:<p>ab</p>', 'change:<p>ab</p>']);

    events.length = 0;
    expect(el.undo()).toBe(true);
    expect(events).toEqual(['input:Event:<p>a</p>', 'change:<p>a</p>']);
  });

  it('the browser\'s own input event does not leave the shadow root', () => {
    const { el } = mount();
    const seen: Event[] = [];
    el.addEventListener('input', (e) => seen.push(e));
    const content = el.shadowRoot!.querySelector('[part~="content"]')!;
    content.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
    // Exactly one, and it is the editor's: dispatched after normalisation.
    expect(seen).toHaveLength(1);
    expect(seen[0]).not.toBeInstanceOf(InputEvent);
  });
});

describe('the trailing newline of a code block', () => {
  it('is left out of the value, and echoing that value back changes nothing', () => {
    const { el } = mount();
    el.value = '<pre><code>a\n\n</code></pre>';
    const content = el.shadowRoot!.querySelector('[part~="content"]')!;
    const code = content.querySelector('code')!;
    expect(el.value).toBe('<pre><code>a\n</code></pre>');
    // Vue's v-model / React write `value` straight back: same content, no re-render.
    el.value = el.value;
    expect(content.querySelector('code')).toBe(code);
  });
});

describe('empty paragraphs at the end', () => {
  it('are left out of the value but kept in the editor, and an echo changes nothing', () => {
    const { el } = mount();
    el.value = '<pre><code>a</code></pre><p><br></p><p><br></p>';
    const content = el.shadowRoot!.querySelector('[part~="content"]')!;
    expect(el.value).toBe('<pre><code>a</code></pre>');
    expect(content.querySelectorAll('p')).toHaveLength(2);
    const p = content.querySelector('p');
    el.value = el.value;
    expect(content.querySelector('p')).toBe(p);
  });

  it('keeps empty paragraphs between content', () => {
    const { el } = mount();
    el.value = '<p>a</p><p><br></p><p>b</p><p><br></p>';
    expect(el.value).toBe('<p>a</p><p><br></p><p>b</p>');
  });
});
