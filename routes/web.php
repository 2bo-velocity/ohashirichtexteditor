<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use OhashiEditor\Laravel\Http\ImageUploadController;

// Loaded only when config('ohashi-editor.uploads.enabled') is true. The
// middleware (by default web + auth, plus a rate limit) comes from the config.
Route::middleware(array_values(array_filter([
    ...(array) config('ohashi-editor.uploads.middleware', ['web', 'auth']),
    config('ohashi-editor.uploads.rate_limit') ? 'throttle:ohashi-editor-uploads' : null,
])))
    ->post((string) config('ohashi-editor.uploads.route', 'ohashi-editor/images'), ImageUploadController::class)
    ->name('ohashi-editor.images.store');
