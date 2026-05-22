import { API_BASE_URL } from './config.js';
import { getToken, clearSession } from './session.js';

export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let body;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ApiError('Invalid server response.', response.status);
    }
  } else if (response.ok) {
    body = { success: true, data: null, message: 'OK', errors: null };
  } else {
    throw new ApiError('Request failed.', response.status);
  }

  if (!response.ok || body.success === false) {
    if (response.status === 401) {
      clearSession();
      window.location.hash = '#/login';
    }
    throw new ApiError(
      body.message || 'Request failed.',
      response.status,
      body.errors
    );
  }

  return body;
}

/** Multipart form requests (e.g. student photo upload). Do not set Content-Type. */
export async function apiFormRequest(path, formData, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: formData,
  });

  const raw = await response.text();
  let body;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ApiError('Invalid server response.', response.status);
    }
  } else if (response.ok) {
    body = { success: true, data: null, message: 'OK', errors: null };
  } else {
    throw new ApiError('Request failed.', response.status);
  }

  if (!response.ok || body.success === false) {
    if (response.status === 401) {
      clearSession();
      window.location.hash = '#/login';
    }
    throw new ApiError(
      body.message || 'Request failed.',
      response.status,
      body.errors
    );
  }

  return body;
}

/** Download CSV/binary exports (admin reports). */
export async function apiDownload(path, filename) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    clearSession();
    window.location.hash = '#/login';
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!response.ok) {
    throw new ApiError('Download failed. Please try again.', response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
