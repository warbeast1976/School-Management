<?php

namespace App\Http\Requests\Concerns;

use App\Models\Enrollment;

trait ValidatesEnrollmentForGrading
{
    protected function assertStudentEnrolledInSubject(
        $validator,
        int $studentProfileId,
        int $subjectId,
        string $schoolYear,
        string $semester
    ): void {
        $enrolled = Enrollment::query()
            ->where('student_profile_id', $studentProfileId)
            ->where('subject_id', $subjectId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->whereIn('status', ['enrolled', 'completed'])
            ->exists();

        if (! $enrolled) {
            $validator->errors()->add(
                'subject_id',
                'Student must be enrolled in this subject for the selected school year and semester before a grade can be recorded.'
            );
        }
    }
}
