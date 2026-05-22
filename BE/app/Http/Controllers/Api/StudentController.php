<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Students\StoreStudentRequest;
use App\Http\Requests\Students\UpdateMyStudentProfileRequest;
use App\Http\Requests\Students\UpdateStudentRequest;
use App\Http\Resources\StudentProfileResource;
use App\Http\Responses\ApiResponse;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private readonly StudentService $studentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = StudentProfile::query()
            ->with('user')
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($search = $request->query('search')) {
            $term = '%'.addcslashes($search, '%_').'%';
            $query->where(function ($q) use ($term) {
                $q->where('student_number', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', $term));
            });
        }

        if ($gradeLevel = $request->query('grade_level')) {
            $query->where('grade_level', $gradeLevel);
        }

        if ($request->filled('enrollment_status')) {
            $query->where('enrollment_status', $request->query('enrollment_status'));
        }

        $perPage = min((int) $request->query('per_page', 15), 100);
        $students = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'items' => StudentProfileResource::collection($students->items()),
            'pagination' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
        ], 'Students retrieved.');
    }

    public function me(Request $request): JsonResponse
    {
        $profile = $this->resolveOwnProfile($request);

        if ($profile === null) {
            return ApiResponse::error('Student profile not found.', null, 404);
        }

        return ApiResponse::success(
            StudentProfileResource::make($profile),
            'Your profile was retrieved.'
        );
    }

    public function updateMe(UpdateMyStudentProfileRequest $request): JsonResponse
    {
        $profile = $this->resolveOwnProfile($request);

        if ($profile === null) {
            return ApiResponse::error('Student profile not found.', null, 404);
        }

        $student = $this->studentService->updateOwnProfile(
            $profile,
            $request->safe()->except(['photo']),
            $request->file('photo')
        );

        return ApiResponse::success(
            StudentProfileResource::make($student),
            'Your profile was updated successfully.'
        );
    }

    public function show(Request $request, StudentProfile $studentProfile): JsonResponse
    {
        if (! $this->canAccessStudent($request->user(), $studentProfile)) {
            return ApiResponse::error('You do not have permission to view this student.', null, 403);
        }

        $studentProfile->load(['user', 'gradeRecords.subject']);

        return ApiResponse::success(
            StudentProfileResource::make($studentProfile),
            'Student retrieved.'
        );
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $student = $this->studentService->create(
            $request->safe()->except(['photo']),
            $request->file('photo')
        );

        return ApiResponse::success(
            StudentProfileResource::make($student),
            'Student created successfully.',
            201
        );
    }

    public function update(UpdateStudentRequest $request, StudentProfile $studentProfile): JsonResponse
    {
        $student = $this->studentService->update(
            $studentProfile,
            $request->safe()->except(['photo']),
            $request->file('photo')
        );

        return ApiResponse::success(
            StudentProfileResource::make($student),
            'Student updated successfully.'
        );
    }

    public function destroy(StudentProfile $studentProfile): JsonResponse
    {
        $this->studentService->delete($studentProfile);

        return ApiResponse::success(null, 'Student deleted successfully.');
    }

    private function resolveOwnProfile(Request $request): ?StudentProfile
    {
        return $request->user()
            ->studentProfile()
            ->with(['user', 'gradeRecords.subject'])
            ->first();
    }

    private function canAccessStudent(?User $user, StudentProfile $studentProfile): bool
    {
        if ($user === null) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $user->isStudent()
            && $user->studentProfile?->id === $studentProfile->id;
    }
}
