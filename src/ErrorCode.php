<?php

declare(strict_types=1);

namespace OhashiEditor;

/**
 * Error codes, shared with the browser side. One case per entry in the code
 * registry; a code once assigned is never reused.
 *
 * Codes tell developers and support *where* something failed. They are not the
 * message an end user reads: user-facing text is localised in the editor and
 * looked up by code.
 */
enum ErrorCode: string
{
    // Configuration and API misuse
    case UnknownToolbarItem = 'OE-CFG-1001';
    case UnsupportedLocale = 'OE-CFG-1002';
    case ImageWithoutUploadUrl = 'OE-CFG-1003';
    case InvalidIconDefinition = 'OE-CFG-1004';
    case InvalidLocaleDefinition = 'OE-CFG-1005';
    case InvalidAllowlist = 'OE-CFG-1006';
    case ImageLibraryMissing = 'OE-CFG-1007';
    case InvalidUploadLimits = 'OE-CFG-1008';

    // Form integration
    case MissingName = 'OE-FRM-2001';

    // Sanitising
    case UnparsableHtml = 'OE-SAN-3001';
    case InputTooLong = 'OE-SAN-3002';

    // Uploads
    case UploadTooLarge = 'OE-UPL-4001';
    case UploadTypeNotAllowed = 'OE-UPL-4002';
    case UploadNetworkError = 'OE-UPL-4003';
    case UploadUnauthorized = 'OE-UPL-4004';
    case UploadServerError = 'OE-UPL-4005';
    case UploadDimensionsTooLarge = 'OE-UPL-4006';
    case UploadRateLimited = 'OE-UPL-4007';
    case UploadFailed = 'OE-UPL-4900';

    // HTML lint
    case LintUnclosedTag = 'OE-LNT-5001';
    case LintMisnestedTag = 'OE-LNT-5002';
    case LintStrayClosingTag = 'OE-LNT-5003';

    // Unexpected
    case Internal = 'OE-CORE-9001';
}
