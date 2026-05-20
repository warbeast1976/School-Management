<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): StudentProfile
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => UserRole::Student,
                'is_active' => true,
            ]);

            return StudentProfile::query()->create([
                'user_id' => $user->id,
                'student_number' => $data['student_number'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'grade_level' => $data['grade_level'],
                'section' => $data['section'] ?? null,
                'enrollment_status' => $data['enrollment_status'],
            ])->load('user');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StudentProfile $student, array $data): StudentProfile
    {
        return DB::transaction(function () use ($student, $data) {
            $user = $student->user;

            $userData = array_filter([
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'is_active' => array_key_exists('is_active', $data) ? $data['is_active'] : null,
            ], fn ($value) => $value !== null);

            if (! empty($data['password'] ?? null)) {
                $userData['password'] = Hash::make($data['password']);
            }

            if ($userData !== []) {
                $user->update($userData);
            }

            $profileFields = [
                'student_number',
                'first_name',
                'last_name',
                'middle_name',
                'date_of_birth',
                'gender',
                'grade_level',
                'section',
                'enrollment_status',
            ];
            $profileData = [];
            foreach ($profileFields as $field) {
                if (array_key_exists($field, $data)) {
                    $profileData[$field] = $data[$field];
                }
            }

            if ($profileData !== []) {
                $student->update($profileData);
            }

            return $student->fresh(['user']);
        });
    }

    public function delete(StudentProfile $student): void
    {
        DB::transaction(function () use ($student) {
            $user = $student->user;
            $student->delete();
            $user?->delete();
        });
    }
}
