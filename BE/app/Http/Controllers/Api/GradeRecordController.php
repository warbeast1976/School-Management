<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GradeRecords\StoreGradeRecordRequest;
use App\Http\Requests\GradeRecords\UpdateGradeRecordRequest;
use App\Http\Resources\GradeRecordResource;
use App\Http\Responses\ApiResponse;
use App\Models\GradeRecord;
use App\Models\User;
use App\Services\GradingCompletionService;
use App\Support\LetterGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeRecordController extends Controller
{
    public function __construct(
        private readonly GradingCompletionService $gradingCompletion
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = GradeRecord::query()
            ->with(['subject', 'studentProfile.user', 'recordedBy'])
            ->orderByDesc('school_year')
            ->orderBy('semester');

        if ($user->isStudent()) {
            $profileId = $user->studentProfile?->id;
            if ($profileId === null) {
                return ApiResponse::error('Student profile not found.', null, 404);
            }
            $query->where('student_profile_id', $profileId);
        } else {
            if ($request->filled('student_profile_id')) {
                $query->where('student_profile_id', $request->integer('student_profile_id'));
            }
            if ($request->filled('subject_id')) {
                $query->where('subject_id', $request->integer('subject_id'));
            }
            if ($request->filled('school_year')) {
                $query->where('school_year', $request->query('school_year'));
            }
            if ($request->filled('semester')) {
                $query->where('semester', $request->query('semester'));
            }
        }

        $perPage = min((int) $request->query('per_page', 15), 100);
        $records = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'items' => GradeRecordResource::collection($records->items()),
            'pagination' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ], 'Grade records retrieved.');
    }

    public function show(Request $request, GradeRecord $gradeRecord): JsonResponse
    {
        if (! $this->canAccessGradeRecord($request->user(), $gradeRecord)) {
            return ApiResponse::error('You do not have permission to view this grade record.', null, 403);
        }

        $gradeRecord->load(['subject', 'studentProfile.user', 'recordedBy']);

        return ApiResponse::success(
            GradeRecordResource::make($gradeRecord),
            'Grade record retrieved.'
        );
    }

    public function store(StoreGradeRecordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $gradeValue = (float) $data['grade_value'];

        $record = GradeRecord::query()->create([
            'student_profile_id' => $data['student_profile_id'],
            'subject_id' => $data['subject_id'],
            'school_year' => $data['school_year'],
            'semester' => $data['semester'],
            'grade_value' => $gradeValue,
            'letter_grade' => $data['letter_grade'] ?? LetterGrade::fromNumeric($gradeValue),
            'remarks' => $data['remarks'] ?? null,
            'recorded_by' => $request->user()->id,
        ]);

        $record->load(['subject', 'studentProfile.user', 'recordedBy']);

        $this->gradingCompletion->notifyIfTermComplete(
            (int) $record->student_profile_id,
            $record->school_year,
            $record->semester
        );

        return ApiResponse::success(
            GradeRecordResource::make($record),
            'Grade record created successfully.',
            201
        );
    }

    public function update(UpdateGradeRecordRequest $request, GradeRecord $gradeRecord): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['grade_value'])) {
            $data['letter_grade'] = $data['letter_grade']
                ?? LetterGrade::fromNumeric((float) $data['grade_value']);
        }

        $gradeRecord->update($data);
        $gradeRecord->load(['subject', 'studentProfile.user', 'recordedBy']);

        $this->gradingCompletion->notifyIfTermComplete(
            (int) $gradeRecord->student_profile_id,
            $gradeRecord->school_year,
            $gradeRecord->semester
        );

        return ApiResponse::success(
            GradeRecordResource::make($gradeRecord),
            'Grade record updated successfully.'
        );
    }

    public function destroy(GradeRecord $gradeRecord): JsonResponse
    {
        $gradeRecord->delete();

        return ApiResponse::success(null, 'Grade record deleted successfully.');
    }

    private function canAccessGradeRecord(?User $user, GradeRecord $gradeRecord): bool
    {
        if ($user === null) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $user->isStudent()
            && $user->studentProfile?->id === $gradeRecord->student_profile_id;
    }
}
