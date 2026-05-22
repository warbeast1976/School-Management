const routes = new Map();

export function registerRoute(path, handler, options = {}) {
  routes.set(path, { handler, ...options });
}

export function getRoute() {
  const raw = window.location.hash.slice(1) || '/login';
  const path = raw.split('?')[0];
  return path.startsWith('/') ? path : `/${path}`;
}

export async function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

export async function resolveRoute() {
  const path = getRoute();
  const user = (await import('./auth.js')).getUser();

  if (path === '/login' || path === '/forgot-password' || path === '/reset-password') {
    return routes.get(path)?.handler();
  }

  if (!user) {
    window.location.hash = '#/login';
    return;
  }

  const entry = routes.get(path);
  if (!entry) {
    const fallback = user.role === 'admin' ? '/admin' : '/student';
    window.location.hash = `#${fallback}`;
    return;
  }

  if (entry.roles && !entry.roles.includes(user.role)) {
    window.location.hash = user.role === 'admin' ? '#/admin' : '#/student';
    return;
  }

  await entry.handler();
}
