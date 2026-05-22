<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentService
{
    private const OWN_PROFILE_FIELDS = [
        'first_name',
        'last_name',
        'middle_name',
        'date_of_birth',
        'gender',
        'religion',
        'nationality',
        'place_of_birth',
        'blood_type',
        'contact_number',
        'address',
    ];

    private const PROFILE_FIELDS = [
        'student_number',
        'first_name',
        'last_name',
        'middle_name',
        'date_of_birth',
        'gender',
        'religion',
        'nationality',
        'place_of_birth',
        'blood_type',
        'contact_number',
        'address',
        'grade_level',
        'section',
        'enrollment_status',
    ];

    public function __construct(
        private readonly StudentPhotoService $photoService
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $photo = null): StudentProfile
    {
        return DB::transaction(function () use ($data, $photo) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => UserRole::Student,
                'is_active' => true,
            ]);

            $profileData = $this->profilePayload($data);
            $profileData['user_id'] = $user->id;

            if ($photo !== null) {
                $profileData['photo_path'] = $this->photoService->store($photo);
            }

            return StudentProfile::query()->create($profileData)->load('user');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StudentProfile $student, array $data, ?UploadedFile $photo = null): StudentProfile
    {
        return DB::transaction(function () use ($student, $data, $photo) {
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

            $profileData = [];
            foreach (self::PROFILE_FIELDS as $field) {
                if (array_key_exists($field, $data)) {
                    $profileData[$field] = $data[$field];
                }
            }

            if ($photo !== null) {
                $profileData['photo_path'] = $this->photoService->store($photo, $student->photo_path);
            } elseif (! empty($data['remove_photo'])) {
                $this->photoService->delete($student->photo_path);
                $profileData['photo_path'] = null;
            }

            if ($profileData !== []) {
                $student->update($profileData);
            }

            return $student->fresh(['user']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateOwnProfile(StudentProfile $student, array $data, ?UploadedFile $photo = null): StudentProfile
    {
        return DB::transaction(function () use ($student, $data, $photo) {
            $user = $student->user;

            $user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            $profileData = [];
            foreach (self::OWN_PROFILE_FIELDS as $field) {
                if (array_key_exists($field, $data)) {
                    $profileData[$field] = $data[$field];
                }
            }

            if ($photo !== null) {
                $profileData['photo_path'] = $this->photoService->store($photo, $student->photo_path);
            } elseif (! empty($data['remove_photo'])) {
                $this->photoService->delete($student->photo_path);
                $profileData['photo_path'] = null;
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
            $this->photoService->delete($student->photo_path);
            $user = $student->user;
            $student->delete();
            $user?->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function profilePayload(array $data): array
    {
        $payload = [];
        foreach (self::PROFILE_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        return $payload;
    }
}
