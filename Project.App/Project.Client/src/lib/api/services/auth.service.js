import apiClient from '../client';

export const authService = {
  /**
   * Login with Google OAuth
   * @param {string} returnUrl - URL to return to after login
   * @returns {Promise} Login response
   */
  login: async (returnUrl = '/rooms') => {
    const response = await apiClient.post(`/auth/login?returnUrl=${returnUrl}`);
    return response.data;
  },

  /**
   * Logout current user
   * @returns {Promise} Logout response
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
