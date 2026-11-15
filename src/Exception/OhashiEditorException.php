<?php

declare(strict_types=1);

namespace OhashiEditor\Exception;

use OhashiEditor\ErrorCode;
use Throwable;

/** Implemented by every exception this package throws. */
interface OhashiEditorException extends Throwable
{
    public function errorCode(): ErrorCode;
}
