import { apiRequest, apiDownload, ApiError } from '../api.js';
import { icons } from '../icons.js';
import {
  setPageTitle, escapeHtml, loadingHtml, toast, openModal, closeModal,
  btnPrimary, btnSecondary, formatErrors, pageHeader,
  formField, modalShell, selectCls, emptyState, errorAlert, gradeClass,
  paginationBar, bindPagination, confirmDialog,
} from '../ui.js';

let gradesCache = [];
let subjectsCache = [];
let studentsCache = [];

export async function renderAdminGrades(container) {
  setPageTitle('Grade records', 'Track academic performance by term');
  if (!container.dataset.page) container.dataset.page = '1';
  container.innerHTML = loadingHtml();

  try {
    const [subjectsRes, studentsRes] = await Promise.all([
      apiRequest('/subjects'),
      apiRequest('/students?per_page=100'),
    ]);
    subjectsCache = subjectsRes.data || [];
    studentsCache = studentsRes.data.items || [];
  } catch (err) {
    container.innerHTML = pageHeader('Grade records') + errorAlert(err.message);
    return;
  }

  await loadGrades(container);
}

async function loadGrades(container) {
  try {
    const page = container.dataset.page || '1';
    const studentId = container.dataset.studentFilter || '';
    const qs = new URLSearchParams({ per_page: '15', page });
    if (studentId) qs.set('student_profile_id', studentId);

    const res = await apiRequest(`/grade-records?${qs}`);
    gradesCache = res.data.items || [];
    const pagination = res.data.pagination;

    const filterVal = container.dataset.studentFilter || '';
    const studentOptions = studentsCache.map((s) =>
      `<option value="${s.id}" ${String(s.id) === filterVal ? 'selected' : ''}>${escapeHtml(s.student_number)} — ${escapeHtml(s.full_name)}</option>`
    ).join('');

    const actions = `${btnSecondary('Export CSV', 'id="btn-export-grades"')}${btnPrimary('Add grade', 'id="btn-add-grade"')}`;

    container.innerHTML = `
      ${pageHeader('Grade records', 'Filter by student or add new grade entries.', actions)}
      <div class="table-wrap">
        <div class="table-toolbar no-print">
          <select id="filter-student" class="${selectCls} max-w-sm">
            <option value="">All students</option>
            ${studentOptions}
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Term</th>
                <th>Score</th>
                <th>Letter</th>
                <th class="no-print text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="grades-tbody">
              ${gradesCache.length ? gradesCache.map(gradeRow).join('') : `<tr><td colspan="6">${emptyState('No grades recorded', 'Add a grade entry for a student.')}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${paginationBar(pagination)}
      </div>`;

    document.getElementById('btn-add-grade')?.addEventListener('click', () => showGradeForm());
    document.getElementById('btn-export-grades')?.addEventListener('click', async () => {
      try {
        await apiDownload('/export/grade-records', `grades-${new Date().toISOString().slice(0, 10)}.csv`);
        toast('Export downloaded.', 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    document.getElementById('filter-student')?.addEventListener('change', (e) => {
      container.dataset.studentFilter = e.target.value;
      container.dataset.page = '1';
      loadGrades(container);
    });

    bindGradeActions(container);
    bindPagination(container, (p) => {
      container.dataset.page = String(p);
      loadGrades(container);
    });
  } catch (err) {
    container.innerHTML = pageHeader('Grade records') + errorAlert(err.message);
  }
}

function gradeRow(g) {
  const gc = gradeClass(g.grade_value);
  return `<tr>
    <td class="font-medium text-slate-800">${escapeHtml(g.student?.full_name || '—')}</td>
    <td>
      <span class="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">${escapeHtml(g.subject?.code || '')}</span>
      <span class="text-slate-600 ml-1">${escapeHtml(g.subject?.name || '')}</span>
    </td>
    <td class="text-slate-600 text-sm">${escapeHtml(g.school_year)} · ${escapeHtml(g.semester)}</td>
    <td><span class="grade-pill ${gc}">${escapeHtml(g.grade_value)}</span></td>
    <td><span class="badge badge-indigo">${escapeHtml(g.letter_grade || '—')}</span></td>
    <td class="no-print text-right">
      <div class="flex items-center justify-end gap-1">
        <button type="button" data-edit-grade="${g.id}" class="btn btn-ghost text-sm">Edit</button>
        <button type="button" data-delete-grade="${g.id}" class="btn btn-danger-ghost">Delete</button>
      </div>
    </td>
  </tr>`;
}

function bindGradeActions(container) {
  container.querySelectorAll('[data-edit-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const g = gradesCache.find((x) => x.id === Number(btn.dataset.editGrade));
      if (g) showGradeForm(g);
    });
  });
  container.querySelectorAll('[data-delete-grade]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Delete grade',
        message: 'Remove this grade record permanently?',
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      try {
        await apiRequest(`/grade-records/${btn.dataset.deleteGrade}`, { method: 'DELETE' });
        toast('Grade record deleted.', 'success');
        loadGrades(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showGradeForm(record = null) {
  const isEdit = Boolean(record);
  const studentOpts = studentsCache.map((s) => ({
    value: s.id,
    label: `${s.student_number} — ${s.full_name}`,
    selected: record?.student_profile_id === s.id,
  }));
  const subjectOpts = subjectsCache.map((sub) => ({
    value: sub.id,
    label: `${sub.code} — ${sub.name}`,
    selected: record?.subject_id === sub.id,
  }));
  const semOpts = ['1st', '2nd', 'summer'].map((v) => ({
    value: v,
    label: v,
    selected: record?.semester === v,
  }));

  const body = `
    <p id="grade-form-error" class="hidden alert-error mb-4"><span></span></p>
    <form id="grade-form" class="space-y-4">
      ${formField('Student', 'student_profile_id', { type: 'select', required: true, options: studentOpts })}
      ${formField('Subject', 'subject_id', { type: 'select', required: true, options: subjectOpts })}
      <div class="grid grid-cols-2 gap-4">
        ${formField('School year', 'school_year', { value: record?.school_year || '2025-2026', required: true })}
        ${formField('Semester', 'semester', { type: 'select', required: true, options: semOpts })}
        ${formField('Grade', 'grade_value', { type: 'number', value: record?.grade_value ?? '', required: true })}
        ${formField('Remarks', 'remarks', { value: record?.remarks || '' })}
      </div>
    </form>`;

  openModal(modalShell(
    isEdit ? 'Edit grade' : 'Add grade',
    'Scores are validated server-side. Letter grades are computed automatically.',
    body,
    `${btnSecondary('Cancel', 'data-modal-close type="button"')}<button type="submit" form="grade-form" class="btn btn-primary">${isEdit ? 'Save' : 'Add grade'}</button>`
  ));

  document.getElementById('grade-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.student_profile_id = Number(payload.student_profile_id);
    payload.subject_id = Number(payload.subject_id);
    payload.grade_value = Number(payload.grade_value);

    const errEl = document.getElementById('grade-form-error');
    const errSpan = errEl?.querySelector('span');
    try {
      if (isEdit) {
        await apiRequest(`/grade-records/${record.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('Grade updated.', 'success');
      } else {
        await apiRequest('/grade-records', { method: 'POST', body: JSON.stringify(payload) });
        toast('Grade added.', 'success');
      }
      closeModal();
      await loadGrades(document.getElementById('main-content'));
    } catch (err) {
      if (errSpan) errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl?.classList.remove('hidden');
    }
  });
}
