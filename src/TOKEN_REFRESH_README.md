# Token Refresh Mechanism

## Overview

This document explains how token refresh is handled in the Estate Calculator application. The application uses JWT (JSON Web Token) authentication with anonymous users, and tokens expire after 1 hour. When a token expires, the application automatically attempts to refresh it to provide a seamless user experience.

## How It Works

### 1. Initial Authentication

When the application loads, it performs silent authentication by calling the `/api/v1/auth/anonymous` endpoint to get a JWT token. This token is stored in localStorage and included in all subsequent API requests.

The `loginAnonymous()` method always clears any existing token from localStorage before making a new API call. This ensures that we get a fresh token every time the page is refreshed, even if there was an expired token in localStorage.

```javascript
// From MultiStepForm.jsx
useEffect(() => {
  const initializeForm = async () => {
    try {
      // First, perform silent authentication
      await AuthService.loginAnonymous();

      // Then fetch data...
    } catch (error) {
      // Error handling...
    }
  };

  initializeForm();
}, []);
```

### 2. Token Expiration Detection

When a token expires (after 1 hour), API requests will receive a 401 Unauthorized response. The application detects this using an Axios response interceptor:

```javascript
// From auth.js
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If the error is 401 (Unauthorized) and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Token refresh logic...
    }

    return Promise.reject(error);
  }
);
```

### 3. Automatic Token Refresh

When a 401 error is detected, the application automatically attempts to refresh the token:

1. It calls `AuthService.loginAnonymous()` to get a new token
2. It updates the original request with the new token
3. It retries the original request

```javascript
// From auth.js
try {
  // Try to get a new anonymous token
  await AuthService.loginAnonymous();

  // Get the new token
  const token = AuthService.getToken();

  if (!token) {
    throw new Error('Failed to obtain new token');
  }

  // Update the Authorization header with the new token
  originalRequest.headers['Authorization'] = `Bearer ${token}`;

  // Retry the original request with the new token
  return api(originalRequest);
} catch (refreshError) {
  // Error handling...
}
```

### 4. Error Handling

If token refresh fails, the application provides a clear error message to the user:

```javascript
// From MultiStepForm.jsx
if (error.isAuthError) {
  setLoadError(error.authErrorMessage || 'Authentication error. Please refresh the page.');
} else if (error.response && error.response.status === 401) {
  setLoadError('Your session has expired. Please refresh the page to continue.');
} else {
  setLoadError('Failed to load form data. Please try again later.');
}
```

The user is shown an error message with a refresh button, allowing them to easily refresh the page to get a new token.

## Benefits

This token refresh mechanism provides several benefits:

1. **Seamless User Experience**: Most token expirations are handled automatically without user intervention
2. **Clear Error Messages**: If automatic refresh fails, users see clear error messages
3. **Easy Recovery**: Users can easily recover by clicking the refresh button
4. **Security**: Tokens expire after 1 hour, limiting the window of opportunity for token theft

## Troubleshooting

If users report authentication issues:

1. Check browser console for error messages
2. Verify that the `/api/v1/auth/anonymous` endpoint is working correctly
3. Check that JWT keys are properly configured on the server
4. Ensure the token TTL (time to live) is set appropriately in `lexik_jwt_authentication.yaml`
