<?php

declare(strict_types=1);

namespace Workbench\App\Livewire;

use Illuminate\Contracts\View\View;
use Livewire\Component;
use OhashiEditor\HtmlSanitizer;

/**
 * The component the Livewire browser tests drive: an editor bound with
 * wire:model (deferred, .live or .blur), and actions that make the server
 * re-render, change the value, or fail validation.
 */
final class PostEditor extends Component
{
    public string $mode = 'deferred';

    public string $body = '<p>Hello</p>';

    public string $saved = '';

    public string $title = '';

    public int $renders = 0;

    public function save(HtmlSanitizer $sanitizer): void
    {
        $this->validate(['body' => 'required|max:2000']);
        $this->saved = $sanitizer->sanitize($this->body);
    }

    public function replaceBody(): void
    {
        $this->body = '<p>Set by the <strong>server</strong></p>';
    }

    public function clearBody(): void
    {
        $this->body = '';
    }

    public function render(): View
    {
        $this->renders++;

        return view('workbench::livewire.post-editor');
    }
}
