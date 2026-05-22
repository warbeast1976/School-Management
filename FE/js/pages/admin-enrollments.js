import { apiRequest, ApiError } from '../api.js';
import {
  setPageTitle, escapeHtml, loadingHtml, toast, openModal, closeModal,
  btnPrimary, btnSecondary, formatErrors, pageHeader,
  formField, modalShell, emptyState, errorAlert,
  paginationBar, bindPagination, confirmDialog, inputCls
} from '../ui.js';

let enrollmentsCache = [];

export async function renderAdminEnrollments(container) {
  setPageTitle('Enrollments', 'Manage student subject enrollments');
  if (!container.dataset.page) container.dataset.page = '1';
  container.innerHTML = loadingHtml();
  await loadEnrollments(container);
}

async function loadEnrollments(container) {
  try {
    const page = container.dataset.page || '1';
    const qs = new URLSearchParams({ per_page: '15', page });

    const res = await apiRequest(`/enrollments?${qs}`);
    enrollmentsCache = res.data.items || res.data;
    const pagination = res.data.pagination;

    const actions = btnPrimary('Assign Subjects', 'id="btn-assign-subjects"');

    container.innerHTML = `
      ${pageHeader('Enrollments', 'Assign and manage subjects for students.', actions)}
      <div class="table-wrap">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Term</th>
                <th>Status</th>
                <th class="no-print text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${enrollmentsCache.length
    ? enrollmentsCache.map(row).join('')
    : `<tr><td colspan="5">${emptyState('No enrollments found', 'Assign subjects to a student to get started.')}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${pagination ? paginationBar(pagination) : ''}
      </div>`;

    bindEvents(container);
    if (pagination) {
      bindPagination(container, (p) => {
        container.dataset.page = String(p);
        loadEnrollments(container);
      });
    }
  } catch (err) {
    container.innerHTML = pageHeader('Enrollments') + errorAlert(err.message);
  }
}

function row(e) {
  const statusColors = {
    'enrolled': 'badge-green',
    'dropped': 'badge-red',
    'completed': 'badge-blue'
  };
  const statusClass = statusColors[e.status] || 'badge-slate';
  
  const student = e.student_profile || e.studentProfile;
  const studentName = student ? escapeHtml(student.first_name + ' ' + student.last_name) : 'Unknown';
  const studentNum = student ? escapeHtml(student.student_number) : '';
  
  const subject = e.subject;
  const subjectStr = subject ? escapeHtml(`${subject.code} - ${subject.name}`) : 'Unknown';
  
  return `<tr>
    <td>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-school-100 to-school-200 dark:from-school-800 dark:to-school-900 text-school-700 dark:text-school-200 flex items-center justify-center font-bold text-sm uppercase shadow-sm border border-school-200 dark:border-school-700">
          ${studentName.charAt(0)}
        </div>
        <div>
          <p class="font-semibold text-slate-900 dark:text-white tracking-tight">${studentName}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${studentNum}</p>
        </div>
      </div>
    </td>
    <td>
      <div class="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <span class="font-mono text-xs font-bold text-school-600 dark:text-school-400 mr-2 bg-school-100 dark:bg-school-900/50 px-1.5 py-0.5 rounded">${subject?.code || ''}</span>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">${subject?.name || ''}</span>
      </div>
    </td>
    <td>
      <p class="text-sm text-slate-800">${escapeHtml(e.school_year)}</p>
      <p class="text-xs text-slate-500">${escapeHtml(e.semester)}</p>
    </td>
    <td><span class="badge ${statusClass} capitalize">${e.status}</span></td>
    <td class="no-print text-right">
      <button type="button" data-delete="${e.id}" class="btn btn-danger-ghost">Delete</button>
    </td>
  </tr>`;
}

function bindEvents(container) {
  document.getElementById('btn-assign-subjects')?.addEventListener('click', () => showAssignForm());

  container.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const enrollment = enrollmentsCache.find((e) => e.id === Number(btn.dataset.delete));
      if (!enrollment) return;
      const student = enrollment.student_profile || enrollment.studentProfile;
      const studentName = student ? student.first_name : 'Student';
      const subjectCode = enrollment.subject ? enrollment.subject.code : 'Subject';
      
      const ok = await confirmDialog({
        title: 'Remove Enrollment',
        message: `Remove ${subjectCode} from ${studentName}'s enrollments?`,
        confirmLabel: 'Remove',
        danger: true,
      });
      if (!ok) return;
      try {
        await apiRequest(`/enrollments/${enrollment.id}`, { method: 'DELETE' });
        toast('Enrollment removed successfully.', 'success');
        loadEnrollments(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

async function showAssignForm() {
  const modalId = 'modal-assign-subjects';
  
  // Fetch lists for the form
  let students = [];
  let subjects = [];
  try {
    const [stRes, suRes] = await Promise.all([
      apiRequest('/students?per_page=100'),
      apiRequest('/subjects?per_page=100')
    ]);
    students = stRes.data.items || stRes.data;
    subjects = suRes.data.items || suRes.data;
  } catch (err) {
    toast('Failed to load form data.', 'error');
    return;
  }

  const studentOpts = students.map(s => ({ value: s.id, label: `${s.student_number} - ${s.first_name} ${s.last_name}` }));

  // Premium UI: Subject selection via cards/checkboxes
  const subjectCards = subjects.map(s => `
    <label class="relative flex cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4 shadow-sm focus:outline-none hover:border-school-400 dark:hover:border-school-500 hover:bg-school-50/50 dark:hover:bg-school-900/20 transition-all duration-200 has-[:checked]:border-school-600 dark:has-[:checked]:border-school-400 has-[:checked]:ring-1 has-[:checked]:ring-school-600 dark:has-[:checked]:ring-school-400 has-[:checked]:bg-school-50 dark:has-[:checked]:bg-school-900/40 group overflow-hidden backdrop-blur-sm">
      <input type="checkbox" name="subject_ids[]" value="${s.id}" class="sr-only" ${!s.is_active ? 'disabled' : ''}>
      <div class="flex flex-col relative z-10">
        <span class="block text-sm font-bold text-slate-900 dark:text-white group-has-[:checked]:text-school-700 dark:group-has-[:checked]:text-school-300">${escapeHtml(s.code)}</span>
        <span class="block text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">${escapeHtml(s.name)}</span>
        <div class="mt-3 flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${s.units} units</span>
        </div>
      </div>
      ${!s.is_active ? '<span class="absolute top-3 right-3 flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="Inactive"></span>' : ''}
      <div class="absolute right-0 bottom-0 opacity-0 group-has-[:checked]:opacity-100 transition-opacity p-2 text-school-600 dark:text-school-400">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
    </label>
  `).join('');

  const body = `
    <p id="assign-error" class="hidden alert-error mb-4" role="alert"><span></span></p>
    <form id="assign-form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${formField('Student', 'student_profile_id', { type: 'select', required: true, options: studentOpts, placeholder: 'Select a student...' })}
        <div class="grid grid-cols-2 gap-4">
          ${formField('School Year', 'school_year', { value: '2026-2027', required: true })}
          ${formField('Semester', 'semester', { type: 'select', required: true, options: [
            { value: '1st', label: '1st Semester', selected: true },
            { value: '2nd', label: '2nd Semester' },
            { value: 'summer', label: 'Summer' }
          ]})}
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 tracking-wide uppercase text-xs">Select Subjects to Assign</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[22rem] overflow-y-auto p-1 scrollbar-hide">
          ${subjectCards}
        </div>
      </div>
    </form>`;

  openModal(
    modalShell(
      'Assign Subjects',
      'Enroll a student in multiple subjects at once.',
      body,
      `${btnSecondary('Cancel', 'data-modal-close type="button"')}<button type="submit" form="assign-form" class="btn btn-primary">Assign Subjects</button>`
    ),
    { wide: true, id: modalId }
  );

  document.getElementById('assign-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    // Collect multiple subject_ids
    const subject_ids = fd.getAll('subject_ids[]');
    if (subject_ids.length === 0) {
      toast('Please select at least one subject.', 'warning');
      return;
    }

    const payload = {
      student_profile_id: fd.get('student_profile_id'),
      school_year: fd.get('school_year'),
      semester: fd.get('semester'),
      subject_ids: subject_ids
    };

    const errEl = document.getElementById('assign-error');
    const errSpan = errEl?.querySelector('span');

    try {
      await apiRequest('/enrollments', { method: 'POST', body: JSON.stringify(payload) });
      toast('Subjects assigned successfully.', 'success');
      closeModal();
      await loadEnrollments(document.getElementById('main-content'));
    } catch (err) {
      if (errSpan) errSpan.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
      errEl?.classList.remove('hidden');
    }
  });
}
