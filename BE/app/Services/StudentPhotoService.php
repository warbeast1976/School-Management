<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class StudentPhotoService
{
    public function store(UploadedFile $file, ?string $existingPath = null): string
    {
        if ($existingPath !== null && $existingPath !== '') {
            Storage::disk('public')->delete($existingPath);
        }

        return $file->store('student-photos', 'public');
    }

    public function delete(?string $path): void
    {
        if ($path !== null && $path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
}
