<?php

declare(strict_types=1);

namespace OhashiEditor\Exception;

use OhashiEditor\ErrorCode;
use Throwable;

/**
 * Shared implementation: the message is for developers and logs, in English,
 * prefixed with the code ("[OE-SAN-3002] …") so it can be found in any log.
 *
 * @internal
 */
trait CodedException
{
    private ErrorCode $errorCode;

    public function __construct(ErrorCode $code, string $message, ?Throwable $previous = null)
    {
        $this->errorCode = $code;
        parent::__construct(sprintf('[%s] %s', $code->value, $message), 0, $previous);
    }

    public function errorCode(): ErrorCode
    {
        return $this->errorCode;
    }
}
