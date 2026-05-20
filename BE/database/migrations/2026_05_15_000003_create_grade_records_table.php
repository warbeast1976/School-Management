<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->restrictOnDelete();
            $table->string('school_year', 20)->index();
            $table->string('semester', 20)->index();
            $table->decimal('grade_value', 5, 2);
            $table->string('letter_grade', 5)->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['student_profile_id', 'subject_id', 'school_year', 'semester'],
                'grade_records_student_subject_term_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_records');
    }
};
