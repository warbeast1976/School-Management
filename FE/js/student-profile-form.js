import { formField, inputCls, studentAvatar } from './ui.js';

export const GENDER_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const BLOOD_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
];

function selectOptions(list, selected) {
  return list.map((o) => ({
    ...o,
    selected: selected === o.value || (!selected && o.value === ''),
  }));
}

export function profileFieldsHtml(profile = null, { includeAccount = true } = {}) {
  const genderOpts = selectOptions(GENDER_OPTIONS, profile?.gender || '');
  const bloodOpts = selectOptions(BLOOD_OPTIONS, profile?.blood_type || '');

  const accountFields = includeAccount
    ? `${formField('First name', 'first_name', { value: profile?.first_name, required: true })}
    ${formField('Last name', 'last_name', { value: profile?.last_name, required: true })}
    ${formField('Middle name', 'middle_name', { value: profile?.middle_name || '' })}
    ${formField('Display name', 'name', { value: profile?.user?.name, required: true, colspan: '2' })}
    ${formField('Email', 'email', { type: 'email', value: profile?.user?.email, required: true, colspan: '2' })}`
    : `${formField('Middle name', 'middle_name', { value: profile?.middle_name || '' })}`;

  return `
    <div class="sm:col-span-2">
      <label class="label-field">Profile photo</label>
      <div class="flex flex-wrap items-center gap-4">
        <div id="photo-preview">${studentAvatar(profile || {}, { size: 'lg' })}</div>
        <div class="space-y-2 min-w-[12rem]">
          <input type="file" id="photo" name="photo" accept="image/jpeg,image/png,image/webp" class="${inputCls}" />
          <p class="text-xs text-slate-500">JPEG, PNG, or WebP · max 2 MB</p>
          ${profile?.photo_url
    ? `<label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" name="remove_photo" value="1" class="rounded border-slate-300" />
            Remove current photo
          </label>`
    : ''}
        </div>
      </div>
    </div>
    ${accountFields}
    ${formField('Date of birth', 'date_of_birth', { type: 'date', value: profile?.date_of_birth || '' })}
    ${formField('Gender', 'gender', { type: 'select', options: genderOpts })}
    ${formField('Religion', 'religion', { value: profile?.religion || '' })}
    ${formField('Nationality', 'nationality', { value: profile?.nationality || '' })}
    ${formField('Place of birth', 'place_of_birth', { value: profile?.place_of_birth || '' })}
    ${formField('Blood type', 'blood_type', { type: 'select', options: bloodOpts })}
    ${formField('Contact number', 'contact_number', { value: profile?.contact_number || '' })}
    ${formField('Home address', 'address', { type: 'textarea', value: profile?.address || '', colspan: '2', rows: 2 })}
  `;
}

export function bindPhotoPreview() {
  const photoInput = document.getElementById('photo');
  const previewEl = document.getElementById('photo-preview');
  photoInput?.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file || !previewEl) return;
    const url = URL.createObjectURL(file);
    previewEl.innerHTML = `<img src="${url}" alt="" class="w-20 h-20 rounded-2xl object-cover border border-slate-200" />`;
  });
}

export function appendProfileFormData(fd) {
  if (!fd.get('password')) {
    fd.delete('password');
    fd.delete('password_confirmation');
  }
  if (!fd.get('photo')?.size) {
    fd.delete('photo');
  }
  if (!fd.get('remove_photo')) {
    fd.delete('remove_photo');
  }
}
