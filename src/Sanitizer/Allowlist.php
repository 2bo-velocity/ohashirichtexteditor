<?php

declare(strict_types=1);

namespace OhashiEditor\Sanitizer;

use JsonException;
use OhashiEditor\ErrorCode;
use OhashiEditor\Exception\InvalidConfigurationException;

/**
 * What the editor's HTML may contain. Read from resources/allowlist.json —
 * the same file the browser-side sanitiser is built from, so the two cannot
 * drift apart.
 */
final readonly class Allowlist
{
    /**
     * @param array<string, list<string>>                $allow             element => allowed attributes
     * @param list<string>                               $unwrap            removed, content kept
     * @param list<string>                               $drop              removed with content
     * @param array<string, array<string, string>>       $attributePatterns element => attribute => regex
     * @param array<string, array<string, string>>       $forcedAttributes  element => attribute => value
     * @param list<string>                               $linkSchemes
     * @param list<string>                               $mediaSchemes
     * @param list<string>                               $dataImageTypes    raster subtypes allowed in data: image URLs
     */
    public function __construct(
        public array $allow,
        public array $unwrap,
        public array $drop,
        public array $attributePatterns,
        public array $forcedAttributes,
        public array $linkSchemes,
        public array $mediaSchemes,
        public array $dataImageTypes,
    ) {
        foreach ($attributePatterns as $element => $patterns) {
            foreach ($patterns as $attribute => $pattern) {
                if (@preg_match(self::regex($pattern), '') === false) {
                    throw new InvalidConfigurationException(
                        ErrorCode::InvalidAllowlist,
                        sprintf('Invalid pattern for %s[%s]: %s', $element, $attribute, $pattern),
                    );
                }
            }
        }
    }

    public static function default(): self
    {
        return self::fromFile(__DIR__ . '/../../resources/allowlist.json');
    }

    public static function fromFile(string $path): self
    {
        $json = @file_get_contents($path);
        if ($json === false) {
            throw new InvalidConfigurationException(ErrorCode::InvalidAllowlist, "Cannot read allowlist: {$path}");
        }

        try {
            /** @var array<string, mixed> $data */
            $data = json_decode($json, true, 16, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new InvalidConfigurationException(ErrorCode::InvalidAllowlist, "Allowlist is not valid JSON: {$path}", $e);
        }

        foreach (['allow', 'unwrap', 'drop', 'attributePatterns', 'forcedAttributes', 'linkSchemes', 'mediaSchemes', 'dataImageTypes'] as $key) {
            if (!isset($data[$key]) || !is_array($data[$key])) {
                throw new InvalidConfigurationException(ErrorCode::InvalidAllowlist, "Allowlist is missing \"{$key}\": {$path}");
            }
        }

        /** @phpstan-ignore argument.type */
        return new self(
            $data['allow'],
            $data['unwrap'],
            $data['drop'],
            $data['attributePatterns'],
            $data['forcedAttributes'],
            $data['linkSchemes'],
            $data['mediaSchemes'],
            $data['dataImageTypes'],
        );
    }

    /** The JSON patterns are ECMAScript-compatible source; wrap them for PCRE. */
    public static function regex(string $pattern): string
    {
        return '/' . str_replace('/', '\/', $pattern) . '/u';
    }
}
