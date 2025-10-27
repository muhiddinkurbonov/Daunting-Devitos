import apiClient, { API_BASE_URL } from '../client';

export const gameService = {
  /**
   * Perform a player action (bet, hit, stand)
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {Object} actionData - Action data (type, betAmount, etc.)
   * @returns {Promise<Object>} Action response
   */
  performAction: async (roomId, userId, actionData) => {
    const response = await apiClient.post(
      `/api/room/${roomId}/player/${userId}/action`,
      actionData
    );
    return response.data;
  },

  /**
   * Get player hands
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of player hands
   */
  getPlayerHands: async (roomId, userId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}/hands/user/${userId}`);
    return response.data;
  },

  /**
   * Get cards in a hand
   * @param {string} roomId - Room ID
   * @param {string} handId - Hand ID
   * @returns {Promise<Array>} List of cards
   */
  getHandCards: async (roomId, handId) => {
    const response = await apiClient.get(`/api/rooms/${roomId}/hands/${handId}/cards`);
    return response.data;
  },

  /**
   * Create SSE connection for real-time game updates
   * @param {string} roomId - Room ID
   * @returns {EventSource} EventSource instance
   */
  subscribeToGameEvents: (roomId) => {
    return new EventSource(`${API_BASE_URL}/api/room/${roomId}/events`, {
      withCredentials: true,
    });
  },
};
