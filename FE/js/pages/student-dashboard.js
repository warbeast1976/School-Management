import { apiRequest } from '../api.js';
import { getUser } from '../auth.js';
import { icons } from '../icons.js';
import {
  setPageTitle, escapeHtml, loadingHtml, pageHeader, gradeClass, errorAlert, avatarInitials,
} from '../ui.js';

export async function renderStudentDashboard(container) {
  setPageTitle('My records', 'Your profile and academic standing');
  container.innerHTML = loadingHtml();

  try {
    const res = await apiRequest('/students/me');
    const profile = res.data;
    const grades = profile.grade_records || [];
    const user = getUser();

    const avg = grades.length
      ? (grades.reduce((sum, g) => sum + Number(g.grade_value), 0) / grades.length).toFixed(2)
      : null;

    const avgClass = avg ? gradeClass(avg) : '';

    container.innerHTML = `
      ${pageHeader(
    'My academic records',
    'Official grades and enrollment details.',
    `<button type="button" id="btn-print" class="btn btn-secondary no-print">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
      Print report
    </button>`
  )}

      <div class="print-report space-y-6" id="report-card">
        <div class="report-hero">
          <div class="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/30">
              ${escapeHtml(avatarInitials(profile.full_name))}
            </div>
            <div>
              <p class="text-indigo-200 text-sm font-medium uppercase tracking-wider">Student report card</p>
              <h1 class="text-2xl sm:text-3xl font-bold mt-1">${escapeHtml(profile.full_name)}</h1>
              <p class="text-indigo-100/90 text-sm mt-1">${escapeHtml(profile.grade_level)}${profile.section ? ` · Section ${escapeHtml(profile.section)}` : ''}</p>
            </div>
            ${avg ? `<div class="sm:ml-auto text-center sm:text-right bg-white/10 rounded-xl px-5 py-3 border border-white/20">
              <p class="text-xs text-indigo-200 uppercase tracking-wide">General average</p>
              <p class="text-3xl font-bold mt-0.5">${escapeHtml(avg)}</p>
            </div>` : ''}
          </div>
        </div>

        <div class="info-grid">
          <div class="info-tile"><dt>Student ID</dt><dd>${escapeHtml(profile.student_number)}</dd></div>
          <div class="info-tile"><dt>Email</dt><dd class="truncate">${escapeHtml(user?.email || profile.user?.email || '')}</dd></div>
          <div class="info-tile"><dt>Enrollment</dt><dd class="capitalize">${escapeHtml(profile.enrollment_status)}</dd></div>
          <div class="info-tile"><dt>Subjects graded</dt><dd>${grades.length}</dd></div>
        </div>

        <div class="table-wrap">
          <div class="px-5 py-4 border-b border-slate-100">
            <h2 class="font-semibold text-slate-900">Grade breakdown</h2>
            <p class="text-sm text-slate-500 mt-0.5">All recorded subjects for the current term</p>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>School year</th>
                  <th>Semester</th>
                  <th>Grade</th>
                  <th>Letter</th>
                </tr>
              </thead>
              <tbody>
                ${grades.length ? grades.map((g) => {
    const gc = gradeClass(g.grade_value);
    return `<tr>
                  <td>
                    <span class="font-mono text-xs text-indigo-600">${escapeHtml(g.subject?.code || '')}</span>
                    <span class="text-slate-700 ml-1">${escapeHtml(g.subject?.name || '')}</span>
                  </td>
                  <td>${escapeHtml(g.school_year)}</td>
                  <td>${escapeHtml(g.semester)}</td>
                  <td><span class="grade-pill ${gc}">${escapeHtml(g.grade_value)}</span></td>
                  <td><span class="badge badge-indigo">${escapeHtml(g.letter_grade || '—')}</span></td>
                </tr>`;
  }).join('') : '<tr><td colspan="5" class="text-center py-12 text-slate-500">No grades on file yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-slate-400 hidden print:block text-center pt-4">Academic Portal · Generated ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
      </div>`;

    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  } catch (err) {
    container.innerHTML = pageHeader('My records') + errorAlert(err.message);
  }
}
