<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $mode }}</title>
    <script type="module" src="/ohashi-editor.js"></script>
    @livewireStyles
</head>
<body>
    <nav><a id="other" href="/livewire/other" wire:navigate>Other page</a> <a id="back" href="/livewire/{{ $mode }}" wire:navigate>Back</a></nav>
    <livewire:post-editor :mode="$mode" />
    @livewireScripts
</body>
</html>
