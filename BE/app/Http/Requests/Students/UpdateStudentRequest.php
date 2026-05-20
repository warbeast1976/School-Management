<?php

namespace App\Http\Requests\Students;

use App\Http\Requests\Concerns\SanitizesInput;
use App\Models\StudentProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->sanitizeString($this->input('name')),
            'email' => $this->sanitizeString($this->input('email')),
            'student_number' => $this->sanitizeString($this->input('student_number')),
            'first_name' => $this->sanitizeString($this->input('first_name')),
            'last_name' => $this->sanitizeString($this->input('last_name')),
            'middle_name' => $this->sanitizeNullableString($this->input('middle_name')),
            'gender' => $this->sanitizeNullableString($this->input('gender')),
            'grade_level' => $this->sanitizeString($this->input('grade_level')),
            'section' => $this->sanitizeNullableString($this->input('section')),
            'enrollment_status' => $this->sanitizeString($this->input('enrollment_status')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var StudentProfile $student */
        $student = $this->route('studentProfile');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($student->user_id),
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:255', 'confirmed'],
            'is_active' => ['sometimes', 'boolean'],
            'student_number' => [
                'sometimes',
                'required',
                'string',
                'max:30',
                Rule::unique('student_profiles', 'student_number')->ignore($student->id),
            ],
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'max:20', Rule::in(['male', 'female', 'other'])],
            'grade_level' => ['sometimes', 'required', 'string', 'max:50'],
            'section' => ['nullable', 'string', 'max:50'],
            'enrollment_status' => ['sometimes', 'required', 'string', 'max:30', Rule::in(['active', 'inactive', 'graduated', 'transferred'])],
        ];
    }
}
