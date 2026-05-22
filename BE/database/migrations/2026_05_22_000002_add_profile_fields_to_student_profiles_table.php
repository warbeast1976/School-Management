<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('photo_path', 255)->nullable()->after('gender');
            $table->string('religion', 50)->nullable()->after('photo_path');
            $table->string('nationality', 50)->nullable()->after('religion');
            $table->string('place_of_birth', 100)->nullable()->after('nationality');
            $table->string('blood_type', 5)->nullable()->after('place_of_birth');
            $table->string('contact_number', 30)->nullable()->after('blood_type');
            $table->text('address')->nullable()->after('contact_number');
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'photo_path',
                'religion',
                'nationality',
                'place_of_birth',
                'blood_type',
                'contact_number',
                'address',
            ]);
        });
    }
};
