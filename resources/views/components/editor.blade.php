<ohashi-rich-text-editor
    @if ($name !== '') name="{{ $name }}" @endif
    value="{{ $value ?? '' }}"
    html-lint="{{ $htmlLint ? 'true' : 'false' }}"
    @if ($resolvedLocale !== null) locale="{{ $resolvedLocale }}" @endif
    @if ($resolvedToolbar !== null) toolbar="{{ $resolvedToolbar }}" @endif
    @if ($resolvedUploadUrl !== null) upload-url="{{ $resolvedUploadUrl }}" @endif
    @if ($uploadMaxSize !== null) upload-max-size="{{ $uploadMaxSize }}" @endif
    {{ $attributes }}
></ohashi-rich-text-editor>
