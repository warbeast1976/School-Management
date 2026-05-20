<?php

namespace App\Support;

final class LetterGrade
{
    public static function fromNumeric(float $value): string
    {
        return match (true) {
            $value >= 90 => 'A',
            $value >= 85 => 'B+',
            $value >= 80 => 'B',
            $value >= 75 => 'C',
            default => 'D',
        };
    }
}
