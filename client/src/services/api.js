import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, ''),
  withCredentials: true, // Needed for cookies
  timeout: 15000,
});

// Normalise errors + handle expired sessions globally.
// Components listen for `auth:expired` if they need to navigate.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.code === 'ECONNABORTED') {
      err.normalizedMessage = 'Request timed out. Please try again.';
    }
    const status = err?.response?.status;
    if (status === 401 && !err?.config?._skipAuthRedirect) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default api;
