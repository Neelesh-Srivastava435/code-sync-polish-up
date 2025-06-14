
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/admin.php'));
            
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/batch.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/venue.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/partner.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/member.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/program.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/amenities.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/attendance.php'));
                
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/activity-logs.php'));
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'check.permissions' => \App\Http\Middleware\CheckPermissions::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
