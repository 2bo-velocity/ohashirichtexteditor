<?php

declare(strict_types=1);

namespace OhashiEditor;

use OhashiEditor\Exception\SanitizationException;
use OhashiEditor\Sanitizer\Allowlist;
use OhashiEditor\Sanitizer\AllowlistAttributeSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer as SymfonySanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * The server-side sanitiser: the last line of defence. Run it when saving the
 * editor's HTML and again when outputting it.
 *
 *     $clean = (new HtmlSanitizer())->sanitize($_POST['body']);
 *
 * Parsing is done by symfony/html-sanitizer 8 with PHP 8.4's native HTML5
 * parser (Dom\HTMLDocument) — the same tree-building rules browsers use — not
 * libxml's HTML 4 parser: a sanitiser that reads HTML differently from the
 * browser can be bypassed through that difference. This is why the package
 * requires PHP 8.4.
 *
 * Framework-independent: usable from plain PHP. Laravel users get it through
 * the SanitizedHtml cast and <x-ohashi-content>.
 */
final class HtmlSanitizer
{
    /** 2 MiB. Symfony's own default (20,000 bytes) would cut long articles short. */
    public const DEFAULT_MAX_INPUT_BYTES = 2 * 1024 * 1024;

    private readonly SymfonySanitizer $sanitizer;

    public function __construct(
        private readonly int $maxInputBytes = self::DEFAULT_MAX_INPUT_BYTES,
        ?Allowlist $allowlist = null,
    ) {
        $allowlist ??= Allowlist::default();

        $config = (new HtmlSanitizerConfig())
            ->allowLinkSchemes($allowlist->linkSchemes)
            ->allowRelativeLinks()
            // data: is admitted here and narrowed to raster images by
            // AllowlistAttributeSanitizer.
            ->allowMediaSchemes([...$allowlist->mediaSchemes, 'data'])
            ->allowRelativeMedias()
            ->withAttributeSanitizer(new AllowlistAttributeSanitizer($allowlist))
            // Length is enforced in sanitize() instead: Symfony truncates
            // silently, which loses the end of an article without a word.
            ->withMaxInputLength(-1);

        foreach ($allowlist->allow as $element => $attributes) {
            $config = $config->allowElement($element, $attributes);
        }
        foreach ($allowlist->unwrap as $element) {
            $config = $config->blockElement($element);
        }
        foreach ($allowlist->drop as $element) {
            $config = $config->dropElement($element);
        }
        foreach ($allowlist->forcedAttributes as $element => $attributes) {
            foreach ($attributes as $attribute => $value) {
                $config = $config->forceAttribute($element, $attribute, $value);
            }
        }

        $this->sanitizer = new SymfonySanitizer($config);
    }

    /**
     * @throws SanitizationException OE-SAN-3002 when the input exceeds the
     *         configured size. Rejecting is deliberate: truncating would save
     *         part of the user's text and silently discard the rest.
     */
    public function sanitize(string $html): string
    {
        if (strlen($html) > $this->maxInputBytes) {
            throw new SanitizationException(
                ErrorCode::InputTooLong,
                sprintf('HTML of %d bytes exceeds the limit of %d bytes.', strlen($html), $this->maxInputBytes),
            );
        }

        return $this->sanitizer->sanitize($html);
    }
}
