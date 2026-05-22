import { apiRequest, apiFormRequest, ApiError } from '../api.js';
import { getUser, isStudent, refreshUser } from '../auth.js';
import {
  profileFieldsHtml, bindPhotoPreview, appendProfileFormData,
} from '../student-profile-form.js';
import {
  setPageTitle, pageHeader, loadingHtml, toast, formField, inputCls, labelCls,
  errorAlert, formatErrors, escapeHtml, btnPrimarySubmit, studentAvatar,
} from '../ui.js';

export async function renderSettings(container) {
  setPageTitle('Settings', 'Account and profile');
  container.innerHTML = loadingHtml();

  if (isStudent()) {
    await renderStudentSettings(container);
    return;
  }

  renderAdminSettings(container);
}

function renderAdminSettings(container) {
  const user = getUser();

  container.innerHTML = `
    ${pageHeader('Settings', 'Manage your account and security preferences.')}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card p-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-lg font-bold">
            ${escapeHtml((user?.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase())}
          </div>
          <div>
            <p class="font-bold text-slate-900">${escapeHtml(user?.name)}</p>
            <p class="text-sm text-slate-500">${escapeHtml(user?.email)}</p>
            <span class="badge badge-indigo mt-2">${escapeHtml(user?.role_label || user?.role)}</span>
          </div>
        </div>
      </div>
      <div class="card p-6 lg:col-span-2">
        ${passwordFormHtml()}
      </div>
    </div>`;

  bindPasswordForm();
}

async function renderStudentSettings(container) {
  try {
    const res = await apiRequest('/students/me');
    const profile = res.data;

    container.innerHTML = `
      ${pageHeader('Settings', 'Update your profile photo, contact details, and password.')}
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="card p-6">
          <div class="flex flex-col items-center text-center gap-3">
            ${studentAvatar(profile, { size: 'lg' })}
            <div>
              <p class="font-bold text-slate-900">${escapeHtml(profile.full_name)}</p>
              <p class="text-sm text-slate-500">${escapeHtml(profile.user?.email || '')}</p>
              <p class="text-xs text-slate-400 mt-1 font-mono">${escapeHtml(profile.student_number)}</p>
            </div>
            <div class="w-full pt-3 border-t border-slate-100 text-left text-sm space-y-1">
              <p><span class="text-slate-500">Grade level:</span> ${escapeHtml(profile.grade_level)}</p>
              <p><span class="text-slate-500">Section:</span> ${escapeHtml(profile.section || '—')}</p>
              <p><span class="text-slate-500">Status:</span> <span class="capitalize">${escapeHtml(profile.enrollment_status)}</span></p>
            </div>
            <p class="text-xs text-slate-400">Enrollment details are managed by the school office.</p>
          </div>
        </div>
        <div class="card p-6 xl:col-span-2">
          <h3 class="font-semibold text-slate-900 mb-1">My profile</h3>
          <p class="text-sm text-slate-500 mb-6">You can update your photo, religion, contact info, and other personal details.</p>
          <form id="profile-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4" enctype="multipart/form-data">
            <div id="profile-error" class="hidden alert-error sm:col-span-2" role="alert"><span></span></div>
            ${profileFieldsHtml(profile)}
            <div class="sm:col-span-2 pt-2">
              ${btnPrimarySubmit('Save profile')}
            </div>
          </form>
        </div>
        <div class="card p-6 xl:col-span-3">
          ${passwordFormHtml()}
        </div>
      </div>`;

    bindPhotoPreview();
    bindProfileForm();
    bindPasswordForm();
  } catch (err) {
    container.innerHTML = pageHeader('Settings') + errorAlert(err.message);
  }
}

function passwordFormHtml() {
  return `
    <h3 class="font-semibold text-slate-900 mb-1">Change password</h3>
    <p class="text-sm text-slate-500 mb-6">Use at least 8 characters. Other sessions will be signed out after a successful change.</p>
    <form id="password-form" class="space-y-4 max-w-md">
      <div id="pw-error" class="hidden alert-error"><span></span></div>
      <div>
        <label class="${labelCls}" for="current_password">Current password</label>
        <input id="current_password" name="current_password" type="password" required class="${inputCls}" autocomplete="current-password" />
      </div>
      <div>
        <label class="${labelCls}" for="password">New password</label>
        <input id="password" name="password" type="password" required minlength="8" class="${inputCls}" autocomplete="new-password" />
      </div>
      <div>
        <label class="${labelCls}" for="password_confirmation">Confirm new password</label>
        <input id="password_confirmation" name="password_confirmation" type="password" required class="${inputCls}" autocomplete="new-password" />
      </div>
      <button type="submit" class="btn btn-primary">Update password</button>
    </form>`;
}

function bindProfileForm() {
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    appendProfileFormData(fd);
    fd.append('_method', 'PUT');

    const errEl = document.getElementById('profile-error');
    const errSpan = errEl?.querySelector('span');
    errEl?.classList.add('hidden');

    try {
      const res = await apiFormRequest('/students/me/profile', fd, { method: 'POST' });
      await refreshUser();
      toast('Profile updated successfully.', 'success');
      if (res.data?.photo_url) {
        bindPhotoPreview();
      }
      await renderStudentSettings(document.getElementById('main-content'));
    } catch (err) {
      if (errSpan) errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl?.classList.remove('hidden');
    }
  });
}

function bindPasswordForm() {
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const errEl = document.getElementById('pw-error');
    const errSpan = errEl?.querySelector('span');
    errEl?.classList.add('hidden');

    try {
      await apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      toast('Password updated successfully.', 'success');
      e.target.reset();
    } catch (err) {
      if (errSpan) errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl?.classList.remove('hidden');
    }
  });
}
