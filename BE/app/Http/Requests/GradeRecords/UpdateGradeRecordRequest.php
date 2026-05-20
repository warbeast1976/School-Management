<?php

namespace App\Http\Requests\GradeRecords;

use App\Http\Requests\Concerns\SanitizesInput;
use App\Models\GradeRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGradeRecordRequest extends FormRequest
{
    use SanitizesInput;

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
        /** @var GradeRecord $gradeRecord */
        $gradeRecord = $this->route('gradeRecord');

        return [
            'student_profile_id' => ['sometimes', 'required', 'integer', 'exists:student_profiles,id'],
            'subject_id' => ['sometimes', 'required', 'integer', 'exists:subjects,id'],
            'school_year' => ['sometimes', 'required', 'string', 'max:20'],
            'semester' => ['sometimes', 'required', 'string', 'max:20', Rule::in(['1st', '2nd', 'summer'])],
            'grade_value' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
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

            $gradeRecord = $this->route('gradeRecord');
            $studentId = (int) $this->input('student_profile_id', $gradeRecord->student_profile_id);
            $subjectId = (int) $this->input('subject_id', $gradeRecord->subject_id);
            $schoolYear = $this->input('school_year', $gradeRecord->school_year);
            $semester = $this->input('semester', $gradeRecord->semester);

            $duplicate = GradeRecord::query()
                ->where('student_profile_id', $studentId)
                ->where('subject_id', $subjectId)
                ->where('school_year', $schoolYear)
                ->where('semester', $semester)
                ->where('id', '!=', $gradeRecord->id)
                ->exists();

            if ($duplicate) {
                $validator->errors()->add(
                    'semester',
                    'A grade record already exists for this student, subject, school year, and semester.'
                );
            }
        });
    }
}
