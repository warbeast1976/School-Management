import { apiRequest } from './api.js';
import {
  getToken,
  getStoredUser,
  setSession,
  clearSession,
  updateStoredUser,
  getRememberedEmail,
  isRememberEnabled,
} from './session.js';

export { getToken, clearSession, getRememberedEmail, isRememberEnabled };

export function getUser() {
  return getStoredUser();
}

export function isAdmin() {
  return getUser()?.role === 'admin';
}

export function isStudent() {
  return getUser()?.role === 'student';
}

export async function login(email, password, { remember = false } = {}) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, device_name: 'web-portal' }),
  });
  setSession(res.data.token, res.data.user, { remember });
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
  updateStoredUser(user);
  return user;
}

export async function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ email, token, password, password_confirmation }) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, password, password_confirmation }),
  });
}
