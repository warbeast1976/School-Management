<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Enrollments\StoreEnrollmentRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Enrollment::with(['studentProfile.user', 'subject', 'assignedBy']);

        if ($request->has('student_profile_id')) {
            $query->where('student_profile_id', $request->student_profile_id);
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        $enrollments = $query->orderBy('created_at', 'desc')->get();

        return ApiResponse::success($enrollments, 'Enrollments retrieved successfully.');
    }

    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $enrollments = [];

        foreach ($data['subject_ids'] as $subjectId) {
            $enrollments[] = Enrollment::updateOrCreate([
                'student_profile_id' => $data['student_profile_id'],
                'subject_id' => $subjectId,
                'school_year' => $data['school_year'],
                'semester' => $data['semester'],
            ], [
                'status' => 'enrolled',
                'assigned_by' => $request->user()->id,
            ]);
        }

        return ApiResponse::success($enrollments, 'Subjects assigned successfully.', 201);
    }

    public function update(Request $request, Enrollment $enrollment): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(['enrolled', 'dropped', 'completed'])],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation failed.', $validator->errors()->toArray(), 422);
        }

        $enrollment->update([
            'status' => $request->status,
        ]);

        return ApiResponse::success($enrollment, 'Enrollment updated successfully.');
    }

    public function destroy(Enrollment $enrollment): JsonResponse
    {
        $enrollment->delete();

        return ApiResponse::success(null, 'Enrollment deleted successfully.');
    }
}
