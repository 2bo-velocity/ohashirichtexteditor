<?php

declare(strict_types=1);

use Illuminate\Auth\GenericUser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

use function OhashiEditor\Tests\Image\encode;
use function OhashiEditor\Tests\Image\pngHeaderOnly;

require_once __DIR__ . '/../Image/helpers.php';

const UPLOAD_URL = '/ohashi-editor/images';

function upload(string $contents, string $name = 'photo.png', ?string $mime = null): Illuminate\Testing\TestResponse
{
    $file = UploadedFile::fake()->createWithContent($name, $contents);
    if ($mime !== null) {
        $file->mimeTypeToReport = $mime;
    }

    return test()->actingAs(new GenericUser(['id' => 7]))
        ->post(UPLOAD_URL, ['image' => $file], ['Accept' => 'application/json']);
}

beforeEach(function (): void {
    Storage::fake('public');
});

it('stores a re-encoded image under a random name and returns its URL', function (): void {
    $response = upload(encode('png') . '<script>alert(1)</script>', '../../evil.php.png');

    $response->assertCreated();
    $url = $response->json('url');
    expect($url)->toMatch('#^/storage/ohashi-editor/[0-9a-f]{32}\.png$#');

    $files = Storage::disk('public')->allFiles('ohashi-editor');
    expect($files)->toHaveCount(1);
    $stored = Storage::disk('public')->get($files[0]);
    expect(getimagesizefromstring($stored)['mime'])->toBe('image/png')
        ->and($stored)->not->toContain('<script>');
});

it('returns a root-relative URL for files the app serves itself, absolute ones otherwise', function (string $url, string $app, string $expected): void {
    expect(OhashiEditor\Laravel\Http\ImageUploadController::relativeToApp($url, $app))->toBe($expected);
})->with([
    'same host' => ['http://localhost/storage/a.png', 'http://localhost', '/storage/a.png'],
    'same host, app in a subdirectory' => ['https://example.com/blog/storage/a.png', 'https://example.com/blog', '/blog/storage/a.png'],
    'query kept' => ['https://example.com/storage/a.png?v=1', 'https://example.com', '/storage/a.png?v=1'],
    'S3' => ['https://bucket.s3.amazonaws.com/a.png', 'https://example.com', 'https://bucket.s3.amazonaws.com/a.png'],
    'other port' => ['http://localhost:9000/a.png', 'http://localhost:8000', 'http://localhost:9000/a.png'],
    'other scheme' => ['http://example.com/a.png', 'https://example.com', 'http://example.com/a.png'],
    'no app url' => ['http://localhost/a.png', '', 'http://localhost/a.png'],
]);

it('keeps absolute URLs when configured to', function (): void {
    config(['ohashi-editor.uploads.relative_urls' => false]);

    config(['filesystems.disks.public.url' => 'http://localhost/storage']);
    Storage::fake('public', ['url' => 'http://localhost/storage']);
    $url = upload(encode('png'))->json('url');

    $file = Storage::disk('public')->allFiles('ohashi-editor')[0];
    expect($url)->toBe(Storage::disk('public')->url($file))->toStartWith('http://localhost/storage/ohashi-editor/');
});

it('names the file by its content, whatever the client claims', function (): void {
    upload(encode('jpeg'), 'cat.gif', 'image/gif')->assertCreated();

    expect(Storage::disk('public')->allFiles('ohashi-editor')[0])->toEndWith('.jpg');
});

it('answers refusals with a code and parameters, never text', function (string $contents, string $code, ?array $params): void {
    $response = upload($contents);

    $response->assertStatus(422);
    expect($response->json())->toBe($params === null ? ['code' => $code] : ['code' => $code, 'params' => $params]);
    expect(Storage::disk('public')->allFiles())->toBe([]);
})->with([
    'SVG' => ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'OE-UPL-4002', null],
    'not an image' => ['hello', 'OE-UPL-4002', null],
    'broken image (GD warning under Laravel\'s handler)' => [pngHeaderOnly(10, 10), 'OE-UPL-4002', null],
    'decompression bomb' => [pngHeaderOnly(50_000, 50_000), 'OE-UPL-4006', ['max' => '16']],
]);

it('enforces the configured size limit', function (): void {
    config(['ohashi-editor.uploads.max_kilobytes' => 1]);

    $response = upload(encode('png') . str_repeat("\0", 2048));

    $response->assertStatus(422)->assertExactJson(['code' => 'OE-UPL-4001', 'params' => ['max' => '1 KB']]);
});

it('rejects a request without a file', function (): void {
    test()->actingAs(new GenericUser(['id' => 7]))
        ->post(UPLOAD_URL, [], ['Accept' => 'application/json'])
        ->assertStatus(422)
        ->assertExactJson(['code' => 'OE-UPL-4900']);
});

it('requires a logged-in user by default', function (): void {
    $file = UploadedFile::fake()->createWithContent('a.png', encode('png'));

    test()->post(UPLOAD_URL, ['image' => $file], ['Accept' => 'application/json'])->assertUnauthorized();
    expect(Storage::disk('public')->allFiles())->toBe([]);
});

it('limits how many uploads a user can make per minute', function (): void {
    config(['ohashi-editor.uploads.rate_limit' => 2]);

    upload(encode('png'))->assertCreated();
    upload(encode('png'))->assertCreated();
    upload(encode('png'))->assertStatus(429);
});

it('does not leak storage errors to the client', function (): void {
    config(['ohashi-editor.uploads.disk' => 'missing-disk']);

    upload(encode('png'))->assertStatus(500)->assertExactJson(['code' => 'OE-UPL-4900']);
});

it('points the Blade component at the upload route and tells it the limit', function (): void {
    $html = Blade::render('<x-ohashi-editor name="body" />');

    expect($html)->toContain('upload-url="/ohashi-editor/images"')
        ->toMatch('/upload-max-size="\d+"/');
});

// Reported in v0.1.0: the URL was built from APP_URL. Laravel's default is
// http://localhost while `php artisan serve` opens http://127.0.0.1:8000, so
// the endpoint was another origin, where the editor sends neither the session
// cookie nor the CSRF token — every upload failed. A path is the page's own
// origin whatever APP_URL says.
it('gives the upload route as a path, so it is the page\'s own origin whatever APP_URL is', function (): void {
    config(['app.url' => 'http://localhost']);
    URL::forceRootUrl('http://localhost');

    expect(Blade::render('<x-ohashi-editor name="body" />'))
        ->toContain('upload-url="/ohashi-editor/images"')
        ->not->toContain('upload-url="http');
});

it('lets one editor use its own endpoint or none', function (): void {
    expect(Blade::render('<x-ohashi-editor name="body" upload-url="/my/uploads" />'))
        ->toContain('upload-url="/my/uploads"')
        ->not->toContain('upload-max-size');
    expect(Blade::render('<x-ohashi-editor name="body" :upload-url="false" />'))
        ->not->toContain('upload-url');
});
