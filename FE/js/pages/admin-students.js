import { apiRequest, apiFormRequest, apiDownload, ApiError } from '../api.js';
import { icons } from '../icons.js';
import {
  profileFieldsHtml, bindPhotoPreview, appendProfileFormData,
} from '../student-profile-form.js';
import {
  setPageTitle, escapeHtml, loadingHtml, toast, openModal, closeModal,
  btnPrimary, btnSecondary, formatErrors, pageHeader,
  tableActions, formField, modalShell, inputCls, emptyState, errorAlert,
  paginationBar, bindPagination, confirmDialog, studentAvatar,
} from '../ui.js';

let studentsCache = [];
let searchTimeout;

export async function renderAdminStudents(container) {
  setPageTitle('Students', 'Manage student accounts and profiles');
  if (!container.dataset.page) container.dataset.page = '1';
  container.innerHTML = loadingHtml();
  await loadStudents(container);
}

async function loadStudents(container) {
  try {
    const search = container.dataset.search || '';
    const page = container.dataset.page || '1';
    const qs = new URLSearchParams({ per_page: '15', page });
    if (search) qs.set('search', search);

    const res = await apiRequest(`/students?${qs}`);
    studentsCache = res.data.items || [];
    const pagination = res.data.pagination;

    const actions = `${btnSecondary('Export CSV', 'id="btn-export-students"')}${btnPrimary('Add student', 'id="btn-add-student"')}`;

    container.innerHTML = `
      ${pageHeader('Students', 'Search, add, and maintain student records.', actions)}
      <div class="table-wrap">
        <div class="table-toolbar no-print">
          <div class="search-wrap">
            ${icons.search}
            <input type="search" id="student-search" placeholder="Search by name, ID, or email…"
              value="${escapeHtml(search)}" class="${inputCls} input-with-icon" />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student</th>
                <th>Level</th>
                <th>Section</th>
                <th>Status</th>
                <th class="no-print text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${studentsCache.length
    ? studentsCache.map(row).join('')
    : `<tr><td colspan="6">${emptyState('No students yet', 'Add your first student to get started.')}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${paginationBar(pagination)}
      </div>`;

    bindEvents(container);
    bindPagination(container, (p) => {
      container.dataset.page = String(p);
      loadStudents(container);
    });
  } catch (err) {
    container.innerHTML = pageHeader('Students') + errorAlert(err.message);
  }
}

function row(s) {
  const statusClass = s.enrollment_status === 'active' ? 'badge-green' : 'badge-slate';
  return `<tr>
    <td><span class="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">${escapeHtml(s.student_number)}</span></td>
    <td>
      <div class="flex items-center gap-3">
        ${studentAvatar(s, { size: 'sm' })}
        <div>
          <p class="font-medium text-slate-900">${escapeHtml(s.full_name)}</p>
          <p class="text-xs text-slate-500">${escapeHtml(s.user?.email || '')}</p>
        </div>
      </div>
    </td>
    <td>${escapeHtml(s.grade_level)}</td>
    <td>${escapeHtml(s.section || '—')}</td>
    <td><span class="badge ${statusClass}">${escapeHtml(s.enrollment_status)}</span></td>
    <td class="no-print text-right">${tableActions(s.id, s.id)}</td>
  </tr>`;
}

function bindEvents(container) {
  document.getElementById('btn-add-student')?.addEventListener('click', () => showStudentForm());
  document.getElementById('btn-export-students')?.addEventListener('click', async () => {
    try {
      await apiDownload('/export/students', `students-${new Date().toISOString().slice(0, 10)}.csv`);
      toast('Export downloaded.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  document.getElementById('student-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      container.dataset.search = e.target.value;
      container.dataset.page = '1';
      loadStudents(container);
    }, 300);
  });

  container.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const student = studentsCache.find((s) => s.id === Number(btn.dataset.edit));
      if (student) showStudentForm(student);
    });
  });

  container.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const student = studentsCache.find((s) => s.id === Number(btn.dataset.delete));
      if (!student) return;
      const ok = await confirmDialog({
        title: 'Delete student',
        message: `Remove ${student.full_name} and their account? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      try {
        await apiRequest(`/students/${student.id}`, { method: 'DELETE' });
        toast('Student removed successfully.', 'success');
        loadStudents(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showStudentForm(student = null) {
  const isEdit = Boolean(student);
  const statusOpts = ['active', 'inactive', 'graduated', 'transferred'].map((v) => ({
    value: v,
    label: v.charAt(0).toUpperCase() + v.slice(1),
    selected: student?.enrollment_status === v,
  }));

  const body = `
    <p id="form-error" class="hidden alert-error mb-4" role="alert"><span></span></p>
    <form id="student-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4" enctype="multipart/form-data">
      <div class="sm:col-span-2">
        <h4 class="text-sm font-semibold text-slate-800 mb-1">Account</h4>
      </div>
      ${formField('First name', 'first_name', { value: student?.first_name, required: true })}
      ${formField('Last name', 'last_name', { value: student?.last_name, required: true })}
      ${formField('Display name', 'name', { value: student?.user?.name, required: true, colspan: '2' })}
      ${formField('Email', 'email', { type: 'email', value: student?.user?.email, required: true })}
      ${formField('Student number', 'student_number', { value: student?.student_number, required: true })}
      ${!isEdit
    ? `${formField('Password', 'password', { type: 'password', required: true })}${formField('Confirm password', 'password_confirmation', { type: 'password', required: true })}`
    : `${formField('New password', 'password', { type: 'password' })}${formField('Confirm password', 'password_confirmation', { type: 'password' })}`}
      <div class="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
        <h4 class="text-sm font-semibold text-slate-800 mb-3">Profile &amp; personal details</h4>
      </div>
      ${profileFieldsHtml(student, { includeAccount: false })}
      <div class="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
        <h4 class="text-sm font-semibold text-slate-800 mb-3">Enrollment</h4>
      </div>
      ${formField('Grade level', 'grade_level', { value: student?.grade_level, required: true })}
      ${formField('Section', 'section', { value: student?.section || '' })}
      ${formField('Enrollment status', 'enrollment_status', { type: 'select', required: true, options: statusOpts, colspan: '2' })}
    </form>`;

  openModal(
    modalShell(
      isEdit ? 'Edit student' : 'Add student',
      isEdit ? 'Update profile, photo, and account details.' : 'Create a student account with full profile information.',
      body,
      `${btnSecondary('Cancel', 'data-modal-close type="button"')}<button type="submit" form="student-form" class="btn btn-primary">${isEdit ? 'Save changes' : 'Create student'}</button>`
    ),
    { wide: true }
  );

  bindPhotoPreview();

  document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    appendProfileFormData(fd);

    const errEl = document.getElementById('form-error');
    const errSpan = errEl?.querySelector('span');

    try {
      if (isEdit) {
        fd.append('_method', 'PUT');
        await apiFormRequest(`/students/${student.id}`, fd, { method: 'POST' });
        toast('Student updated successfully.', 'success');
      } else {
        await apiFormRequest('/students', fd, { method: 'POST' });
        toast('Student created successfully.', 'success');
      }
      closeModal();
      await loadStudents(document.getElementById('main-content'));
    } catch (err) {
      if (errSpan) errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl?.classList.remove('hidden');
    }
  });
}
