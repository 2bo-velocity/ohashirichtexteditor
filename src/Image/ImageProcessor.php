<?php

declare(strict_types=1);

namespace OhashiEditor\Image;

use GdImage;
use OhashiEditor\ErrorCode;
use OhashiEditor\Exception\InvalidConfigurationException;
use OhashiEditor\Exception\UploadRejectedException;

/**
 * Checks an uploaded file and re-encodes it, so that what gets stored is
 * known to be a plain raster image and nothing else.
 *
 *  - The format is decided by the bytes, never by the file name or the
 *    Content-Type the client sent. PNG, JPEG, GIF and WebP only; SVG (which
 *    can carry script) is not accepted.
 *  - The size in bytes and the size in pixels are both limited. The pixel
 *    count is read from the header *before* decoding: a few kilobytes of
 *    PNG can claim to be 100,000 × 100,000 pixels and exhaust memory when
 *    decoded.
 *  - The image is decoded and written out again with GD. That drops metadata
 *    (EXIF, including GPS position) and anything hidden around the pixel
 *    data — a file that is a valid image and also valid HTML or PHP (a
 *    polyglot) comes out as only an image. The EXIF rotation of JPEG photos
 *    is applied to the pixels first.
 *
 * Known limits: animated GIFs keep their first frame; animated WebP is not
 * accepted. Decoding takes about width × height × 4 bytes of memory (64 MB at
 * the default pixel limit), so keep memory_limit above that.
 *
 * This class does not store anything: the caller decides where the result
 * goes (see ProcessedImage::randomFilename()).
 */
final class ImageProcessor
{
    public const int DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
    public const int DEFAULT_MAX_PIXELS = 16_000_000;

    private const array FORMATS = [
        IMAGETYPE_PNG => ['image/png', 'png', IMG_PNG],
        IMAGETYPE_JPEG => ['image/jpeg', 'jpg', IMG_JPG],
        IMAGETYPE_GIF => ['image/gif', 'gif', IMG_GIF],
        IMAGETYPE_WEBP => ['image/webp', 'webp', IMG_WEBP],
    ];

    public function __construct(
        private readonly int $maxBytes = self::DEFAULT_MAX_BYTES,
        private readonly int $maxPixels = self::DEFAULT_MAX_PIXELS,
        private readonly int $quality = 85,
    ) {
        if (! function_exists('imagecreatefromstring')) {
            throw new InvalidConfigurationException(
                ErrorCode::ImageLibraryMissing,
                'Image uploads need the GD extension (ext-gd) to check and re-encode images.',
            );
        }
        if ($maxBytes < 1 || $maxPixels < 1 || $quality < 1 || $quality > 100) {
            throw new InvalidConfigurationException(
                ErrorCode::InvalidUploadLimits,
                'maxBytes and maxPixels must be positive and quality between 1 and 100.',
            );
        }
    }

    public function maxBytes(): int
    {
        return $this->maxBytes;
    }

    /** Processes the file at $path (e.g. an uploaded temporary file). */
    public function processFile(string $path): ProcessedImage
    {
        $size = @filesize($path);
        if ($size === false) {
            throw $this->notAnImage('the file could not be read');
        }
        if ($size > $this->maxBytes) {
            throw $this->tooLarge($size);
        }
        $bytes = @file_get_contents($path);
        if ($bytes === false) {
            throw $this->notAnImage('the file could not be read');
        }

        return $this->process($bytes);
    }

    public function process(string $bytes): ProcessedImage
    {
        if (strlen($bytes) > $this->maxBytes) {
            throw $this->tooLarge(strlen($bytes));
        }

        $info = $bytes === '' ? false : @getimagesizefromstring($bytes);
        if ($info === false || ! isset(self::FORMATS[$info[2]])) {
            throw $this->notAnImage('the content is not a PNG, JPEG, GIF or WebP image');
        }
        [$mime, $extension, $gdFlag] = self::FORMATS[$info[2]];
        [$width, $height] = $info;
        if ($width < 1 || $height < 1) {
            throw $this->notAnImage('the image has no pixels');
        }
        if ($width * $height > $this->maxPixels) {
            throw new UploadRejectedException(
                ErrorCode::UploadDimensionsTooLarge,
                sprintf('The image is %d × %d pixels; at most %d pixels are accepted.', $width, $height, $this->maxPixels),
                ['max' => self::formatMegapixels($this->maxPixels)],
            );
        }
        if ((imagetypes() & $gdFlag) === 0) {
            throw $this->notAnImage("this GD build cannot read {$extension}");
        }

        $image = @imagecreatefromstring($bytes);
        if (! $image instanceof GdImage) {
            throw $this->notAnImage('the image data could not be decoded');
        }

        if ($info[2] === IMAGETYPE_JPEG) {
            $image = self::applyOrientation($image, JpegOrientation::read($bytes));
        }

        $contents = $this->encode($image, $info[2]);

        return new ProcessedImage($contents, $mime, $extension, imagesx($image), imagesy($image));
    }

    private function encode(GdImage $image, int $type): string
    {
        if ($type !== IMAGETYPE_JPEG && $type !== IMAGETYPE_GIF) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }

        ob_start();
        try {
            $ok = match ($type) {
                IMAGETYPE_PNG => imagepng($image, null, 6),
                IMAGETYPE_JPEG => imagejpeg($image, null, $this->quality),
                IMAGETYPE_GIF => imagegif($image),
                IMAGETYPE_WEBP => imagewebp($image, null, $this->quality),
            };
            $contents = (string) ob_get_contents();
        } finally {
            ob_end_clean();
        }
        if (! $ok || $contents === '') {
            throw $this->notAnImage('the image could not be re-encoded');
        }

        return $contents;
    }

    private static function applyOrientation(GdImage $image, int $orientation): GdImage
    {
        $rotate = static function (GdImage $source, int $angle): GdImage {
            $rotated = imagerotate($source, $angle, 0);

            return $rotated instanceof GdImage ? $rotated : $source;
        };

        // imagerotate() turns counter-clockwise.
        switch ($orientation) {
            case 2:
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 3:
                $image = $rotate($image, 180);
                break;
            case 4:
                imageflip($image, IMG_FLIP_VERTICAL);
                break;
            case 5:
                $image = $rotate($image, 270);
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 6:
                $image = $rotate($image, 270);
                break;
            case 7:
                $image = $rotate($image, 90);
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 8:
                $image = $rotate($image, 90);
                break;
        }

        return $image;
    }

    private function tooLarge(int $size): UploadRejectedException
    {
        return new UploadRejectedException(
            ErrorCode::UploadTooLarge,
            sprintf('The file is %d bytes; at most %d bytes are accepted.', $size, $this->maxBytes),
            ['max' => self::formatBytes($this->maxBytes)],
        );
    }

    private function notAnImage(string $reason): UploadRejectedException
    {
        return new UploadRejectedException(ErrorCode::UploadTypeNotAllowed, "Rejected: {$reason}.");
    }

    /** "5 MB", "512 KB", "1.5 MB" — for the user-facing message. */
    public static function formatBytes(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return self::trim($bytes / (1024 * 1024)) . ' MB';
        }
        if ($bytes >= 1024) {
            return self::trim($bytes / 1024) . ' KB';
        }

        return $bytes . ' B';
    }

    private static function formatMegapixels(int $pixels): string
    {
        return self::trim($pixels / 1_000_000);
    }

    private static function trim(float $value): string
    {
        return rtrim(rtrim(number_format(floor($value * 10) / 10, 1, '.', ''), '0'), '.');
    }
}
