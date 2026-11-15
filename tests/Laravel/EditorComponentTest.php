<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Blade;

it('publishes only the browser bundle to public/', function (): void {
    $paths = Illuminate\Support\ServiceProvider::pathsToPublish(OhashiEditor\Laravel\OhashiEditorServiceProvider::class, 'ohashi-editor-assets');

    expect(array_values(array_map(fn ($to) => basename($to), $paths)))->toBe(['ohashi-editor.js'])
        ->and(array_keys($paths)[0])->toEndWith('dist/ohashi-editor.js');
});

it('merges the package config', function (): void {
    expect(config('ohashi-editor.uploads.disk'))->toBe('public');
});

it('renders the custom element with name and value', function (): void {
    $html = Blade::render('<x-ohashi-editor name="body" value="<p>Hi</p>" />');

    expect($html)
        ->toContain('<ohashi-rich-text-editor')
        ->toContain('name="body"')
        ->toContain('html-lint="true"');
});

it('takes the UI language from config, else from the app locale when the editor ships it', function (?string $configured, string $app, ?string $expected): void {
    config(['ohashi-editor.locale' => $configured]);
    app()->setLocale($app);

    $html = Blade::render('<x-ohashi-editor name="body" />');

    $expected === null
        ? expect($html)->not->toContain('locale=')
        : expect($html)->toContain('locale="' . $expected . '"');
})->with([
    'app locale ja' => [null, 'ja', 'ja'],
    'app locale with a region (ja_JP)' => [null, 'ja_JP', 'ja'],
    'app locale en' => [null, 'en', 'en'],
    'app locale not bundled: no attribute, English, no warning' => [null, 'de', null],
    'config wins over the app' => ['en', 'ja', 'en'],
    'config may name a language added in JavaScript' => ['fr', 'ja', 'fr'],
]);

it('lets an editor override the language and the toolbar', function (): void {
    config(['ohashi-editor.locale' => 'ja', 'ohashi-editor.toolbar' => 'bold italic | link']);

    expect(Blade::render('<x-ohashi-editor name="body" />'))
        ->toContain('locale="ja"')
        ->toContain('toolbar="bold italic | link"');
    expect(Blade::render('<x-ohashi-editor name="body" locale="en" toolbar="bold" />'))
        ->toContain('locale="en"')->not->toContain('locale="ja"')
        ->toContain('toolbar="bold"')->not->toContain('toolbar="bold italic');
});

it('leaves the toolbar to the editor when none is configured', function (): void {
    expect(Blade::render('<x-ohashi-editor name="body" />'))->not->toContain('toolbar=');
});

it('needs no name when bound with wire:model', function (): void {
    $html = Blade::render('<x-ohashi-editor wire:model.live="body" />');

    expect($html)->toContain('wire:model.live="body"')->not->toContain('name=');
});

it('escapes the initial value inside the attribute', function (): void {
    $html = Blade::render('<x-ohashi-editor name="body" :value="$v" />', [
        'v' => '" onmouseover="alert(1)',
    ]);

    expect($html)->not->toContain('" onmouseover="alert(1)');
});

it('can turn the html lint off', function (): void {
    $html = Blade::render('<x-ohashi-editor name="body" :html-lint="false" />');

    expect($html)->toContain('html-lint="false"');
});

it('accepts the value types a model attribute can hold', function (mixed $value, string $expected): void {
    $html = Blade::render('<x-ohashi-editor name="body" :value="$v" />', ['v' => $value]);

    expect($html)->toContain('value="' . $expected . '"');
})->with([
    'null (nullable column)' => [null, ''],
    'Htmlable (e.g. HtmlString, a cast)' => [new Illuminate\Support\HtmlString('<p>h</p>'), '&lt;p&gt;h&lt;/p&gt;'],
    'Stringable' => [new class implements Stringable {
        public function __toString(): string
        {
            return '<p>s</p>';
        }
    }, '&lt;p&gt;s&lt;/p&gt;'],
]);
