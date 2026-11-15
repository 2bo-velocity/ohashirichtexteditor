<?php

declare(strict_types=1);

namespace OhashiEditor\Laravel;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use OhashiEditor\HtmlSanitizer;
use OhashiEditor\Image\ImageProcessor;
use OhashiEditor\Laravel\View\Components\Content;
use OhashiEditor\Laravel\View\Components\Editor;

final class OhashiEditorServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/ohashi-editor.php', 'ohashi-editor');

        // One configured sanitiser per application: building it reads and
        // compiles the allowlist.
        $this->app->singleton(HtmlSanitizer::class, static fn ($app): HtmlSanitizer => new HtmlSanitizer(
            maxInputBytes: (int) $app['config']->get('ohashi-editor.sanitizer.max_input_bytes', HtmlSanitizer::DEFAULT_MAX_INPUT_BYTES),
        ));

        // Built on first use only: an app that never uploads does not need GD.
        $this->app->bind(ImageProcessor::class, static fn ($app): ImageProcessor => new ImageProcessor(
            maxBytes: (int) $app['config']->get('ohashi-editor.uploads.max_kilobytes', 5120) * 1024,
            maxPixels: (int) $app['config']->get('ohashi-editor.uploads.max_pixels', ImageProcessor::DEFAULT_MAX_PIXELS),
        ));
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../../resources/views', 'ohashi-editor');
        $this->loadViewComponentsAs('ohashi', [
            'editor' => Editor::class,
            'content' => Content::class,
        ]);

        if ($this->app['config']->get('ohashi-editor.uploads.enabled', true)) {
            RateLimiter::for('ohashi-editor-uploads', function (Request $request): Limit {
                $perMinute = max(1, (int) $this->app['config']->get('ohashi-editor.uploads.rate_limit', 30));

                return Limit::perMinute($perMinute)->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip()));
            });
            $this->loadRoutesFrom(__DIR__ . '/../../routes/web.php');
        }

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/ohashi-editor.php' => config_path('ohashi-editor.php'),
            ], 'ohashi-editor-config');

            $this->publishes([
                __DIR__ . '/../../resources/views' => resource_path('views/vendor/ohashi-editor'),
            ], 'ohashi-editor-views');

            // The prebuilt, self-contained bundle. Publishing it is the whole
            // installation for Blade users: no Node, no Vite on their side.
            // Only the bundle: the type definitions and Inertia adapters in
            // dist/ are imported from the package by a build, never served.
            $this->publishes([
                __DIR__ . '/../../dist/ohashi-editor.js' => public_path('vendor/ohashi-editor/ohashi-editor.js'),
            ], 'ohashi-editor-assets');
        }
    }
}
