<?php

namespace App\Http\Requests\Students;

use App\Http\Requests\Concerns\SanitizesInput;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMyStudentProfileRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool
    {
        return $this->user()?->isStudent() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $nullable = [
            'middle_name', 'gender', 'religion', 'nationality', 'place_of_birth',
            'blood_type', 'contact_number', 'address', 'date_of_birth',
        ];

        $required = ['name', 'email', 'first_name', 'last_name'];

        $merged = [];
        foreach ($required as $field) {
            if ($this->exists($field)) {
                $merged[$field] = $this->sanitizeString($this->input($field));
            }
        }
        foreach ($nullable as $field) {
            if ($this->exists($field)) {
                $merged[$field] = $this->sanitizeNullableString($this->input($field));
            }
        }

        $this->merge($merged);

        if ($this->has('remove_photo')) {
            $this->merge([
                'remove_photo' => filter_var($this->input('remove_photo'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'max:20', Rule::in(['male', 'female', 'other'])],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'remove_photo' => ['sometimes', 'boolean'],
            'religion' => ['nullable', 'string', 'max:50'],
            'nationality' => ['nullable', 'string', 'max:50'],
            'place_of_birth' => ['nullable', 'string', 'max:100'],
            'blood_type' => ['nullable', 'string', 'max:5', Rule::in(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }
}
