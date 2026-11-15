<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Editor defaults for <x-ohashi-editor>
    |--------------------------------------------------------------------------
    |
    | locale: the editor's UI language ("en", "ja", or one you register with
    |   defineOhashiEditorLocale()). null follows app()->getLocale() when the
    |   editor ships that language, and is English otherwise.
    | toolbar: the buttons, e.g. "bold italic | link" (null: the editor's
    |   default set). An editor's own locale / toolbar attribute wins.
    |
    */

    'locale' => env('OHASHI_EDITOR_LOCALE'),

    'toolbar' => null,

    /*
    |--------------------------------------------------------------------------
    | HTML sanitiser
    |--------------------------------------------------------------------------
    |
    | Every save (the SanitizedHtml cast) and every output (<x-ohashi-content>)
    | goes through the sanitiser. Input larger than this is rejected with
    | OE-SAN-3002 rather than cut short; validate the length in your form
    | request so users get a proper message first.
    |
    */

    'sanitizer' => [
        'max_input_bytes' => env('OHASHI_EDITOR_MAX_INPUT_BYTES', 2 * 1024 * 1024),
    ],

    /*
    |--------------------------------------------------------------------------
    | Image uploads
    |--------------------------------------------------------------------------
    |
    | The editor's image button posts to a route the package registers
    | (POST /ohashi-editor/images, named "ohashi-editor.images.store"). Every
    | file is checked by its content (PNG, JPEG, GIF, WebP; never SVG), limited
    | in bytes and pixels, re-encoded with GD (which drops EXIF/GPS data and
    | anything hidden in the file) and stored under a random name.
    |
    | Requires ext-gd. Decoding needs about width x height x 4 bytes of memory,
    | so keep memory_limit above max_pixels x 4 (64 MB at the default).
    |
    | middleware: who may upload. The default requires a logged-in user; keep
    |   "web" for sessions and CSRF protection.
    | rate_limit: uploads per minute per user (or IP); null to turn it off.
    | disk: a public disk (local "public" with `php artisan storage:link`, or
    |   S3 / R2). Serve it with `X-Content-Type-Options: nosniff`.
    | relative_urls: files served by the app itself get a root-relative URL
    |   ("/storage/…") in the saved HTML, so posts survive a domain change and
    |   work when APP_URL differs from the address in the browser. Files on
    |   another host (S3, a CDN) always keep their absolute URL.
    |
    */

    'uploads' => [
        'enabled' => env('OHASHI_EDITOR_UPLOADS', true),
        'route' => 'ohashi-editor/images',
        'middleware' => ['web', 'auth'],
        'rate_limit' => 30,
        'disk' => env('OHASHI_EDITOR_DISK', 'public'),
        'directory' => 'ohashi-editor',
        'max_kilobytes' => 5120,
        'max_pixels' => 16_000_000,
        'relative_urls' => true,
    ],

];
