<?php

declare(strict_types=1);

namespace OhashiEditor\Exception;

use OhashiEditor\ErrorCode;
use RuntimeException;
use Throwable;

/**
 * An upload refused for a reason the person uploading may be told: too large,
 * not an image, too many pixels. The HTTP layer turns it into
 * `422 { "code": "OE-UPL-…", "params": { … } }`; the editor builds the
 * localised message from the code. Never put internal details in `params`.
 */
final class UploadRejectedException extends RuntimeException implements OhashiEditorException
{
    use CodedException {
        CodedException::__construct as private initialise;
    }

    /** @var array<string, string|int> */
    private array $params;

    /**
     * @param array<string, string|int> $params values for the message placeholders, e.g. ['max' => '5 MB']
     */
    public function __construct(ErrorCode $code, string $message, array $params = [], ?Throwable $previous = null)
    {
        $this->initialise($code, $message, $previous);
        $this->params = $params;
    }

    /** @return array<string, string|int> */
    public function params(): array
    {
        return $this->params;
    }
}
