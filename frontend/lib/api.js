/**
 * Centralized API client for communicating with Hisaaboo Express Backend
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:7000/api'
        : '/api')
    : (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://localhost:7000/api'));

export async function fetchApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If token is stored in client storage, pass Authorization header as well
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hisaaboo_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Send httpOnly cookies cross-origin
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export default fetchApi;
