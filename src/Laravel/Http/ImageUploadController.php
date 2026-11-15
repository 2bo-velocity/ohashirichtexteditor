<?php

declare(strict_types=1);

namespace OhashiEditor\Laravel\Http;

use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Contracts\Filesystem\Factory as Filesystems;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use OhashiEditor\ErrorCode;
use OhashiEditor\Exception\UploadRejectedException;
use OhashiEditor\Image\ImageProcessor;
use Throwable;

/**
 * POST (multipart, field "image") → 201 { "url": "…" }.
 *
 * All checking and re-encoding happens in the core (ImageProcessor); this
 * class only takes the file out of the request and stores the result.
 *
 * Failures answer with a code and never with text: the editor turns the code
 * into a message in its own UI language.
 *   422 { "code": "OE-UPL-4001", "params": { "max": "5 MB" } }   the user can act on it
 *   500 { "code": "OE-UPL-4900" }                                 anything else (logged, details not sent)
 */
final class ImageUploadController
{
    public function __invoke(Request $request, ImageProcessor $processor, Filesystems $filesystems, Config $config): JsonResponse
    {
        $file = $request->file('image');
        if (! $file instanceof UploadedFile) {
            return self::failure(422, ErrorCode::UploadFailed);
        }
        if (! $file->isValid()) {
            // PHP refused the upload before it reached us (upload_max_filesize).
            return in_array($file->getError(), [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
                ? self::failure(422, ErrorCode::UploadTooLarge, ['max' => ImageProcessor::formatBytes(self::effectiveMaxBytes($processor->maxBytes()))])
                : self::failure(422, ErrorCode::UploadFailed);
        }

        try {
            $image = $processor->processFile($file->getRealPath() ?: $file->getPathname());
        } catch (UploadRejectedException $e) {
            return self::failure(422, $e->errorCode(), $e->params());
        }

        try {
            $disk = $filesystems->disk((string) $config->get('ohashi-editor.uploads.disk'));
            $directory = trim((string) $config->get('ohashi-editor.uploads.directory', ''), '/');
            $path = ltrim($directory . '/' . $image->randomFilename(), '/');
            if (! $disk->put($path, $image->contents, ['visibility' => 'public'])) {
                throw new \RuntimeException("Could not write {$path}.");
            }
            $url = (bool) $config->get('ohashi-editor.uploads.relative_urls', true)
                ? self::relativeToApp($disk->url($path), (string) $config->get('app.url', ''))
                : $disk->url($path);
        } catch (Throwable $e) {
            report($e);

            return self::failure(500, ErrorCode::UploadFailed);
        }

        return new JsonResponse(['url' => $url], 201);
    }

    /**
     * "https://example.com/storage/x.png" → "/storage/x.png" when the file is
     * served by the app itself (same scheme, host and port as app.url).
     *
     * The URL goes into the saved HTML. Absolute, it ties every post to the
     * host it was written on: the images break after a domain change, in a
     * copy of the database on staging, and in development whenever APP_URL
     * is not the address in the browser (the default `public` disk builds
     * its URLs from APP_URL — found with `php artisan serve` on 127.0.0.1 and
     * APP_URL=http://localhost:8000). Files on another host (S3, a CDN) keep
     * their absolute URL.
     */
    public static function relativeToApp(string $url, string $appUrl): string
    {
        $file = parse_url($url);
        $app = parse_url($appUrl);
        if ($file === false || $app === false || ! isset($file['host'], $app['host'])) {
            return $url;
        }
        $origin = static fn (array $u): string => strtolower(($u['scheme'] ?? '') . '://' . $u['host'] . ':' . ($u['port'] ?? ''));
        if ($origin($file) !== $origin($app)) {
            return $url;
        }

        return ($file['path'] ?? '/') . (isset($file['query']) ? '?' . $file['query'] : '');
    }

    /**
     * The limit an upload actually meets: the package's own, or PHP's
     * upload_max_filesize / post_max_size when those are lower.
     */
    public static function effectiveMaxBytes(int $configured): int
    {
        $php = (int) UploadedFile::getMaxFilesize();

        return $php > 0 ? min($php, $configured) : $configured;
    }

    /** @param array<string, string|int> $params */
    private static function failure(int $status, ErrorCode $code, array $params = []): JsonResponse
    {
        return new JsonResponse($params === [] ? ['code' => $code->value] : ['code' => $code->value, 'params' => $params], $status);
    }
}
