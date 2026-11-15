<?php

declare(strict_types=1);

use OhashiEditor\ErrorCode;
use OhashiEditor\Exception\InvalidConfigurationException;
use OhashiEditor\Exception\OhashiEditorException;
use OhashiEditor\Exception\SanitizationException;
use OhashiEditor\HtmlSanitizer;
use OhashiEditor\Sanitizer\Allowlist;
use Symfony\Component\HtmlSanitizer\Reference\W3CReference;

it('rejects oversized input instead of truncating it', function (): void {
    // Symfony's default would silently keep the first 20,000 bytes.
    $sanitizer = new HtmlSanitizer(maxInputBytes: 100);

    expect(fn () => $sanitizer->sanitize('<p>' . str_repeat('a', 200) . '</p>'))
        ->toThrow(SanitizationException::class, '[OE-SAN-3002]');
});

it('keeps long articles whole under the default limit', function (): void {
    $body = '<p>' . str_repeat('あ', 30_000) . '</p>'; // 90 KB, past Symfony's default

    expect((new HtmlSanitizer())->sanitize($body))->toBe($body);
});

it('exposes the error code on its exceptions', function (): void {
    try {
        (new HtmlSanitizer(maxInputBytes: 1))->sanitize('<p>ab</p>');
    } catch (OhashiEditorException $e) {
        expect($e->errorCode())->toBe(ErrorCode::InputTooLong);

        return;
    }
    test()->fail('no exception thrown');
});

it('classifies every standard element in the allowlist', function (): void {
    // An element missing from allow/unwrap/drop would be dropped with its
    // content — silently losing text. Every element Symfony knows must be
    // classified on purpose.
    $allowlist = Allowlist::default();
    $classified = [...array_keys($allowlist->allow), ...$allowlist->unwrap, ...$allowlist->drop];
    $standard = [...array_keys(W3CReference::BODY_ELEMENTS), ...array_keys(W3CReference::HEAD_ELEMENTS)];

    expect(array_values(array_diff($standard, $classified)))->toBe([]);
});

it('does not classify an element twice', function (): void {
    $allowlist = Allowlist::default();
    $all = [...array_keys($allowlist->allow), ...$allowlist->unwrap, ...$allowlist->drop];

    expect(array_values(array_unique(array_diff_assoc($all, array_unique($all)))))->toBe([]);
});

it('fails fast on a broken allowlist file', function (): void {
    $file = tempnam(sys_get_temp_dir(), 'allowlist');
    file_put_contents($file, '{"allow": {}}');

    expect(fn () => Allowlist::fromFile($file))->toThrow(InvalidConfigurationException::class, '[OE-CFG-1006]');
    unlink($file);
});
