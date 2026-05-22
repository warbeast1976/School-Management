<?php

namespace App\Http\Requests\GradeRecords;

use App\Http\Requests\Concerns\SanitizesInput;
use App\Http\Requests\Concerns\ValidatesEnrollmentForGrading;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGradeRecordRequest extends FormRequest
{
    use SanitizesInput, ValidatesEnrollmentForGrading;

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'school_year' => $this->sanitizeString($this->input('school_year')),
            'semester' => $this->sanitizeString($this->input('semester')),
            'letter_grade' => $this->sanitizeNullableString($this->input('letter_grade')),
            'remarks' => $this->sanitizeNullableString($this->input('remarks')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'student_profile_id' => ['required', 'integer', 'exists:student_profiles,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', 'max:20', Rule::in(['1st', '2nd', 'summer'])],
            'grade_value' => ['required', 'numeric', 'min:0', 'max:100'],
            'letter_grade' => ['nullable', 'string', 'max:5'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $exists = \App\Models\GradeRecord::query()
                ->where('student_profile_id', $this->integer('student_profile_id'))
                ->where('subject_id', $this->integer('subject_id'))
                ->where('school_year', $this->input('school_year'))
                ->where('semester', $this->input('semester'))
                ->exists();

            if ($exists) {
                $validator->errors()->add(
                    'semester',
                    'A grade record already exists for this student, subject, school year, and semester.'
                );

                return;
            }

            $this->assertStudentEnrolledInSubject(
                $validator,
                $this->integer('student_profile_id'),
                $this->integer('subject_id'),
                $this->input('school_year'),
                $this->input('semester')
            );
        });
    }
}
