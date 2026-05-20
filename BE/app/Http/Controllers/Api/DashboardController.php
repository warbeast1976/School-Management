<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    public function admin(): JsonResponse
    {
        return ApiResponse::success(
            $this->dashboardService->adminStats(),
            'Dashboard statistics retrieved.'
        );
    }
}
