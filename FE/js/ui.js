import { icons } from './icons.js';

export const inputCls = 'input-field';
export const selectCls = 'input-field';
export const labelCls = 'label-field';

export function toast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  const iconMap = { success: icons.check, error: icons.alert, info: icons.grades };
  const el = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  el.innerHTML = `<span class="opacity-90 shrink-0">${iconMap[type] || iconMap.info}</span><span class="text-sm leading-snug">${escapeHtml(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = '0.25s ease';
    setTimeout(() => el.remove(), 250);
  }, 4200);
}

export function setPageTitle(title, subtitle = '') {
  document.getElementById('page-title').textContent = title;
  const sub = document.getElementById('page-subtitle');
  if (sub) sub.textContent = subtitle;
  document.title = `${title} — Academic Portal`;
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatErrors(errors) {
  if (!errors) return '';
  if (typeof errors === 'string') return errors;
  return Object.values(errors).flat().join(' ');
}

export function openModal(html, { wide = false } = {}) {
  const root = document.getElementById('modal-root');
  const panel = document.getElementById('modal-panel');
  panel.className = `modal-panel bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-transparent dark:border-slate-800 ${wide ? 'max-w-2xl' : 'max-w-lg'}`;
  panel.innerHTML = html;
  root.classList.remove('hidden');
  root.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.classList.add('hidden');
  root.setAttribute('aria-hidden', 'true');
  document.getElementById('modal-panel').innerHTML = '';
  document.body.style.overflow = '';
}

document.getElementById('modal-root')?.addEventListener('click', (e) => {
  if (e.target.matches('[data-modal-close]')) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

export function skeletonPage() {
  return `<div class="space-y-6 animate-pulse">
    <div class="skeleton h-8 w-48"></div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="skeleton h-28 rounded-xl"></div>
      <div class="skeleton h-28 rounded-xl"></div>
      <div class="skeleton h-28 rounded-xl"></div>
    </div>
    <div class="skeleton h-64 rounded-xl"></div>
  </div>`;
}

export function loadingHtml() {
  return skeletonPage();
}

export function pageHeader(title, description, actionsHtml = '') {
  return `<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">${escapeHtml(title)}</h1>
      ${description ? `<p class="text-slate-500 text-sm mt-1 max-w-xl">${escapeHtml(description)}</p>` : ''}
    </div>
    ${actionsHtml ? `<div class="flex flex-wrap items-center gap-2 shrink-0">${actionsHtml}</div>` : ''}
  </div>`;
}

export function statCard(label, value, iconClass, iconSvg, hint = '') {
  return `<div class="stat-card">
    <div class="stat-icon ${iconClass}">${iconSvg}</div>
    <p class="text-sm font-medium text-slate-500">${escapeHtml(label)}</p>
    <p class="text-3xl font-bold text-slate-900 mt-1 tracking-tight">${escapeHtml(value)}</p>
    ${hint ? `<p class="text-xs text-slate-400 mt-1">${escapeHtml(hint)}</p>` : ''}
  </div>`;
}

export function emptyState(title, description) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icons.students}</div>
    <h3 class="font-semibold text-slate-800">${escapeHtml(title)}</h3>
    <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">${escapeHtml(description)}</p>
  </div>`;
}

export function btnPrimary(label, attrs = '', { icon = true } = {}) {
  return `<button type="button" class="btn btn-primary" ${attrs}>${icon ? icons.plus : ''}${escapeHtml(label)}</button>`;
}

export function btnPrimarySubmit(label) {
  return `<button type="submit" class="btn btn-primary">${escapeHtml(label)}</button>`;
}

export function btnSecondary(label, attrs = '') {
  return `<button type="button" class="btn btn-secondary" ${attrs}>${escapeHtml(label)}</button>`;
}

export function btnDanger(label, attrs = '') {
  return `<button type="button" class="btn btn-danger" ${attrs}>${escapeHtml(label)}</button>`;
}

export function tableActions(editId, deleteId) {
  return `<div class="flex items-center gap-1">
    <button type="button" data-edit="${editId}" class="btn btn-ghost text-sm">Edit</button>
    <button type="button" data-delete="${deleteId}" class="btn btn-danger-ghost">Delete</button>
  </div>`;
}

