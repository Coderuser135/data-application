import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function mapKeys(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(mapKeys);
  if (typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const mappedKey = key === 'createdAt' ? 'created_at' : key === 'updatedAt' ? 'updated_at' : key;
      result[mappedKey] = mapKeys(value);
    }
    return result;
  }
  return data;
}

const api = axios.create({ baseURL: API_URL, withCredentials: true });
let refreshPromise = null;

api.interceptors.response.use(
  (response) => { response.data = mapKeys(response.data); return response; },
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/');
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) return Promise.reject(error);
    originalRequest._retry = true;
    refreshPromise ||= axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true }).finally(() => { refreshPromise = null; });
    try {
      await refreshPromise;
      return api(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);

export default api;
