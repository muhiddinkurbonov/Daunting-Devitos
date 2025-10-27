import apiClient from '../client';

export const roomService = {
  /**
   * Get all public rooms
   * @returns {Promise<Array>} List of public rooms
   */
  getPublicRooms: async () => {
    const response = await apiClient.get('/api/room/public');
    return response.data;
  },

  /**
   * Get user's active rooms
   * @returns {Promise<Array>} List of active rooms
   */
  getActiveRooms: async () => {
    const response = await apiClient.get('/api/room/active');
    return response.data;
  },

  /**
   * Get a single room by ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Room data
   */
  getRoomById: async (roomId) => {
    const response = await apiClient.get(`/api/room/${roomId}`);
    return response.data;
  },

  /**
   * Create a new room
   * @param {Object} roomData - Room creation data
   * @returns {Promise<Object>} Created room data
   */
  createRoom: async (roomData) => {
    const response = await apiClient.post('/api/room', roomData);
    return response.data;
  },

  /**
   * Join a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Join response
   */
  joinRoom: async (roomId) => {
    const response = await apiClient.post(`/api/room/${roomId}/join`);
    return response.data;
  },

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID (optional, backend may get from auth)
   * @returns {Promise<Object>} Leave response
   */
  leaveRoom: async (roomId, userId = null) => {
    const body = userId ? { userId } : {};
    const response = await apiClient.post(`/api/room/${roomId}/leave`, body);
    return response.data;
  },

  /**
   * Get players in a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Array>} List of players
   */
  getRoomPlayers: async (roomId) => {
    const response = await apiClient.get(`/api/room/${roomId}/players`);
    return response.data;
  },

  /**
   * Start the game in a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Start game response
   */
  startGame: async (roomId) => {
    const response = await apiClient.post(`/api/room/${roomId}/start`);
    return response.data;
  },

  /**
   * Send a chat message in a room
   * @param {string} roomId - Room ID
   * @param {string} message - Chat message
   * @returns {Promise<Object>} Chat response
   */
  sendChatMessage: async (roomId, message) => {
    const response = await apiClient.post(`/api/room/${roomId}/chat`, { content: message });
    return response.data;
  },
};
