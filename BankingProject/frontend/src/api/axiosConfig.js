import axios from "axios";

const api = axios.create({
  // Use env if provided; default to local backend over HTTP
  // Backend routes are mounted under /api in development
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  // Include cookies for session/CSRF when crossing origins
  withCredentials: true,
});

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Normalize URL to avoid double /api when baseURL already includes it
    if (
      typeof config.url === 'string' &&
      config.url.startsWith('/api/') &&
      typeof config.baseURL === 'string' &&
      config.baseURL.endsWith('/api')
    ) {
      config.url = config.url.replace(/^\/api/, '');
    }

    // Add CSRF token for POST, PUT, DELETE requests
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      let csrfToken = sessionStorage.getItem('csrfToken') || localStorage.getItem('csrfToken');

      // If no CSRF token is present, proactively fetch one from backend
      if (!csrfToken) {
        try {
          const res = await api.get('/api/csrf-token', { withCredentials: true });
          csrfToken = res.headers['x-csrf-token'] || res.data?.csrfToken;
          if (csrfToken) {
            sessionStorage.setItem('csrfToken', csrfToken);
            localStorage.setItem('csrfToken', csrfToken);
          }
        } catch (err) {
          // If we can't fetch a CSRF token, proceed; backend may still reject
          // but we avoid blocking the request pipeline here
          console.warn('Failed to fetch CSRF token before request:', err?.message || err);
        }
      }

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
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("csrfToken");
      localStorage.removeItem("csrfToken");
      window.location.href = "/login";
    } else if (error.response?.status === 403 && error.response?.data?.msg?.includes('CSRF')) {
      // CSRF token invalid or expired - try to get a new one and retry the request
      sessionStorage.removeItem("csrfToken");
      localStorage.removeItem("csrfToken");
      
      // Try to fetch a new CSRF token
      try {
        const res = await api.get('/api/csrf-token', { withCredentials: true });
        const newCsrfToken = res.headers['x-csrf-token'] || res.data?.csrfToken;
        if (newCsrfToken) {
          sessionStorage.setItem('csrfToken', newCsrfToken);
          localStorage.setItem('csrfToken', newCsrfToken);
          console.log('New CSRF token obtained, please retry your request');
        }
      } catch (err) {
        console.warn('Failed to fetch new CSRF token:', err?.message || err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;