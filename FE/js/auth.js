import { TOKEN_KEY, USER_KEY } from './config.js';
import { apiRequest } from './api.js';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdmin() {
  return getUser()?.role === 'admin';
}

export function isStudent() {
  return getUser()?.role === 'student';
}

export async function login(email, password) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, device_name: 'web-portal' }),
  });
  setSession(res.data.token, res.data.user);
  return res.data.user;
}

export async function logout() {
  try {
    if (getToken()) {
      await apiRequest('/auth/logout', { method: 'POST' });
    }
  } finally {
    clearSession();
  }
}

export async function refreshUser() {
  const res = await apiRequest('/auth/me');
  const user = res.data.user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
