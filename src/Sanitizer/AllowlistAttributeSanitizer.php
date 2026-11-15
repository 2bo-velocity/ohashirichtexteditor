<?php

declare(strict_types=1);

namespace OhashiEditor\Sanitizer;

use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\Visitor\AttributeSanitizer\AttributeSanitizerInterface;

/**
 * The checks symfony/html-sanitizer has no setting for:
 *
 * - attribute values must match the allowlist's pattern (target="_blank"
 *   only, width as a number or percentage, small colspan/rowspan);
 * - a data: URL in img[src] must be a raster image. Symfony allows the data:
 *   scheme as a whole, which would let data:image/svg+xml — able to carry
 *   script — through.
 *
 * It runs after Symfony's own URL sanitiser; returning null drops the attribute.
 *
 * @internal
 */
final class AllowlistAttributeSanitizer implements AttributeSanitizerInterface
{
    public function __construct(private readonly Allowlist $allowlist)
    {
    }

    public function getSupportedElements(): ?array
    {
        return null;
    }

    public function getSupportedAttributes(): ?array
    {
        return null;
    }

    public function sanitizeAttribute(string $element, string $attribute, string $value, HtmlSanitizerConfig $config): ?string
    {
        $pattern = $this->allowlist->attributePatterns[$element][$attribute] ?? null;
        if ($pattern !== null && preg_match(Allowlist::regex($pattern), $value) !== 1) {
            return null;
        }

        if ($element === 'img' && $attribute === 'src' && preg_match('/^\s*data:/i', $value) === 1) {
            return $this->isRasterDataUrl($value) ? $value : null;
        }

        return $value;
    }

    private function isRasterDataUrl(string $value): bool
    {
        $types = implode('|', array_map(static fn (string $t): string => preg_quote($t, '/'), $this->allowlist->dataImageTypes));

        return preg_match('/^data:image\/(?:' . $types . ');base64,[a-z0-9+\/=\s]+$/i', trim($value)) === 1;
    }
}
