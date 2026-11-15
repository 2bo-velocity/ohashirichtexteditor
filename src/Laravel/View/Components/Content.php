<?php

declare(strict_types=1);

namespace OhashiEditor\Laravel\View\Components;

use Illuminate\Contracts\View\View;
use Illuminate\View\Component;
use OhashiEditor\HtmlSanitizer;
use Stringable;

/**
 * <x-ohashi-content :html="$post->body" class="prose" />
 *
 * Outputs saved editor HTML, sanitised at output time — always, whatever is
 * stored. The wrapper carries .orte-rendered-content and no styles of its own,
 * so the site's typography (e.g. Tailwind's `prose`) applies unchanged.
 */
final class Content extends Component
{
    public readonly string $sanitized;

    public function __construct(HtmlSanitizer $sanitizer, string|Stringable|null $html = null)
    {
        $this->sanitized = $html === null ? '' : $sanitizer->sanitize((string) $html);
    }

    public function render(): View
    {
        return view('ohashi-editor::components.content');
    }
}
