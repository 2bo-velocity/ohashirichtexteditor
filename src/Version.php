<?php

declare(strict_types=1);

namespace OhashiEditor;

/**
 * The single source of truth for the package version.
 *
 * Part of the framework-independent core: usable from plain PHP.
 *
 * composer.json deliberately carries no "version" field: Packagist derives the
 * version from the git tag, and a second declaration could only ever disagree
 * with the first. package.json mirrors this value, and the release script
 * refuses to publish when the two differ.
 */
final class Version
{
    public const string VERSION = '0.1.1';
}
