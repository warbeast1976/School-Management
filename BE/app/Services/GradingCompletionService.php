<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\GradeRecord;
use App\Models\SemesterGradeNotification;
use App\Models\StudentProfile;
use App\Notifications\SemesterGradesReleasedNotification;
use Illuminate\Support\Facades\DB;

class GradingCompletionService
{
    /**
     * True when every actively enrolled subject for the term has a grade record.
     */
    public function isTermFullyGraded(int $studentProfileId, string $schoolYear, string $semester): bool
    {
        $enrolledSubjectIds = Enrollment::query()
            ->where('student_profile_id', $studentProfileId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('status', 'enrolled')
            ->pluck('subject_id');

        if ($enrolledSubjectIds->isEmpty()) {
            return false;
        }

        $gradedSubjectIds = GradeRecord::query()
            ->where('student_profile_id', $studentProfileId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->whereIn('subject_id', $enrolledSubjectIds)
            ->pluck('subject_id')
            ->unique();

        return $enrolledSubjectIds->diff($gradedSubjectIds)->isEmpty();
    }

    /**
     * Send a one-time email when all enrolled subjects for a term are graded.
     */
    public function notifyIfTermComplete(int $studentProfileId, string $schoolYear, string $semester): bool
    {
        if (! $this->isTermFullyGraded($studentProfileId, $schoolYear, $semester)) {
            return false;
        }

        $alreadyNotified = SemesterGradeNotification::query()
            ->where('student_profile_id', $studentProfileId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->exists();

        if ($alreadyNotified) {
            return false;
        }

        $profile = StudentProfile::query()
            ->with('user')
            ->find($studentProfileId);

        if ($profile?->user === null) {
            return false;
        }

        DB::transaction(function () use ($profile, $schoolYear, $semester) {
            $exists = SemesterGradeNotification::query()
                ->where('student_profile_id', $profile->id)
                ->where('school_year', $schoolYear)
                ->where('semester', $semester)
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                return;
            }

            $profile->user->notify(new SemesterGradesReleasedNotification(
                $schoolYear,
                $semester,
                $profile->full_name,
            ));

            SemesterGradeNotification::query()->create([
                'student_profile_id' => $profile->id,
                'school_year' => $schoolYear,
                'semester' => $semester,
                'notified_at' => now(),
            ]);
        });

        return true;
    }
}
