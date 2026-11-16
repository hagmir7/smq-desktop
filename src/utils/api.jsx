import axios from "axios";

export const DEFAULT_URL = 'http://192.168.1.56:30/api/';

const getSavedUrl = () => {
  try {
    return localStorage.getItem('connection_url') || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
};

export const BASE_URL = getSavedUrl();

const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken') || '';
  } catch {
    return '';
  }
};

export const api = axios.create({
  baseURL: BASE_URL, // camelCase is required by axios
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Re-read on every request so the saved connection is always used
  config.baseURL = getSavedUrl();

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});