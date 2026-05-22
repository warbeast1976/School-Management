<?php

namespace App\Support;

/**
 * Canonical semester values used across enrollments and grade records.
 */
final class AcademicTerm
{
    public const SEMESTERS = ['1st', '2nd', 'summer'];

    /**
     * Map UI / legacy strings to canonical semester codes.
     */
    public static function normalize(?string $semester): ?string
    {
        if ($semester === null || trim($semester) === '') {
            return null;
        }

        $key = strtolower(trim($semester));

        return match ($key) {
            '1st', '1st semester', 'first', 'first semester' => '1st',
            '2nd', '2nd semester', 'second', 'second semester' => '2nd',
            'summer' => 'summer',
            default => null,
        };
    }

    public static function label(string $semester): string
    {
        return match ($semester) {
            '1st' => '1st Semester',
            '2nd' => '2nd Semester',
            'summer' => 'Summer',
            default => $semester,
        };
    }
}
