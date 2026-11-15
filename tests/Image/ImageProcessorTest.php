<?php

declare(strict_types=1);

use OhashiEditor\ErrorCode;
use OhashiEditor\Exception\UploadRejectedException;
use OhashiEditor\Image\ImageProcessor;
use OhashiEditor\Image\JpegOrientation;

use function OhashiEditor\Tests\Image\canvas;
use function OhashiEditor\Tests\Image\encode;
use function OhashiEditor\Tests\Image\exifOrientation;
use function OhashiEditor\Tests\Image\pngHeaderOnly;
use function OhashiEditor\Tests\Image\withSegment;

require_once __DIR__ . '/helpers.php';

/** Runs $fn and returns the rejection it must throw. */
function rejection(callable $fn): UploadRejectedException
{
    try {
        $fn();
    } catch (UploadRejectedException $e) {
        return $e;
    }
    throw new RuntimeException('Expected an UploadRejectedException.');
}

it('accepts and re-encodes each supported format', function (string $format, string $mime, string $extension): void {
    $image = (new ImageProcessor())->process(encode($format));

    expect($image->mimeType)->toBe($mime)
        ->and($image->extension)->toBe($extension)
        ->and([$image->width, $image->height])->toBe([40, 20])
        ->and(getimagesizefromstring($image->contents)['mime'] ?? null)->toBe($mime)
        ->and($image->randomFilename())->toMatch('/^[0-9a-f]{32}\.' . $extension . '$/');
})->with([
    'png' => ['png', 'image/png', 'png'],
    'jpeg' => ['jpeg', 'image/jpeg', 'jpg'],
    'gif' => ['gif', 'image/gif', 'gif'],
    'webp' => ['webp', 'image/webp', 'webp'],
]);

it('decides the format from the content, not from a name or a claimed type', function (): void {
    // There is no file name or Content-Type to trust in the first place: a
    // JPEG is a JPEG even when the client called it photo.png.
    $file = tempnam(sys_get_temp_dir(), 'orte') . '.png';
    file_put_contents($file, encode('jpeg'));

    expect((new ImageProcessor())->processFile($file)->mimeType)->toBe('image/jpeg');
    unlink($file);
});

it('rejects what is not a raster image', function (string $bytes): void {
    expect(rejection(fn () => (new ImageProcessor())->process($bytes))->errorCode())->toBe(ErrorCode::UploadTypeNotAllowed);
})->with([
    'SVG (can carry script)' => ['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>'],
    'HTML' => ['<!DOCTYPE html><script>alert(1)</script>'],
    'PHP' => ['<?php system($_GET["c"]);'],
    'empty' => [''],
    'a valid PNG header with no pixel data' => [pngHeaderOnly(10, 10)],
    'a truncated JPEG' => [substr(encode('jpeg'), 0, 200)],
    'BMP' => ['BM' . str_repeat("\0", 60)],
]);

it('strips anything hidden around the pixels (polyglots)', function (string $format): void {
    $payload = '<script>alert(document.cookie)</script><?php echo "pwned"; ?>';
    $output = (new ImageProcessor())->process(encode($format) . $payload)->contents;

    expect($output)->not->toContain('<script>')->not->toContain('<?php');
})->with(['png', 'gif', 'jpeg']);

it('drops JPEG metadata such as comments and EXIF (GPS position)', function (): void {
    $jpeg = withSegment(encode('jpeg'), 0xE1, exifOrientation(1) . 'GPS-SECRET-35.6812,139.7671');
    $jpeg = withSegment($jpeg, 0xFE, 'COMMENT-SECRET');

    $output = (new ImageProcessor())->process($jpeg)->contents;

    expect($output)->not->toContain('GPS-SECRET')->not->toContain('COMMENT-SECRET')->not->toContain('Exif');
});

it('applies the EXIF rotation of phone photos before dropping EXIF', function (bool $littleEndian): void {
    // Stored landscape (40 × 20, red on the left), EXIF says "rotate 90° clockwise".
    $jpeg = withSegment(encode('jpeg'), 0xE1, exifOrientation(6, $littleEndian));
    expect(JpegOrientation::read($jpeg))->toBe(6);

    $image = (new ImageProcessor())->process($jpeg);
    expect([$image->width, $image->height])->toBe([20, 40]);

    // After a clockwise turn the red half is on top.
    $gd = imagecreatefromstring($image->contents);
    $top = imagecolorsforindex($gd, imagecolorat($gd, 10, 5));
    $bottom = imagecolorsforindex($gd, imagecolorat($gd, 10, 35));
    expect($top['red'])->toBeGreaterThan(200)->and($bottom['blue'])->toBeGreaterThan(200);
})->with(['big-endian (most cameras)' => [false], 'little-endian' => [true]]);

it('reads no orientation from JPEGs without one, or from broken EXIF', function (string $jpeg): void {
    expect(JpegOrientation::read($jpeg))->toBe(1);
})->with([
    'plain JPEG' => [encode('jpeg')],
    'not a JPEG' => ['GIF89a'],
    'truncated EXIF' => [withSegment(encode('jpeg'), 0xE1, "Exif\0\0MM\0*")],
    'out-of-range value' => [withSegment(encode('jpeg'), 0xE1, exifOrientation(9))],
]);

it('rejects files over the byte limit, with the limit for the message', function (): void {
    $e = rejection(fn () => (new ImageProcessor(maxBytes: 1024))->process(encode('png', canvas(200, 200)) . str_repeat("\0", 2048)));

    expect($e->errorCode())->toBe(ErrorCode::UploadTooLarge)
        ->and($e->params())->toBe(['max' => '1 KB'])
        ->and($e->getMessage())->toStartWith('[OE-UPL-4001]');
});

it('checks the byte limit before reading a file', function (): void {
    $file = tempnam(sys_get_temp_dir(), 'orte');
    file_put_contents($file, str_repeat('x', 2048));

    expect(rejection(fn () => (new ImageProcessor(maxBytes: 1024))->processFile($file))->errorCode())->toBe(ErrorCode::UploadTooLarge);
    unlink($file);
});

it('rejects decompression bombs from the header, without decoding them', function (): void {
    // 60 bytes that claim 100,000 × 100,000 pixels: decoding would need ~40 GB.
    $bomb = pngHeaderOnly(100_000, 100_000);
    $e = rejection(fn () => (new ImageProcessor())->process($bomb));

    expect($e->errorCode())->toBe(ErrorCode::UploadDimensionsTooLarge)
        ->and($e->params())->toBe(['max' => '16']);
});

it('accepts an image right at the pixel limit', function (): void {
    expect((new ImageProcessor(maxPixels: 800))->process(encode('png'))->width)->toBe(40);
    expect(rejection(fn () => (new ImageProcessor(maxPixels: 799))->process(encode('png')))->errorCode())
        ->toBe(ErrorCode::UploadDimensionsTooLarge);
});

it('formats limits for people', function (int $bytes, string $text): void {
    expect(ImageProcessor::formatBytes($bytes))->toBe($text);
})->with([
    [5 * 1024 * 1024, '5 MB'],
    [1536 * 1024, '1.5 MB'],
    [512 * 1024, '512 KB'],
    [100, '100 B'],
]);

it('refuses nonsensical limits at construction', function (): void {
    expect(fn () => new ImageProcessor(maxBytes: 0))->toThrow(InvalidArgumentException::class, '[OE-CFG-1008]');
});
