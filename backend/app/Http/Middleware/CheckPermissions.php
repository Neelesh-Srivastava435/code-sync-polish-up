
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckPermissions
{
    public function handle(Request $request, Closure $next, string $module, string $action)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Get user permissions
        $userPermission = $user->permission;
        
        if (!$userPermission || !$userPermission->permissions) {
            return response()->json(['message' => 'No permissions assigned'], 403);
        }

        $permissions = $userPermission->permissions;
        
        // Check if user has permission for the module and action
        if (!isset($permissions[$module]) || !isset($permissions[$module][$action]) || !$permissions[$module][$action]) {
            return response()->json([
                'message' => "You don't have permission to {$action} {$module}",
                'required_permission' => "{$module}.{$action}"
            ], 403);
        }

        return $next($request);
    }
}
