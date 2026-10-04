import axios from 'axios';

/**
 * The Spring Boot API is a separate application. Its URL comes from VITE_API_BASE_URL at
 * build time (e.g. http://localhost:8080 in development, https://api.example.com in production).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const CSRF_HEADER = 'X-XSRF-TOKEN';
const MUTATING = ['post', 'put', 'patch', 'delete'];

/**
 * - withCredentials: the login session is the backend's HTTP session cookie, which must be
 *   sent on cross-origin requests (the backend allows this origin via CORS).
 * - CSRF: the backend returns its current CSRF token in the X-XSRF-TOKEN *response* header
 *   (a cross-origin page can't read the backend's cookies). We keep the latest value and
 *   send it back in the X-XSRF-TOKEN *request* header on state-changing requests.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let csrfToken = null;
let csrfRequest = null;

function rememberToken(headers) {
  const token = headers?.[CSRF_HEADER.toLowerCase()];
  if (token) csrfToken = token;
}

/** Any GET to the API returns a token; /api/auth/me is cheap and allowed anonymously. */
async function fetchCsrfToken() {
  if (!csrfRequest) {
    csrfRequest = axios
      .get(`${API_BASE_URL}/api/auth/me`, { withCredentials: true, validateStatus: () => true })
      .then((res) => rememberToken(res.headers))
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  if (MUTATING.includes((config.method || 'get').toLowerCase())) {
    if (!csrfToken) await fetchCsrfToken();
    if (csrfToken) config.headers[CSRF_HEADER] = csrfToken;
  }
  return config;
});

let unauthorizedHandler = null;

/** AuthContext registers a callback so an expired/disabled session logs the user out in the UI. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => {
    rememberToken(response.headers);
    return response;
  },
  async (error) => {
    const { response, config } = error;
    rememberToken(response?.headers);
    const status = response?.status;
    const url = config?.url || '';

    // A 403 on a write can mean a stale CSRF token (e.g. the session expired): refresh once and retry
    if (status === 403 && config && !config._csrfRetried && MUTATING.includes((config.method || '').toLowerCase())) {
      config._csrfRetried = true;
      csrfToken = null;
      await fetchCsrfToken();
      return api(config);
    }

    if (status === 401 && unauthorizedHandler && !url.startsWith('/api/auth/')) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

/** Clears the cached token (the backend rotates it on login and logout). */
export function resetCsrfToken() {
  csrfToken = null;
}

/** Best human-readable message from an API error ({"message": "..."} bodies or plain text). */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error && !error.response && error.request) {
    return 'Cannot reach the server. Please check your connection and try again.';
  }
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  return fallback;
}

export default api;
