<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;

// The route is registered while the application boots, so the switch has to
// be set before that: through the environment, then a fresh application.
beforeEach(function (): void {
    $_SERVER['OHASHI_EDITOR_UPLOADS'] = $_ENV['OHASHI_EDITOR_UPLOADS'] = 'false';
    $this->refreshApplication();
});

afterEach(function (): void {
    unset($_SERVER['OHASHI_EDITOR_UPLOADS'], $_ENV['OHASHI_EDITOR_UPLOADS']);
});

it('registers no route and no upload-url when uploads are switched off', function (): void {
    expect(config('ohashi-editor.uploads.enabled'))->toBeFalse()
        ->and(Route::has('ohashi-editor.images.store'))->toBeFalse()
        ->and(Blade::render('<x-ohashi-editor name="body" />'))->not->toContain('upload-url');
});
