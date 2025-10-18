import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error);
  },
);


