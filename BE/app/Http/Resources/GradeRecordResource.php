<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\GradeRecord */
class GradeRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_profile_id' => $this->student_profile_id,
            'subject_id' => $this->subject_id,
            'school_year' => $this->school_year,
            'semester' => $this->semester,
            'grade_value' => (float) $this->grade_value,
            'letter_grade' => $this->letter_grade,
            'remarks' => $this->remarks,
            'recorded_by' => $this->recorded_by,
            'student' => StudentProfileResource::make($this->whenLoaded('studentProfile')),
            'subject' => SubjectResource::make($this->whenLoaded('subject')),
            'recorded_by_user' => UserResource::make($this->whenLoaded('recordedBy')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
