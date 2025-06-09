import api from './api';

// Local storage keys
const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user';

/**
 * Authentication service for JWT authentication
 * Uses only anonymous authentication
 */
const AuthService = {

  /**
   * Login as anonymous user and store JWT token
   * This is used for silent authentication when the form loads
   * @returns {Promise} - Promise with user data
   */
  loginAnonymous: async () => {
    try {
      // Always clear existing token when refreshing the page or when token might be expired
      // This ensures we get a fresh token if the previous one expired
      AuthService.logout();

      // Make a new API call to get a fresh token
      const response = await api.post('/api/v1/auth/anonymous');

      if (response.data.token) {
        // Store token and user data
        localStorage.setItem(TOKEN_KEY, response.data.token);

        // Extract user data from token or response
        const userData = response.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(userData));

        return userData;
      }

      return null;
    } catch (error) {
      console.error('Anonymous login error:', error);
      // Don't throw the error for silent authentication
      // Just return null so the app can continue without authentication
      return null;
    }
  },

  /**
   * Logout user and remove JWT token
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get current user from local storage
   * @returns {Object|null} - User data or null if not logged in
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  /**
   * Get JWT token from local storage
   * @returns {string|null} - JWT token or null if not logged in
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Check if user is logged in
   * @returns {boolean} - True if user is logged in
   */
  isLoggedIn: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

// Add request interceptor to include JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Make sure error.response exists before checking status
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('Token expired, attempting to refresh...');

        // Try to get a new anonymous token
        await AuthService.loginAnonymous();

        // Get the new token
        const token = AuthService.getToken();

        if (!token) {
          throw new Error('Failed to obtain new token');
        }

        console.log('Token refreshed successfully');

        // Update the Authorization header with the new token
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // If getting a new token fails, just clear the current one
        AuthService.logout();
        console.error('Failed to refresh authentication token:', refreshError);

        // Add more specific error information
        error.isAuthError = true;
        error.authErrorMessage = 'Session expired and automatic renewal failed. Please refresh the page.';
      }
    }

    return Promise.reject(error);
  }
);

export default AuthService;
