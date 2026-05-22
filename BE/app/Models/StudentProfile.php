<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_number',
        'first_name',
        'last_name',
        'middle_name',
        'date_of_birth',
        'gender',
        'photo_path',
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

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gradeRecords(): HasMany
    {
        return $this->hasMany(GradeRecord::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function getFullNameAttribute(): string
    {
        $middle = $this->middle_name ? " {$this->middle_name} " : ' ';

        return trim("{$this->first_name}{$middle}{$this->last_name}");
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo_path === null || $this->photo_path === '') {
            return null;
        }

        return Storage::disk('public')->url($this->photo_path);
    }
}
