import { TOKEN_KEY, USER_KEY, REMEMBER_KEY, REMEMBERED_EMAIL_KEY } from './config.js';

function usePersistentStorage() {
  return localStorage.getItem(REMEMBER_KEY) === '1';
}

function tokenStorage() {
  return usePersistentStorage() ? localStorage : sessionStorage;
}

export function getToken() {
  return tokenStorage().getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

export function getStoredUser() {
  const raw = tokenStorage().getItem(USER_KEY)
    || sessionStorage.getItem(USER_KEY)
    || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user, { remember = false } = {}) {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  if (remember) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, user.email || '');
  } else {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function updateStoredUser(user) {
  const store = tokenStorage();
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function getRememberedEmail() {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
}

export function isRememberEnabled() {
  return localStorage.getItem(REMEMBER_KEY) === '1';
}
