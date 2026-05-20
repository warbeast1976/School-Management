<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeRecord;
use App\Models\StudentProfile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function students(): StreamedResponse
    {
        $filename = 'students-'.now()->format('Y-m-d').'.csv';

        return $this->streamCsv($filename, function ($handle) {
            fputcsv($handle, [
                'Student Number', 'First Name', 'Last Name', 'Email',
                'Grade Level', 'Section', 'Status', 'Date of Birth',
            ]);

            StudentProfile::query()
                ->with('user')
                ->orderBy('last_name')
                ->chunk(100, function ($students) use ($handle) {
                    foreach ($students as $s) {
                        fputcsv($handle, [
                            $s->student_number,
                            $s->first_name,
                            $s->last_name,
                            $s->user?->email,
                            $s->grade_level,
                            $s->section,
                            $s->enrollment_status,
                            $s->date_of_birth?->format('Y-m-d'),
                        ]);
                    }
                });
        });
    }

    public function gradeRecords(): StreamedResponse
    {
        $filename = 'grade-records-'.now()->format('Y-m-d').'.csv';

        return $this->streamCsv($filename, function ($handle) {
            fputcsv($handle, [
                'Student Number', 'Student Name', 'Subject Code', 'Subject',
                'School Year', 'Semester', 'Grade', 'Letter', 'Remarks',
            ]);

            GradeRecord::query()
                ->with(['studentProfile', 'subject'])
                ->orderByDesc('school_year')
                ->chunk(100, function ($records) use ($handle) {
                    foreach ($records as $g) {
                        fputcsv($handle, [
                            $g->studentProfile?->student_number,
                            $g->studentProfile?->full_name,
                            $g->subject?->code,
                            $g->subject?->name,
                            $g->school_year,
                            $g->semester,
                            $g->grade_value,
                            $g->letter_grade,
                            $g->remarks,
                        ]);
                    }
                });
        });
    }

    /**
     * @param  callable(resource): void  $writer
     */
    private function streamCsv(string $filename, callable $writer): StreamedResponse
    {
        return response()->streamDownload(function () use ($writer) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            $writer($handle);
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
