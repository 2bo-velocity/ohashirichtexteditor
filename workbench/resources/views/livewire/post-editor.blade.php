<div>
    <input id="title" wire:model.live="title" placeholder="Title">

    @if ($mode === 'live')
        <x-ohashi-editor name="body" wire:model.live="body" />
    @elseif ($mode === 'blur')
        <x-ohashi-editor name="body" wire:model.blur="body" />
    @elseif ($mode === 'change')
        <x-ohashi-editor name="body" wire:model.change="body" />
    @else
        {{-- No name: a Livewire editor is not part of a form submission. --}}
        <x-ohashi-editor wire:model="body" />
    @endif

    @error('body') <p id="error">{{ $message }}</p> @enderror

    <button type="button" id="save" wire:click="save">Save</button>
    <button type="button" id="replace" wire:click="replaceBody">Replace</button>
    <button type="button" id="clear" wire:click="clearBody">Clear</button>
    <button type="button" id="refresh" wire:click="$refresh">Refresh</button>

    <pre id="server-body">{{ $body }}</pre>
    <pre id="saved">{{ $saved }}</pre>
    <span id="renders">{{ $renders }}</span>
    <span id="title-echo">{{ $title }}</span>
</div>
