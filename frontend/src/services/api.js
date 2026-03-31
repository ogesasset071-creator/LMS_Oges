import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../config/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_BASE_URL.endsWith('/') ? '' : '/'}api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
