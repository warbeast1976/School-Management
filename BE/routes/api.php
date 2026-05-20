<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\GradeRecordController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Responses\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ApiResponse::success([
        'service' => config('app.name'),
        'environment' => config('app.env'),
    ], 'API is running.');
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/subjects', [SubjectController::class, 'index']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);
        
        Route::get('/dashboard', [DashboardController::class, 'admin']);
        Route::get('/export/students', [ExportController::class, 'students']);
        Route::get('/export/grade-records', [ExportController::class, 'gradeRecords']);
    });

    Route::get('/students/me', [StudentController::class, 'me'])
        ->middleware('role:student');

    Route::get('/students', [StudentController::class, 'index'])
        ->middleware('role:admin');
    Route::post('/students', [StudentController::class, 'store'])
        ->middleware('role:admin');
    Route::get('/students/{studentProfile}', [StudentController::class, 'show'])
        ->middleware('role:admin,student');
    Route::put('/students/{studentProfile}', [StudentController::class, 'update'])
        ->middleware('role:admin');
    Route::delete('/students/{studentProfile}', [StudentController::class, 'destroy'])
        ->middleware('role:admin');

    Route::get('/grade-records', [GradeRecordController::class, 'index'])
        ->middleware('role:admin,student');
    Route::get('/grade-records/{gradeRecord}', [GradeRecordController::class, 'show'])
        ->middleware('role:admin,student');
    Route::post('/grade-records', [GradeRecordController::class, 'store'])
        ->middleware('role:admin');
    Route::put('/grade-records/{gradeRecord}', [GradeRecordController::class, 'update'])
        ->middleware('role:admin');
    Route::delete('/grade-records/{gradeRecord}', [GradeRecordController::class, 'destroy'])
        ->middleware('role:admin');
});
