<?php

declare(strict_types=1);

namespace OhashiEditor\Image;

/**
 * Reads the EXIF orientation of a JPEG without ext-exif.
 *
 * Cameras and phones store the picture as the sensor saw it and record the
 * rotation in EXIF. Re-encoding drops EXIF (on purpose: it can hold the GPS
 * position), so the rotation has to be applied to the pixels first, or every
 * portrait photo from a phone would come out sideways.
 *
 * @internal
 */
final class JpegOrientation
{
    /** 1–8 as defined by EXIF; 1 (as stored) when absent or unreadable. */
    public static function read(string $jpeg): int
    {
        $length = strlen($jpeg);
        if ($length < 4 || substr($jpeg, 0, 2) !== "\xFF\xD8") {
            return 1;
        }

        $offset = 2;
        while ($offset + 4 <= $length) {
            if ($jpeg[$offset] !== "\xFF") {
                return 1;
            }
            $marker = ord($jpeg[$offset + 1]);
            // Start of scan: the image data follows, no more metadata.
            if ($marker === 0xDA || $marker === 0xD9) {
                return 1;
            }
            $segmentLength = self::u16($jpeg, $offset + 2, false);
            if ($segmentLength < 2 || $offset + 2 + $segmentLength > $length) {
                return 1;
            }
            if ($marker === 0xE1 && substr($jpeg, $offset + 4, 6) === "Exif\0\0") {
                return self::fromTiff(substr($jpeg, $offset + 10, $segmentLength - 8));
            }
            $offset += 2 + $segmentLength;
        }

        return 1;
    }

    private static function fromTiff(string $tiff): int
    {
        $order = substr($tiff, 0, 2);
        if ($order !== 'II' && $order !== 'MM') {
            return 1;
        }
        $little = $order === 'II';
        if (strlen($tiff) < 8 || self::u16($tiff, 2, $little) !== 42) {
            return 1;
        }

        $ifd = self::u32($tiff, 4, $little);
        if ($ifd + 2 > strlen($tiff)) {
            return 1;
        }
        $entries = self::u16($tiff, $ifd, $little);
        for ($i = 0; $i < $entries; $i++) {
            $entry = $ifd + 2 + $i * 12;
            if ($entry + 12 > strlen($tiff)) {
                return 1;
            }
            // Tag 0x0112 (Orientation), type SHORT, one value stored inline.
            if (self::u16($tiff, $entry, $little) === 0x0112) {
                $value = self::u16($tiff, $entry + 8, $little);

                return $value >= 1 && $value <= 8 ? $value : 1;
            }
        }

        return 1;
    }

    private static function u16(string $bytes, int $at, bool $little): int
    {
        /** @var array{1: int} $v */
        $v = unpack($little ? 'v' : 'n', $bytes, $at);

        return $v[1];
    }

    private static function u32(string $bytes, int $at, bool $little): int
    {
        /** @var array{1: int} $v */
        $v = unpack($little ? 'V' : 'N', $bytes, $at);

        return $v[1];
    }
}