export function formField(label, name, { type = 'text', value = '', required = false, colspan = '', options = [], rows = 3 } = {}) {
  const col = colspan ? `sm:col-span-${colspan}` : '';
  const extra = type === 'number' ? 'step="0.01" min="0" max="100"' : '';
  if (type === 'textarea') {
    return `<div class="${col}">
      <label class="${labelCls}" for="${name}">${escapeHtml(label)}</label>
      <textarea id="${name}" name="${name}" rows="${rows}" class="${inputCls}" ${required ? 'required' : ''}>${escapeHtml(value)}</textarea>
    </div>`;
  }
  if (type === 'select') {
    return `<div class="${col}">
      <label class="${labelCls}" for="${name}">${escapeHtml(label)}</label>
      <select id="${name}" name="${name}" class="${selectCls}" ${required ? 'required' : ''}>
        ${options.map((o) => `<option value="${escapeHtml(o.value)}" ${o.selected ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
      </select>
    </div>`;
  }
  return `<div class="${col}">
    <label class="${labelCls}" for="${name}">${escapeHtml(label)}</label>
    <input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" class="${inputCls}" ${extra} ${required ? 'required' : ''} />
  </div>`;
}

export function modalShell(title, subtitle, bodyHtml, footerHtml) {
  return `
    <div class="modal-header flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">${escapeHtml(title)}</h3>
        ${subtitle ? `<p class="text-sm text-slate-500 mt-0.5">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <button type="button" data-modal-close class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">${icons.x}</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">${footerHtml}</div>`;
}

export function gradeClass(value) {
  const n = Number(value);
  if (n >= 90) return 'grade-excellent';
  if (n >= 80) return 'grade-good';
  if (n >= 75) return 'grade-fair';
  return 'grade-low';
}

export function avatarInitials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
}

/** Student list/detail avatar: photo when available, otherwise initials. */
export function studentAvatar(student, { size = 'md', className = '' } = {}) {
  const name = student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
  const initials = avatarInitials(name);
  const sizes = {
    sm: 'w-9 h-9 rounded-lg text-xs',
    md: 'w-16 h-16 rounded-2xl text-2xl',
    lg: 'w-20 h-20 rounded-2xl text-2xl',
  };
  const cls = `${sizes[size] || sizes.md} shrink-0 object-cover border border-slate-200 ${className}`.trim();

  if (student?.photo_url) {
    return `<img src="${escapeHtml(student.photo_url)}" alt="" class="${cls} bg-slate-100" />`;
  }

  return `<div class="${cls} bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">${escapeHtml(initials)}</div>`;
}

export function errorAlert(message) {
  return `<div class="alert-error">${icons.alert}<span>${escapeHtml(message)}</span></div>`;
}

export function paginationBar(pagination) {
  if (!pagination || pagination.last_page <= 1) {
    return pagination?.total
      ? `<div class="pagination-bar"><p class="text-sm text-slate-500">${pagination.total} record${pagination.total === 1 ? '' : 's'}</p></div>`
      : '';
  }
  const { current_page, last_page, total } = pagination;
  return `<div class="pagination-bar" data-pagination>
    <p class="text-sm text-slate-500">Page ${current_page} of ${last_page} · ${total} total</p>
    <div class="flex gap-2">
      <button type="button" class="btn btn-secondary !py-1.5 !px-3 text-xs" data-page="${current_page - 1}" ${current_page <= 1 ? 'disabled' : ''}>Previous</button>
      <button type="button" class="btn btn-secondary !py-1.5 !px-3 text-xs" data-page="${current_page + 1}" ${current_page >= last_page ? 'disabled' : ''}>Next</button>
    </div>
  </div>`;
}

export function bindPagination(container, onPageChange) {
  container.querySelector('[data-pagination]')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) return;
    onPageChange(Number(btn.dataset.page));
  });
}

export function barChart(distribution) {
  if (!distribution?.length) return '<p class="text-sm text-slate-500 py-4">No grade data yet.</p>';
  const max = Math.max(...distribution.map((d) => d.count), 1);
  return `<div class="chart-bars space-y-3">${distribution.map((d) => `
    <div class="chart-row">
      <span class="chart-label">${escapeHtml(d.label)}</span>
      <div class="chart-track"><div class="chart-fill" style="width:${Math.round((d.count / max) * 100)}%"></div></div>
      <span class="chart-value">${escapeHtml(d.count)}</span>
    </div>`).join('')}</div>`;
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const footer = `${btnSecondary('Cancel', 'data-confirm-cancel type="button"')}${
      danger ? btnDanger(confirmLabel, 'data-confirm-ok type="button"') : `<button type="button" class="btn btn-primary" data-confirm-ok>${escapeHtml(confirmLabel)}</button>`
    }`;
    openModal(modalShell(title, '', `<p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(message)}</p>`, footer));
    const panel = document.getElementById('modal-panel');
    const done = (v) => { closeModal(); resolve(v); };
    panel.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => done(false), { once: true });
    panel.querySelector('[data-confirm-ok]')?.addEventListener('click', () => done(true), { once: true });
  });
}

export function formatRelativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}
