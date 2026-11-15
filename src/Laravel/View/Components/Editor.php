<?php

declare(strict_types=1);

namespace OhashiEditor\Laravel\View\Components;

use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Route;
use Illuminate\View\Component;
use OhashiEditor\Laravel\Http\ImageUploadController;

/**
 * <x-ohashi-editor name="body" :value="$post->body" />
 *
 * Renders the <ohashi-rich-text-editor> custom element. The element is
 * form-associated, so it submits under `name` like a <textarea> would.
 *
 * Image uploads go to the package's own route unless `upload-url` says
 * otherwise; `:upload-url="false"` turns them off for this editor.
 */
final class Editor extends Component
{
    public readonly ?string $resolvedUploadUrl;

    public readonly ?int $uploadMaxSize;

    public readonly ?string $resolvedLocale;

    public readonly ?string $resolvedToolbar;

    /** UI languages the editor bundle ships with. */
    private const array BUNDLED_LOCALES = ['en', 'ja'];

    public function __construct(
        // Optional: a Livewire editor (wire:model) is not submitted with a form.
        public string $name = '',
        public ?string $value = null,
        // Reserved for HTML lint (v1.1). Accepted so `:html-lint` does not
        // fall through to the element as an attribute; not rendered yet.
        public bool $htmlLint = true,
        string|bool|null $uploadUrl = null,
        ?string $locale = null,
        ?string $toolbar = null,
    ) {
        $this->resolvedLocale = $locale ?? self::defaultLocale();
        $this->resolvedToolbar = $toolbar ?? self::nullableString(config('ohashi-editor.toolbar'));

        $enabled = (bool) config('ohashi-editor.uploads.enabled', true);
        $this->resolvedUploadUrl = match (true) {
            is_string($uploadUrl) && $uploadUrl !== '' => $uploadUrl,
            $uploadUrl === false || $uploadUrl === '' => null,
            // A path, not route()'s absolute URL: that one is built from
            // APP_URL, which often differs from the address in the browser
            // (Laravel's default http://localhost vs `php artisan serve` on
            // 127.0.0.1:8000). Another origin gets no session cookie and no
            // CSRF token from the editor, so every upload failed.
            $enabled && Route::has('ohashi-editor.images.store') => route('ohashi-editor.images.store', [], false),
            default => null,
        };
        // Lets the editor refuse a file that is too large before sending it.
        // Only meaningful for the package's own endpoint, whose limit we know.
        $this->uploadMaxSize = $this->resolvedUploadUrl !== null && ! is_string($uploadUrl)
            ? ImageUploadController::effectiveMaxBytes((int) config('ohashi-editor.uploads.max_kilobytes', 5120) * 1024)
            : null;
    }

    /**
     * config('ohashi-editor.locale') as given (it may name a language added
     * in JavaScript); otherwise the app's locale if the editor ships it —
     * "ja_JP" becomes "ja" — and no attribute (English) if it does not, so
     * an app in, say, German does not get a warning on every page.
     */
    private static function defaultLocale(): ?string
    {
        $configured = self::nullableString(config('ohashi-editor.locale'));
        if ($configured !== null) {
            return $configured;
        }
        $app = strtolower(str_replace('_', '-', (string) app()->getLocale()));
        $base = explode('-', $app)[0];

        return in_array($base, self::BUNDLED_LOCALES, true) ? $base : null;
    }

    private static function nullableString(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? $value : null;
    }

    public function render(): View
    {
        return view('ohashi-editor::components.editor');
    }
}
