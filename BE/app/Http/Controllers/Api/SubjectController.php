<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubjectResource;
use App\Http\Responses\ApiResponse;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subject::query()->orderBy('code');

        if ($request->boolean('active_only', false) || $request->user()->role === 'student') {
            $query->where('is_active', true);
        }

        // Apply pagination for admin view
        if ($request->has('page')) {
            $perPage = $request->integer('per_page', 15);
            $paginator = $query->paginate($perPage);

            return ApiResponse::success([
                'items' => SubjectResource::collection($paginator->items()),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ]
            ], 'Subjects retrieved.');
        }

        return ApiResponse::success(
            SubjectResource::collection($query->get()),
            'Subjects retrieved.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:subjects',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'units' => 'required|integer|min:1|max:10',
            'is_active' => 'boolean',
        ]);

        $subject = Subject::create($validated);

        return ApiResponse::success(
            new SubjectResource($subject),
            'Subject created successfully.',
            201
        );
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:20|unique:subjects,code,' . $subject->id,
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'units' => 'sometimes|required|integer|min:1|max:10',
            'is_active' => 'boolean',
        ]);

        $subject->update($validated);

        return ApiResponse::success(
            new SubjectResource($subject),
            'Subject updated successfully.'
        );
    }

    public function destroy(Subject $subject): JsonResponse
    {
        if ($subject->gradeRecords()->exists()) {
            return ApiResponse::error('Cannot delete subject with existing grade records.', 422);
        }

        $subject->delete();

        return ApiResponse::success(null, 'Subject deleted successfully.');
    }
}
