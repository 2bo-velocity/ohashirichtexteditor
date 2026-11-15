<?php

declare(strict_types=1);

namespace OhashiEditor\Tests;

use OhashiEditor\Laravel\OhashiEditorServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [OhashiEditorServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        // Sessions (and with them the upload route's "web" middleware) need one.
        $app['config']->set('app.key', 'base64:' . base64_encode(str_repeat('k', 32)));
    }
}
