<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Blade;
use OhashiEditor\Exception\SanitizationException;
use OhashiEditor\HtmlSanitizer;
use OhashiEditor\Laravel\Casts\SanitizedHtml;

final class Post extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['body' => SanitizedHtml::class];
    }
}

it('sanitises on save through the cast', function (): void {
    $post = new Post(['body' => '<p onclick="x()">a</p><script>x()</script>']);

    expect($post->getAttributes()['body'])->toBe('<p>a</p>');
});

it('keeps null as null through the cast', function (): void {
    expect((new Post(['body' => null]))->getAttributes()['body'])->toBeNull();
});

it('sanitises again on output, whatever is stored', function (): void {
    // A legacy row or a direct DB write never went through the cast.
    $html = Blade::render('<x-ohashi-content :html="$h" />', ['h' => '<p>ok</p><img src=x onerror="x()">']);

    expect($html)
        ->toContain('<div class="orte-rendered-content">')
        ->toContain('<p>ok</p>')
        ->not->toContain('onerror');
});

it('merges classes on the output wrapper', function (): void {
    $html = Blade::render('<x-ohashi-content class="prose" :html="$h" />', ['h' => '<p>a</p>']);

    expect($html)->toContain('class="orte-rendered-content prose"');
});

it('renders nothing harmful for null content', function (): void {
    $html = Blade::render('<x-ohashi-content :html="$h" />', ['h' => null]);

    expect($html)->toContain('<div class="orte-rendered-content"></div>');
});

it('takes the size limit from config', function (): void {
    config(['ohashi-editor.sanitizer.max_input_bytes' => 10]);
    app()->forgetInstance(HtmlSanitizer::class);

    expect(fn () => new Post(['body' => '<p>' . str_repeat('a', 50) . '</p>']))
        ->toThrow(SanitizationException::class, '[OE-SAN-3002]');
});
