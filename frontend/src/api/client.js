import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // A wrong password on the login form is also a 401; that must show its error, not reload the page.
        const isAuthRequest = error.config?.url?.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default apiClient;