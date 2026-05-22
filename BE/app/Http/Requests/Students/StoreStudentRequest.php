<?php

namespace App\Http\Requests\Students;

use App\Http\Requests\Concerns\SanitizesInput;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
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
            'date_of_birth' => $this->sanitizeNullableString($this->input('date_of_birth')),
            'religion' => $this->sanitizeNullableString($this->input('religion')),
            'nationality' => $this->sanitizeNullableString($this->input('nationality')),
            'place_of_birth' => $this->sanitizeNullableString($this->input('place_of_birth')),
            'blood_type' => $this->sanitizeNullableString($this->input('blood_type')),
            'contact_number' => $this->sanitizeNullableString($this->input('contact_number')),
            'address' => $this->sanitizeNullableString($this->input('address')),
            'grade_level' => $this->sanitizeString($this->input('grade_level')),
            'section' => $this->sanitizeNullableString($this->input('section')),
            'enrollment_status' => $this->sanitizeString($this->input('enrollment_status', 'active')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
            'student_number' => ['required', 'string', 'max:30', 'unique:student_profiles,student_number'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'max:20', Rule::in(['male', 'female', 'other'])],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'religion' => ['nullable', 'string', 'max:50'],
            'nationality' => ['nullable', 'string', 'max:50'],
            'place_of_birth' => ['nullable', 'string', 'max:100'],
            'blood_type' => ['nullable', 'string', 'max:5', Rule::in(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'grade_level' => ['required', 'string', 'max:50'],
            'section' => ['nullable', 'string', 'max:50'],
            'enrollment_status' => ['required', 'string', 'max:30', Rule::in(['active', 'inactive', 'graduated', 'transferred'])],
        ];
    }
}
