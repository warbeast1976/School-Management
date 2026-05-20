<?php

namespace App\Services;

use App\Models\GradeRecord;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function adminStats(): array
    {
        $activeStudents = StudentProfile::query()->where('enrollment_status', 'active')->count();
        $totalStudents = StudentProfile::query()->count();
        $totalGrades = GradeRecord::query()->count();
        $activeSubjects = Subject::query()->where('is_active', true)->count();

        $averageGrade = (float) GradeRecord::query()->avg('grade_value');

        $byLevel = StudentProfile::query()
            ->select('grade_level', DB::raw('count(*) as total'))
            ->groupBy('grade_level')
            ->orderBy('grade_level')
            ->pluck('total', 'grade_level')
            ->all();

        $distribution = $this->gradeDistribution();

        $recentGrades = GradeRecord::query()
            ->with(['studentProfile', 'subject'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (GradeRecord $g) => [
                'id' => $g->id,
                'student_name' => $g->studentProfile?->full_name,
                'subject_code' => $g->subject?->code,
                'grade_value' => (float) $g->grade_value,
                'letter_grade' => $g->letter_grade,
                'school_year' => $g->school_year,
                'semester' => $g->semester,
                'created_at' => $g->created_at?->toIso8601String(),
            ]);

        return [
            'totals' => [
                'students' => $totalStudents,
                'active_students' => $activeStudents,
                'grade_records' => $totalGrades,
                'subjects' => $activeSubjects,
                'admins' => User::query()->where('role', UserRole::Admin)->count(),
            ],
            'average_grade' => round($averageGrade, 2),
            'students_by_grade_level' => $byLevel,
            'grade_distribution' => $distribution,
            'recent_grades' => $recentGrades,
        ];
    }

    /**
     * @return list<array{label: string, count: int, min: int, max: int}>
     */
    private function gradeDistribution(): array
    {
        $buckets = [
            ['label' => '90–100', 'min' => 90, 'max' => 100],
            ['label' => '85–89', 'min' => 85, 'max' => 89.99],
            ['label' => '80–84', 'min' => 80, 'max' => 84.99],
            ['label' => '75–79', 'min' => 75, 'max' => 79.99],
            ['label' => 'Below 75', 'min' => 0, 'max' => 74.99],
        ];

        return array_map(function (array $bucket) {
            $count = GradeRecord::query()
                ->whereBetween('grade_value', [$bucket['min'], $bucket['max']])
                ->count();

            return [
                'label' => $bucket['label'],
                'count' => $count,
                'min' => $bucket['min'],
                'max' => $bucket['max'],
            ];
        }, $buckets);
    }
}
