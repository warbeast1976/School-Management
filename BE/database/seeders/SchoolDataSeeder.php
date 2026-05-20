<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\GradeRecord;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SchoolDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->create([
            'name' => 'System Administrator',
            'email' => 'admin@school.local',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $subjects = collect([
            ['code' => 'MATH101', 'name' => 'General Mathematics', 'units' => 3],
            ['code' => 'ENG101', 'name' => 'English Communication', 'units' => 3],
            ['code' => 'SCI101', 'name' => 'General Science', 'units' => 3],
            ['code' => 'FIL101', 'name' => 'Filipino', 'units' => 3],
            ['code' => 'PE101', 'name' => 'Physical Education', 'units' => 2],
        ])->map(fn (array $row) => Subject::query()->create([
            ...$row,
            'is_active' => true,
        ]));

        $students = [
            [
                'email' => 'student1@school.local',
                'student_number' => '2026-0001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'grade_level' => 'Grade 11',
                'section' => 'A',
                'grades' => [88.5, 91.0, 85.25, 90.0, 95.0],
            ],
            [
                'email' => 'student2@school.local',
                'student_number' => '2026-0002',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'grade_level' => 'Grade 11',
                'section' => 'A',
                'grades' => [92.0, 89.5, 94.0, 88.0, 91.5],
            ],
            [
                'email' => 'student3@school.local',
                'student_number' => '2026-0003',
                'first_name' => 'Pedro',
                'last_name' => 'Reyes',
                'grade_level' => 'Grade 10',
                'section' => 'B',
                'grades' => [78.0, 82.5, 80.0, 85.0, 88.0],
            ],
        ];

        $schoolYear = '2025-2026';
        $semester = '1st';

        foreach ($students as $index => $data) {
            $grades = $data['grades'];
            unset($data['grades']);

            $user = User::query()->create([
                'name' => "{$data['first_name']} {$data['last_name']}",
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => UserRole::Student,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $profile = StudentProfile::query()->create([
                'user_id' => $user->id,
                'student_number' => $data['student_number'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'grade_level' => $data['grade_level'],
                'section' => $data['section'],
                'enrollment_status' => 'active',
                'date_of_birth' => now()->subYears(16 + $index)->toDateString(),
                'gender' => $index === 1 ? 'female' : 'male',
            ]);

            foreach ($subjects as $subjectIndex => $subject) {
                $value = $grades[$subjectIndex];

                GradeRecord::query()->create([
                    'student_profile_id' => $profile->id,
                    'subject_id' => $subject->id,
                    'school_year' => $schoolYear,
                    'semester' => $semester,
                    'grade_value' => $value,
                    'letter_grade' => $this->toLetterGrade($value),
                    'recorded_by' => $admin->id,
                ]);
            }
        }
    }

    private function toLetterGrade(float $value): string
    {
        return match (true) {
            $value >= 90 => 'A',
            $value >= 85 => 'B+',
            $value >= 80 => 'B',
            $value >= 75 => 'C',
            default => 'D',
        };
    }
}
