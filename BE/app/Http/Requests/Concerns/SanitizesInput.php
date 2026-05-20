<?php

namespace App\Http\Requests\Concerns;

trait SanitizesInput
{
    protected function sanitizeString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return is_string($value) && $value === '' ? '' : null;
        }

        return strip_tags(trim((string) $value));
    }

    protected function sanitizeNullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return strip_tags(trim((string) $value));
    }
}
