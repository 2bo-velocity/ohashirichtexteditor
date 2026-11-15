<?php

declare(strict_types=1);

// The core (everything outside OhashiEditor\Laravel) must run in plain PHP:
// Laravel is an optional integration, not a dependency. Anything the core
// needs from a framework belongs in the bridge, which calls into the core.
arch('the core does not depend on Laravel')
    ->expect('OhashiEditor')
    ->not->toUse(['Illuminate', 'Laravel', 'Orchestra'])
    ->ignoring(['OhashiEditor\Laravel', 'OhashiEditor\Tests']);

arch('the core uses strict types')
    ->expect('OhashiEditor')
    ->toUseStrictTypes()
    ->ignoring('OhashiEditor\Tests');
