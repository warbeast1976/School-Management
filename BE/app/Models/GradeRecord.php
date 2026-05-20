<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_profile_id',
        'subject_id',
        'school_year',
        'semester',
        'grade_value',
        'letter_grade',
        'remarks',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'grade_value' => 'decimal:2',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
