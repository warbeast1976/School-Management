<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()
            ->with('studentProfile')
            ->where('email', $request->validated('email'))
            ->first();

        if ($user === null || ! Hash::check($request->validated('password'), $user->password)) {
            return ApiResponse::error('Invalid email or password.', null, 401);
        }

        if (! $user->is_active) {
            return ApiResponse::error('Your account has been deactivated.', null, 403);
        }

        $deviceName = $request->validated('device_name') ?? 'api-client';
        $token = $user->createToken($deviceName)->plainTextToken;

        return ApiResponse::success([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => UserResource::make($user),
        ], 'Login successful.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('studentProfile');

        return ApiResponse::success([
            'user' => UserResource::make($user),
        ], 'Authenticated user retrieved.');
    }

    public function logout(Request $request): JsonResponse
    {
        // Revoke only the current token (safe for multi-device use)
        $request->user()->currentAccessToken()?->delete();

        return ApiResponse::success(null, 'Logged out successfully.');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        // Invalidate other tokens after password change (security best practice)
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();

        return ApiResponse::success(null, 'Password updated successfully.');
    }
}
