<?php

declare(strict_types=1);

namespace OhashiEditor\Tests\Image;

use GdImage;

/** A small test image: left half red, right half blue (so rotation is visible). */
function canvas(int $width = 40, int $height = 20): GdImage
{
    $image = imagecreatetruecolor($width, $height);
    imagefilledrectangle($image, 0, 0, intdiv($width, 2) - 1, $height - 1, (int) imagecolorallocate($image, 255, 0, 0));
    imagefilledrectangle($image, intdiv($width, 2), 0, $width - 1, $height - 1, (int) imagecolorallocate($image, 0, 0, 255));

    return $image;
}

function encode(string $format, ?GdImage $image = null): string
{
    $image ??= canvas();
    ob_start();
    match ($format) {
        'png' => imagepng($image),
        'jpeg' => imagejpeg($image, null, 95),
        'gif' => imagegif($image),
        'webp' => imagewebp($image),
    };

    return (string) ob_get_clean();
}

/** Inserts a JPEG segment right after the SOI marker. */
function withSegment(string $jpeg, int $marker, string $payload): string
{
    return substr($jpeg, 0, 2) . chr(0xFF) . chr($marker) . pack('n', strlen($payload) + 2) . $payload . substr($jpeg, 2);
}

/** An EXIF APP1 payload holding only the Orientation tag. */
function exifOrientation(int $orientation, bool $littleEndian = false): string
{
    $u16 = $littleEndian ? 'v' : 'n';
    $u32 = $littleEndian ? 'V' : 'N';

    return "Exif\0\0" . ($littleEndian ? 'II' : 'MM') . pack($u16, 42) . pack($u32, 8)
        . pack($u16, 1)                                                    // one entry
        . pack($u16, 0x0112) . pack($u16, 3) . pack($u32, 1) . pack($u16, $orientation) . "\0\0"
        . pack($u32, 0);                                                   // no next IFD
}

/** A PNG signature and IHDR that claim the given size, with no pixel data at all. */
function pngHeaderOnly(int $width, int $height): string
{
    $ihdr = pack('NNCCCCC', $width, $height, 8, 6, 0, 0, 0);

    return "\x89PNG\r\n\x1a\n" . pack('N', 13) . 'IHDR' . $ihdr . pack('N', crc32('IHDR' . $ihdr));
}
