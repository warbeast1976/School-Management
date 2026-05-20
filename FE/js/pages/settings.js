import { apiRequest, ApiError } from '../api.js';
import { getUser } from '../auth.js';
import {
  setPageTitle, pageHeader, loadingHtml, toast, formField, inputCls, labelCls,
  errorAlert, formatErrors, avatarInitials,
} from '../ui.js';

export async function renderSettings(container) {
  setPageTitle('Settings', 'Account security');
  const user = getUser();
  container.innerHTML = loadingHtml();

  container.innerHTML = `
    ${pageHeader('Settings', 'Manage your account and security preferences.')}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card p-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-lg font-bold">
            ${escapeHtml(avatarInitials(user?.name))}
          </div>
          <div>
            <p class="font-bold text-slate-900">${escapeHtml(user?.name)}</p>
            <p class="text-sm text-slate-500">${escapeHtml(user?.email)}</p>
            <span class="badge badge-indigo mt-2">${escapeHtml(user?.role_label || user?.role)}</span>
          </div>
        </div>
      </div>
      <div class="card p-6 lg:col-span-2">
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
        </form>
      </div>
    </div>`;

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const errEl = document.getElementById('pw-error');
    const errSpan = errEl.querySelector('span');
    errEl.classList.add('hidden');

    try {
      await apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      toast('Password updated successfully.', 'success');
      e.target.reset();
    } catch (err) {
      errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl.classList.remove('hidden');
    }
  });
}
