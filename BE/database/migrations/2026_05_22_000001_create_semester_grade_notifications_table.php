<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semester_grade_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('school_year', 20);
            $table->string('semester', 20);
            $table->timestamp('notified_at');
            $table->unique(['student_profile_id', 'school_year', 'semester'], 'semester_grade_notify_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semester_grade_notifications');
    }
};
