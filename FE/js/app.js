import { getToken, getUser, login, logout, refreshUser } from './auth.js';
import { registerRoute, resolveRoute } from './router.js';
import { toast, formatErrors, avatarInitials } from './ui.js';
import { icons } from './icons.js';
import { ApiError } from './api.js';
import { renderAdminDashboard } from './pages/admin-dashboard.js';
import { renderAdminStudents } from './pages/admin-students.js';
import { renderAdminGrades } from './pages/admin-grades.js';
import { renderAdminSubjects } from './pages/admin-subjects.js';
import { renderStudentDashboard } from './pages/student-dashboard.js';
import { renderSettings } from './pages/settings.js';
import { renderAdminEnrollments } from './pages/admin-enrollments.js';

const viewLogin = document.getElementById('view-login');
const viewApp = document.getElementById('view-app');
const mainContent = document.getElementById('main-content');
const sidebarNav = document.getElementById('sidebar-nav');

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard', icon: icons.dashboard },
  { path: '/admin/students', label: 'Students', icon: icons.students },
  { path: '/admin/enrollments', label: 'Enrollments', icon: icons.users },
  { path: '/admin/subjects', label: 'Subjects', icon: icons.records },
  { path: '/admin/grades', label: 'Grade records', icon: icons.grades },
  { path: '/settings', label: 'Settings', icon: icons.settings },
];

const STUDENT_NAV = [
  { path: '/student', label: 'My records', icon: icons.records },
  { path: '/settings', label: 'Settings', icon: icons.settings },
];

function showLoginView() {
  viewLogin.classList.remove('hidden');
  viewApp.classList.add('hidden');
}

function showAppView(user) {
  viewLogin.classList.add('hidden');
  viewApp.classList.remove('hidden');

  document.getElementById('sidebar-user').textContent = user.name;
  document.getElementById('sidebar-email').textContent = user.email || '';
  document.getElementById('sidebar-role').textContent = user.role_label || user.role;
  document.getElementById('user-avatar').textContent = avatarInitials(user.name);

  const nav = user.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const current = window.location.hash.slice(1) || nav[0].path;

  sidebarNav.innerHTML = nav.map((item) => `
    <a href="#${item.path}" class="nav-link ${current === item.path ? 'active' : ''}">
      ${item.icon}
      <span>${item.label}</span>
    </a>`).join('');

  sidebarNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeSidebar());
  });
}

function closeSidebar() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('sidebar-backdrop').classList.add('hidden');
}

function openSidebar() {
  document.getElementById('sidebar').classList.remove('-translate-x-full');
  document.getElementById('sidebar-backdrop').classList.remove('hidden');
}

async function renderPage(renderFn) {
  mainContent.classList.remove('main-content');
  void mainContent.offsetWidth;
  mainContent.classList.add('main-content');
  await renderFn(mainContent);
}

registerRoute('/login', async () => {
  if (getToken()) {
    const user = getUser();
    window.location.hash = user?.role === 'admin' ? '#/admin' : '#/student';
    return;
  }
  showLoginView();
});

registerRoute('/admin', async () => {
  showAppView(getUser());
  await renderPage(renderAdminDashboard);
}, { roles: ['admin'] });

registerRoute('/admin/students', async () => {
  showAppView(getUser());
  await renderPage(renderAdminStudents);
}, { roles: ['admin'] });

registerRoute('/admin/enrollments', async () => {
  showAppView(getUser());
  await renderPage(renderAdminEnrollments);
}, { roles: ['admin'] });

registerRoute('/admin/subjects', async () => {
  showAppView(getUser());
  await renderPage(renderAdminSubjects);
}, { roles: ['admin'] });

registerRoute('/admin/grades', async () => {
  showAppView(getUser());
  await renderPage(renderAdminGrades);
}, { roles: ['admin'] });

registerRoute('/student', async () => {
  showAppView(getUser());
  await renderPage(renderStudentDashboard);
}, { roles: ['student'] });

registerRoute('/settings', async () => {
  showAppView(getUser());
  await renderPage(renderSettings);
}, { roles: ['admin', 'student'] });

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const errText = errEl.querySelector('span') || errEl;
  errEl.classList.add('hidden');
  btn.disabled = true;
  const prevLabel = btn.innerHTML;
  btn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Signing in…';

  try {
    const fd = new FormData(e.target);
    const user = await login(fd.get('email'), fd.get('password'));
    toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
    window.location.hash = user.role === 'admin' ? '#/admin' : '#/student';
  } catch (err) {
    errText.textContent = err instanceof ApiError ? formatErrors(err.errors) || err.message : err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = prevLabel;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout();
  toast('Signed out successfully.', 'info');
  window.location.hash = '#/login';
});

document.getElementById('menu-toggle')?.addEventListener('click', openSidebar);
document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleBtn = document.getElementById('theme-toggle');

function initTheme() {
  if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    themeToggleLightIcon.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    themeToggleDarkIcon.classList.remove('hidden');
  }
}

themeToggleBtn?.addEventListener('click', function() {
  themeToggleDarkIcon.classList.toggle('hidden');
  themeToggleLightIcon.classList.toggle('hidden');

  if (localStorage.getItem('color-theme')) {
    if (localStorage.getItem('color-theme') === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    }
  } else {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    }
  }
});

window.addEventListener('hashchange', () => resolveRoute());

async function init() {
  initTheme();
  if (getToken()) {
    try {
      await refreshUser();
    } catch {
      /* invalid token */
    }
  }
  await resolveRoute();
}

init();
