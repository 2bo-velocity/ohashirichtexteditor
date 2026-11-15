<?php

declare(strict_types=1);

namespace OhashiEditor\Image;

/**
 * An uploaded image after it has been decoded and written out again: only
 * pixels survive the round trip — no metadata (EXIF, GPS position), no bytes
 * appended after the image data, nothing from the original file but the
 * picture.
 */
final readonly class ProcessedImage
{
    public function __construct(
        public string $contents,
        /** 'image/png', 'image/jpeg', 'image/gif' or 'image/webp' — determined from the content, never from the client. */
        public string $mimeType,
        /** 'png', 'jpg', 'gif' or 'webp', matching $mimeType. */
        public string $extension,
        public int $width,
        public int $height,
    ) {
    }

    /**
     * A name to store the file under: random, with the extension that matches
     * the content. The uploader's file name is never used (path traversal,
     * overwriting someone else's file, names that leak information).
     */
    public function randomFilename(): string
    {
        return bin2hex(random_bytes(16)) . '.' . $this->extension;
    }
}
