<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Standard API envelope per project security/architecture rules.
 */
final class ApiResponse
{
    public static function success(
        mixed $data = null,
        string $message = 'OK',
        int $status = 200
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => self::normalizeData($data),
            'message' => $message,
            'errors' => null,
        ], $status);
    }

    public static function error(
        string $message,
        ?array $errors = null,
        int $status = 400,
        mixed $data = null
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'data' => self::normalizeData($data),
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    private static function normalizeData(mixed $data): mixed
    {
        if ($data instanceof JsonResource || $data instanceof ResourceCollection) {
            return $data->resolve();
        }

        return $data;
    }
}
