<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

// The editor bundle straight from dist/ (built by `npm run build`).
Route::get('/ohashi-editor.js', fn () => response()->file(
    __DIR__ . '/../../dist/ohashi-editor.js',
    ['Content-Type' => 'text/javascript', 'Cache-Control' => 'no-store'],
));

Route::get('/livewire/other', fn () => view('workbench::other'));

Route::get('/livewire/{mode}', fn (string $mode) => view('workbench::page', ['mode' => $mode]))
    ->whereIn('mode', ['deferred', 'live', 'blur', 'change']);
