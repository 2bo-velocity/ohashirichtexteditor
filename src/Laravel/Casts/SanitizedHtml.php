<?php

declare(strict_types=1);

namespace OhashiEditor\Laravel\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use OhashiEditor\HtmlSanitizer;

/**
 * protected function casts(): array { return ['body' => SanitizedHtml::class]; }
 *
 * Sanitises the editor's HTML on its way into the model, so what reaches the
 * database is already clean. Reading returns the stored string unchanged;
 * output is sanitised again by <x-ohashi-content>, because rows written before
 * the cast existed — or straight to the database — never passed through here.
 *
 * Too-large input throws SanitizationException (OE-SAN-3002) rather than being
 * cut short. Validate the length in your form request to give users a proper
 * message; the exception is the backstop.
 *
 * @implements CastsAttributes<string|null, string|null>
 */
final class SanitizedHtml implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : (string) $value;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return app(HtmlSanitizer::class)->sanitize((string) $value);
    }
}
