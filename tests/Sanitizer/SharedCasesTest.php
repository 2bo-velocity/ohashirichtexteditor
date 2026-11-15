<?php

declare(strict_types=1);

use OhashiEditor\HtmlSanitizer;

/*
 * The shared sanitiser cases, server side. The same file runs in tests/js
 * (happy-dom) and test/browser (Chrome), so the editor and the server agree on
 * what survives.
 *
 * Symfony serialises differently from a browser (<br />, &#34;) while meaning
 * the same thing, so both sides are compared after being re-read into a DOM.
 * libxml is fine for *that*: it only ever sees already-sanitised output and the
 * hand-written expectation, never attacker input.
 */
function canonicalHtml(string $html): string
{
    $doc = new DOMDocument();
    $doc->loadHTML(
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="root">' . $html . '</div></body></html>',
        LIBXML_NOERROR | LIBXML_NOWARNING,
    );
    $root = $doc->getElementById('root');
    $out = '';
    foreach ($root?->childNodes ?? [] as $child) {
        $out .= $doc->saveHTML($child);
    }

    return $out;
}

/** @return array<string, array{string, string}> */
function sharedSanitizerCases(): array
{
    $data = json_decode((string) file_get_contents(__DIR__ . '/../fixtures/sanitizer-cases.json'), true, 16, JSON_THROW_ON_ERROR);
    $cases = [];
    foreach ($data['cases'] as $case) {
        // Known parser differences, recorded with their reason in the fixture.
        if (isset($case['skipIn']['php'])) {
            continue;
        }
        $cases[$case['name']] = [$case['input'], $case['expected']];
    }

    return $cases;
}

it('sanitises like the browser side', function (string $input, string $expected): void {
    $actual = (new HtmlSanitizer())->sanitize($input);

    expect(canonicalHtml($actual))->toBe(canonicalHtml($expected));
})->with(sharedSanitizerCases());
