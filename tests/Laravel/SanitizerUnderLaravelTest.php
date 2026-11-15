<?php

declare(strict_types=1);

use OhashiEditor\HtmlSanitizer;

/*
 * PHP 8.4's HTML5 parser raises a warning for every parse error ("tree error
 * unexpected-closed-token"), and Laravel turns warnings into exceptions. Symfony
 * suppresses them with @; this pins that down under Laravel's real error
 * handler, because a regression would turn every slightly broken paste into a
 * 500 on save.
 */
it('does not turn parser warnings into exceptions under Laravel', function (string $html): void {
    $handler = set_error_handler(static fn () => false);
    restore_error_handler();
    expect($handler)->not->toBeNull('Laravel\'s error handler should be installed');

    expect((new HtmlSanitizer())->sanitize($html))->toBeString();
})->with([
    'unclosed block' => ['<p>a<div>b</div>c</p>'],
    'misnested' => ['<p><b>1<i>2</b>3</i></p>'],
    'stray end tags' => ['</p></div></b>text'],
    'garbage' => ['<<<>>><p <x="'],
]);
