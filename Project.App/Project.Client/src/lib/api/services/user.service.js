import apiClient from '../client';

export const userService = {
  /**
   * Get current user information
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/api/user/me');
    return response.data;
  },

  /**
   * Add credits to user balance
   * @param {string} userId - User ID
   * @param {number} amount - Amount to add
   * @returns {Promise<Object>} Updated user data
   */
  addCredits: async (userId, amount) => {
    const response = await apiClient.patch(`/api/user/${userId}/balance`, { amount });
    return response.data;
  },
};
