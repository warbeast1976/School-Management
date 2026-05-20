<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Http\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RBAC guard: only users with one of the allowed roles may proceed.
 */
class EnsureUserRole
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Comma-separated role values (e.g. admin,student)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return ApiResponse::error('Unauthenticated.', null, 401);
        }

        if (! $user->is_active) {
            return ApiResponse::error('Your account has been deactivated.', null, 403);
        }

        $allowed = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $part) {
                $allowed[] = trim($part);
            }
        }
        $userRole = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;

        if (! in_array($userRole, $allowed, true)) {
            return ApiResponse::error('You do not have permission to access this resource.', null, 403);
        }

        return $next($request);
    }
}
