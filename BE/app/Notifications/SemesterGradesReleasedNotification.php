<?php

namespace App\Notifications;

use App\Support\AcademicTerm;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SemesterGradesReleasedNotification extends Notification
{

    public function __construct(
        public readonly string $schoolYear,
        public readonly string $semester,
        public readonly string $studentName,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $termLabel = AcademicTerm::label($this->semester);

        return (new MailMessage)
            ->subject("Grades available — {$termLabel} {$this->schoolYear}")
            ->greeting("Hello {$this->studentName},")
            ->line("All subjects for {$termLabel} ({$this->schoolYear}) have been graded.")
            ->line('You can sign in to the student portal to view your grades.')
            ->line('If you have questions about your results, please contact the registrar office.');
    }
}
