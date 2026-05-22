<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Enrollment;
use App\Models\SemesterGradeNotification;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Notifications\SemesterGradesReleasedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EnrollmentAndGradeNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private StudentProfile $student;

    private Subject $subjectA;

    private Subject $subjectB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => UserRole::Admin,
            'password' => Hash::make('password'),
        ]);

        $studentUser = User::factory()->create([
            'role' => UserRole::Student,
            'password' => Hash::make('password'),
        ]);

        $this->student = StudentProfile::query()->create([
            'user_id' => $studentUser->id,
            'student_number' => '2026-9999',
            'first_name' => 'Test',
            'last_name' => 'Student',
            'enrollment_status' => 'active',
        ]);
        $this->student->setRelation('user', $studentUser);

        $this->subjectA = Subject::query()->create([
            'code' => 'TST101',
            'name' => 'Test Subject A',
            'units' => 3,
            'is_active' => true,
        ]);

        $this->subjectB = Subject::query()->create([
            'code' => 'TST102',
            'name' => 'Test Subject B',
            'units' => 3,
            'is_active' => true,
        ]);
    }

    private function asAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }

    public function test_student_cannot_enroll_in_two_semesters_same_school_year(): void
    {
        $this->asAdmin()->postJson('/api/enrollments', [
            'student_profile_id' => $this->student->id,
            'subject_ids' => [$this->subjectA->id],
            'school_year' => '2025-2026',
            'semester' => '1st',
        ])->assertCreated();

        $this->asAdmin()->postJson('/api/enrollments', [
            'student_profile_id' => $this->student->id,
            'subject_ids' => [$this->subjectB->id],
            'school_year' => '2025-2026',
            'semester' => '2nd',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.semester.0', fn ($message) => str_contains($message, 'already enrolled'));
    }

    public function test_legacy_semester_label_is_normalized_on_enrollment(): void
    {
        $this->asAdmin()->postJson('/api/enrollments', [
            'student_profile_id' => $this->student->id,
            'subject_ids' => [$this->subjectA->id],
            'school_year' => '2025-2026',
            'semester' => '1st Semester',
        ])->assertCreated();

        $this->assertDatabaseHas('enrollments', [
            'student_profile_id' => $this->student->id,
            'semester' => '1st',
        ]);
    }

    public function test_grade_requires_enrollment_in_term(): void
    {
        $this->asAdmin()->postJson('/api/grade-records', [
            'student_profile_id' => $this->student->id,
            'subject_id' => $this->subjectA->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
            'grade_value' => 90,
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.subject_id.0', fn ($message) => str_contains($message, 'enrolled'));
    }

    public function test_email_sent_when_all_enrolled_subjects_are_graded(): void
    {
        Notification::fake();

        $this->asAdmin()->postJson('/api/enrollments', [
            'student_profile_id' => $this->student->id,
            'subject_ids' => [$this->subjectA->id, $this->subjectB->id],
            'school_year' => '2025-2026',
            'semester' => '1st',
        ])->assertCreated();

        $this->asAdmin()->postJson('/api/grade-records', [
            'student_profile_id' => $this->student->id,
            'subject_id' => $this->subjectA->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
            'grade_value' => 88,
        ])->assertCreated();

        Notification::assertNothingSent();

        $this->asAdmin()->postJson('/api/grade-records', [
            'student_profile_id' => $this->student->id,
            'subject_id' => $this->subjectB->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
            'grade_value' => 91,
        ])->assertCreated();

        Notification::assertSentTo(
            $this->student->user,
            SemesterGradesReleasedNotification::class
        );

        $this->assertDatabaseHas('semester_grade_notifications', [
            'student_profile_id' => $this->student->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
        ]);

        // Idempotent: editing a grade does not send a second email.
        $record = $this->student->gradeRecords()->first();
        $this->asAdmin()->putJson("/api/grade-records/{$record->id}", [
            'grade_value' => 89,
        ])->assertOk();

        Notification::assertSentTimes(SemesterGradesReleasedNotification::class, 1);
    }

    public function test_notification_record_prevents_duplicate_emails(): void
    {
        Notification::fake();

        SemesterGradeNotification::query()->create([
            'student_profile_id' => $this->student->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
            'notified_at' => now(),
        ]);

        Enrollment::query()->create([
            'student_profile_id' => $this->student->id,
            'subject_id' => $this->subjectA->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
            'status' => 'enrolled',
            'assigned_by' => $this->admin->id,
        ]);

        $this->asAdmin()->postJson('/api/grade-records', [
            'student_profile_id' => $this->student->id,
            'subject_id' => $this->subjectA->id,
            'school_year' => '2025-2026',
            'semester' => '1st',
            'grade_value' => 90,
        ])->assertCreated();

        Notification::assertNothingSent();
    }
}
