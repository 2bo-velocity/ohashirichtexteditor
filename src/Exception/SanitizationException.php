<?php

declare(strict_types=1);

namespace OhashiEditor\Exception;

use RuntimeException;

final class SanitizationException extends RuntimeException implements OhashiEditorException
{
    use CodedException;
}
