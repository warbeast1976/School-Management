<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = [
        'student_profile_id',
        'subject_id',
        'school_year',
        'semester',
        'status',
        'assigned_by',
    ];

    public function studentProfile()
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
