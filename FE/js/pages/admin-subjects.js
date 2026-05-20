import { apiRequest, ApiError } from '../api.js';
import { icons } from '../icons.js';
import {
  setPageTitle, escapeHtml, loadingHtml, toast, openModal, closeModal,
  btnPrimary, btnSecondary, formatErrors, pageHeader,
  tableActions, formField, modalShell, emptyState, errorAlert,
  paginationBar, bindPagination, confirmDialog, inputCls
} from '../ui.js';

let subjectsCache = [];

export async function renderAdminSubjects(container) {
  setPageTitle('Subjects', 'Manage course subjects and curriculum');
  if (!container.dataset.page) container.dataset.page = '1';
  container.innerHTML = loadingHtml();
  await loadSubjects(container);
}

async function loadSubjects(container) {
  try {
    const page = container.dataset.page || '1';
    const qs = new URLSearchParams({ per_page: '15', page });

    const res = await apiRequest(`/subjects?${qs}`);
    subjectsCache = res.data.items || res.data;
    const pagination = res.data.pagination;

    const actions = btnPrimary('Add subject', 'id="btn-add-subject"');

    container.innerHTML = `
      ${pageHeader('Subjects', 'Manage subjects, units, and curriculum status.', actions)}
      <div class="table-wrap">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Units</th>
                <th>Status</th>
                <th class="no-print text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsCache.length
    ? subjectsCache.map(row).join('')
    : `<tr><td colspan="5">${emptyState('No subjects found', 'Add a subject to get started.')}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${pagination ? paginationBar(pagination) : ''}
      </div>`;

    bindEvents(container);
    if (pagination) {
      bindPagination(container, (p) => {
        container.dataset.page = String(p);
        loadSubjects(container);
      });
    }
  } catch (err) {
    container.innerHTML = pageHeader('Subjects') + errorAlert(err.message);
  }
}

function row(s) {
  const statusClass = s.is_active ? 'badge-green' : 'badge-slate';
  const statusText = s.is_active ? 'Active' : 'Inactive';
  
  return `<tr>
    <td><span class="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">${escapeHtml(s.code)}</span></td>
    <td>
      <p class="font-medium text-slate-900">${escapeHtml(s.name)}</p>
      ${s.description ? `<p class="text-xs text-slate-500 truncate max-w-xs">${escapeHtml(s.description)}</p>` : ''}
    </td>
    <td>${escapeHtml(s.units)}</td>
    <td><span class="badge ${statusClass}">${statusText}</span></td>
    <td class="no-print text-right">${tableActions(s.id, s.id)}</td>
  </tr>`;
}

function bindEvents(container) {
  document.getElementById('btn-add-subject')?.addEventListener('click', () => showSubjectForm());

  container.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const subject = subjectsCache.find((s) => s.id === Number(btn.dataset.edit));
      if (subject) showSubjectForm(subject);
    });
  });

  container.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const subject = subjectsCache.find((s) => s.id === Number(btn.dataset.delete));
      if (!subject) return;
      const ok = await confirmDialog({
        title: 'Delete subject',
        message: \`Remove \${subject.name} (\${subject.code})? This cannot be undone.\`,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      try {
        await apiRequest(\`/subjects/\${subject.id}\`, { method: 'DELETE' });
        toast('Subject removed successfully.', 'success');
        loadSubjects(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showSubjectForm(subject = null) {
  const isEdit = Boolean(subject);
  const statusOpts = [
    { value: '1', label: 'Active', selected: subject ? subject.is_active : true },
    { value: '0', label: 'Inactive', selected: subject ? !subject.is_active : false },
  ];

  const body = \`
    <p id="form-error" class="hidden alert-error mb-4" role="alert"><span></span></p>
    <form id="subject-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      \${formField('Subject Code', 'code', { value: subject?.code, required: true, placeholder: 'e.g. MATH101' })}
      \${formField('Subject Name', 'name', { value: subject?.name, required: true, placeholder: 'e.g. Calculus I' })}
      \${formField('Units', 'units', { type: 'number', value: subject?.units || 3, required: true })}
      \${formField('Status', 'is_active', { type: 'select', required: true, options: statusOpts })}
      <div class="sm:col-span-2">
        <label for="description" class="label-field">Description</label>
        <textarea id="description" name="description" class="\${inputCls} min-h-[80px]" placeholder="Brief course description">\${escapeHtml(subject?.description || '')}</textarea>
      </div>
    </form>\`;

  openModal(
    modalShell(
      isEdit ? 'Edit subject' : 'Add subject',
      isEdit ? 'Update curriculum details.' : 'Create a new subject in the curriculum.',
      body,
      \`\${btnSecondary('Cancel', 'data-modal-close type="button"')}<button type="submit" form="subject-form" class="btn btn-primary">\${isEdit ? 'Save changes' : 'Create subject'}</button>\`
    ),
    { wide: true }
  );

  document.getElementById('subject-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.is_active = payload.is_active === '1';
    payload.units = Number(payload.units);

    const errEl = document.getElementById('form-error');
    const errSpan = errEl?.querySelector('span');

    try {
      if (isEdit) {
        await apiRequest(\`/subjects/\${subject.id}\`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('Subject updated successfully.', 'success');
      } else {
        await apiRequest('/subjects', { method: 'POST', body: JSON.stringify(payload) });
        toast('Subject created successfully.', 'success');
      }
      closeModal();
      await loadSubjects(document.getElementById('main-content'));
    } catch (err) {
      if (errSpan) errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl?.classList.remove('hidden');
    }
  });
}
