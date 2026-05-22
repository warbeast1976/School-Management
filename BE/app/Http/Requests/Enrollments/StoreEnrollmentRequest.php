<?php

namespace App\Http\Requests\Enrollments;

use App\Http\Requests\Concerns\SanitizesInput;
use App\Models\Enrollment;
use App\Support\AcademicTerm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEnrollmentRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $normalized = AcademicTerm::normalize($this->input('semester'));

        $this->merge([
            'school_year' => $this->sanitizeString($this->input('school_year')),
            'semester' => $normalized ?? $this->sanitizeString($this->input('semester')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'student_profile_id' => ['required', 'integer', 'exists:student_profiles,id'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => ['required', 'integer', 'exists:subjects,id'],
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', Rule::in(AcademicTerm::SEMESTERS)],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $otherSemester = Enrollment::query()
                ->where('student_profile_id', $this->integer('student_profile_id'))
                ->where('school_year', $this->input('school_year'))
                ->where('status', 'enrolled')
                ->where('semester', '!=', $this->input('semester'))
                ->value('semester');

            if ($otherSemester !== null) {
                $validator->errors()->add(
                    'semester',
                    'Student is already enrolled in '.AcademicTerm::label($otherSemester)
                    .' for this school year. Complete or drop that term before enrolling in another semester.'
                );
            }
        });
    }
}
