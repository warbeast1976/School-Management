<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subjects\BulkDeleteSubjectsRequest;
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

        if ($request->has('page') || $request->user()->isAdmin()) {
            $perPage = min($request->integer('per_page', 15), 100);
            $paginator = $query->paginate($perPage)->withQueryString();

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

    public function bulkDestroy(BulkDeleteSubjectsRequest $request): JsonResponse
    {
        $ids = $request->validated('ids');
        $deleted = [];
        $failed = [];

        foreach (Subject::query()->whereIn('id', $ids)->get() as $subject) {
            if ($subject->gradeRecords()->exists()) {
                $failed[] = [
                    'id' => $subject->id,
                    'code' => $subject->code,
                    'message' => 'Cannot delete subject with existing grade records.',
                ];

                continue;
            }

            $subject->delete();
            $deleted[] = $subject->id;
        }

        $message = count($deleted) > 0
            ? count($deleted).' subject(s) deleted.'
            : 'No subjects were deleted.';

        return ApiResponse::success([
            'deleted' => $deleted,
            'failed' => $failed,
        ], $message);
    }
}
