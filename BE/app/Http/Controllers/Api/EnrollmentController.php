<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\StudentProfile;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function index(Request $request)
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

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_profile_id' => ['required', 'exists:student_profiles,id'],
            'subject_ids' => ['required', 'array'],
            'subject_ids.*' => ['required', 'exists:subjects,id'],
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', 'max:20'],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation failed.', 422, $validator->errors()->toArray());
        }

        $enrollments = [];
        foreach ($request->subject_ids as $subjectId) {
            $enrollments[] = Enrollment::updateOrCreate([
                'student_profile_id' => $request->student_profile_id,
                'subject_id' => $subjectId,
                'school_year' => $request->school_year,
                'semester' => $request->semester,
            ], [
                'status' => 'enrolled',
                'assigned_by' => $request->user()->id,
            ]);
        }

        return ApiResponse::success($enrollments, 'Subjects assigned successfully.', 201);
    }
    
    public function update(Request $request, Enrollment $enrollment)
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(['enrolled', 'dropped', 'completed'])],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Validation failed.', 422, $validator->errors()->toArray());
        }

        $enrollment->update([
            'status' => $request->status,
        ]);

        return ApiResponse::success($enrollment, 'Enrollment updated successfully.');
    }

    public function destroy(Enrollment $enrollment)
    {
        $enrollment->delete();
        return ApiResponse::success(null, 'Enrollment deleted successfully.', 204);
    }
}
