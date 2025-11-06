import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for POST, PUT, DELETE requests
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      const csrfToken = sessionStorage.getItem('csrfToken') || localStorage.getItem('csrfToken');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and CSRF token extraction
api.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response header
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
      sessionStorage.setItem('csrfToken', csrfToken);
      // Also store in localStorage as backup
      localStorage.setItem('csrfToken', csrfToken);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      sessionStorage.removeItem("csrfToken");
      localStorage.removeItem("csrfToken");
      window.location.href = "/login";
    } else if (error.response?.status === 403 && error.response?.data?.msg?.includes('CSRF')) {
      // CSRF token invalid or expired - try to get a new one
      sessionStorage.removeItem("csrfToken");
      localStorage.removeItem("csrfToken");
      // Optionally trigger a GET request to get a new CSRF token
      console.warn('CSRF token invalid, please refresh the page');
    }
    return Promise.reject(error);
  }
);

export default api;