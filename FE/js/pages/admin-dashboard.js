import { apiRequest } from '../api.js';
import { icons } from '../icons.js';
import {
  setPageTitle, escapeHtml, loadingHtml, statCard, pageHeader, errorAlert,
  barChart, gradeClass, formatRelativeTime,
} from '../ui.js';

export async function renderAdminDashboard(container) {
  setPageTitle('Dashboard', 'Analytics and recent activity');
  container.innerHTML = loadingHtml();

  try {
    const res = await apiRequest('/dashboard');
    const d = res.data;
    const t = d.totals;

    const levelRows = Object.entries(d.students_by_grade_level || {})
      .map(([level, count]) => `<div class="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
        <span class="text-slate-600">${escapeHtml(level)}</span>
        <span class="font-semibold text-slate-900">${escapeHtml(count)}</span>
      </div>`).join('') || '<p class="text-sm text-slate-500">No data</p>';

    const recentRows = (d.recent_grades || []).map((g) => `
      <tr>
        <td class="font-medium">${escapeHtml(g.student_name)}</td>
        <td><span class="text-xs font-mono text-indigo-600">${escapeHtml(g.subject_code)}</span></td>
        <td><span class="grade-pill ${gradeClass(g.grade_value)}">${escapeHtml(g.grade_value)}</span></td>
        <td class="text-slate-500 text-sm">${escapeHtml(formatRelativeTime(g.created_at))}</td>
      </tr>`).join('');

    container.innerHTML = `
      ${pageHeader('Dashboard', 'Real-time overview of your academic records.')}
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        ${statCard('Students', t.students, 'indigo', icons.students, `${t.active_students} active`)}
        ${statCard('Grade records', t.grade_records, 'emerald', icons.grades)}
        ${statCard('Subjects', t.subjects, 'amber', icons.records)}
        ${statCard('School average', d.average_grade || '—', 'indigo', icons.grades, 'Across all records')}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div class="card p-6 lg:col-span-2">
          <h3 class="font-semibold text-slate-900">Grade distribution</h3>
          <p class="text-sm text-slate-500 mb-4">How scores are spread across performance bands</p>
          ${barChart(d.grade_distribution)}
        </div>
        <div class="card p-6">
          <h3 class="font-semibold text-slate-900">By grade level</h3>
          <p class="text-sm text-slate-500 mb-4">Enrollment breakdown</p>
          ${levelRows}
        </div>
      </div>
      <div class="table-wrap">
        <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-slate-900">Recent grade entries</h3>
            <p class="text-sm text-slate-500">Latest updates across the system</p>
          </div>
          <a href="#/admin/grades" class="text-sm font-medium text-school-600 hover:text-school-700">View all →</a>
        </div>
        <table class="data-table">
          <thead><tr><th>Student</th><th>Subject</th><th>Grade</th><th>When</th></tr></thead>
          <tbody>${recentRows || '<tr><td colspan="4" class="text-center py-8 text-slate-500">No recent activity</td></tr>'}</tbody>
        </table>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <a href="#/admin/students" class="card p-5 card-hover block group">
          <p class="font-semibold text-slate-900 group-hover:text-school-600 transition-colors">Manage students →</p>
          <p class="text-sm text-slate-500 mt-1">Add, edit, export student roster</p>
        </a>
        <a href="#/admin/grades" class="card p-5 card-hover block group">
          <p class="font-semibold text-slate-900 group-hover:text-school-600 transition-colors">Manage grades →</p>
          <p class="text-sm text-slate-500 mt-1">Record and export grade data</p>
        </a>
      </div>`;
  } catch (err) {
    container.innerHTML = pageHeader('Dashboard') + errorAlert(err.message);
  }
}
