# OhashiRichTextEditor

A rich text editor for Laravel that nothing on the page can break.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://ohashirichtexteditor.com/img/screenshot-en-dark.webp">
  <img src="https://ohashirichtexteditor.com/img/screenshot-en-light.webp" width="720" alt="The editor: a toolbar with undo, formatting, headings, quote, lists, link and code buttons, above a document with a heading, formatted text, a list, a quote and a code block.">
</picture>

Try it at https://ohashirichtexteditor.com and https://demo.ohashirichtexteditor.com.

> **Status: early release (0.x).** Usable today; names (attributes, `::part()`,
> CSS custom properties, events) may still change before 1.0, as SemVer allows
> for 0.x versions. Japanese IME has been checked on Linux / Chrome and
> macOS / Safari; Windows is not checked yet.

- **Shadow DOM isolation** — jQuery, Bootstrap, Tailwind resets, Inertia page
  transitions and Livewire re-renders cannot reach inside the editor.
- **Comfortable with Japanese IME.**
- **One `composer require`** — Blade components, image uploads and server-side
  sanitising come with the package. No Node.js needed on your side.

## Requirements

- PHP 8.4+ (with `ext-dom`). 8.4 is required for its native HTML5 parser,
  which the server-side sanitiser relies on to read HTML exactly as browsers do.
- Laravel 12 or 13 for the Laravel integration. The editor itself is a
  framework-independent Web Component, and the PHP core does not require
  Laravel.

## Installation

```bash
composer require 2bo-velocity/ohashirichtexteditor
php artisan vendor:publish --tag=ohashi-editor-assets
```

## Usage

### Blade

```blade
<script type="module" src="{{ asset('vendor/ohashi-editor/ohashi-editor.js') }}"></script>

<form method="POST" action="/posts">
    @csrf
    <x-ohashi-editor name="body" :value="old('body', $post->body)" />
    <button type="submit">Save</button>
</form>
```

The element is form-associated: it submits under `name` exactly like a
`<textarea>`.

### Saving and displaying safely

Never store or output the editor's HTML without sanitising it: the browser
side can be bypassed by anyone posting to your endpoint directly.

```php
use OhashiEditor\Laravel\Casts\SanitizedHtml;

class Post extends Model
{
    protected function casts(): array
    {
        return ['body' => SanitizedHtml::class];   // sanitised on save
    }
}
```

```blade
{{-- sanitised again on output, whatever is stored --}}
<x-ohashi-content :html="$post->body" class="prose" />
```

Without Laravel:

```php
$clean = (new OhashiEditor\HtmlSanitizer())->sanitize($_POST['body']);
```

### Inertia (Vue 3 / React)

The JavaScript side is installed from the Composer package itself, so the
editor and the server-side code are always the same version — no separate npm
release to keep in step. Run `composer install` before `npm install`.

```bash
npm install ./vendor/2bo-velocity/ohashirichtexteditor
```

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { OhashiEditor } from '@2bo-velocity/ohashirichtexteditor/vue'

const form = useForm({ body: '' })
</script>

<template>
  <OhashiEditor v-model="form.body" name="body" />
</template>
```

```jsx
import { useForm } from '@inertiajs/react'
import { OhashiEditor } from '@2bo-velocity/ohashirichtexteditor/react'

const { data, setData } = useForm({ body: '' })
<OhashiEditor value={data.body} onChange={(html) => setData('body', html)} name="body" />
```

The wrappers load the editor for you and are safe to import under Inertia SSR.

## Documentation

https://ohashirichtexteditor.com

## License

OhashiRichTextEditor is dual-licensed:

- **AGPL-3.0-or-later** — free for open-source projects and any project whose
  source you can publish under the AGPL. See [LICENSE](LICENSE).
- **Commercial license** — for closed-source products and client work that
  cannot take on the AGPL's source-disclosure obligation.

To obtain a commercial license, contact **support@2bo-velocity.com**.

## Contributing

Pull requests are not accepted; bug reports and feature requests are welcome.
See [CONTRIBUTING.md](CONTRIBUTING.md) for why.

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md).
