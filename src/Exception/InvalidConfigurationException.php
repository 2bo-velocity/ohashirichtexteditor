<?php

declare(strict_types=1);

namespace OhashiEditor\Exception;

use InvalidArgumentException;

final class InvalidConfigurationException extends InvalidArgumentException implements OhashiEditorException
{
    use CodedException;
}
