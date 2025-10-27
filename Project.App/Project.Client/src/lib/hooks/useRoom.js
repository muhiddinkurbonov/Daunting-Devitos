import { useState, useEffect } from 'react';
import { roomService } from '../api';
import { parseGameState, parseGameConfig } from '../utils/blackjack';

/**
 * Custom hook for fetching and managing room data
 * @param {string} roomId - Room ID
 * @returns {Object} Room data, players, game state, and helper functions
 */
export const useRoom = (roomId) => {
  const [room, setRoom] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoom = async () => {
    try {
      const roomData = await roomService.getRoomById(roomId);
      setRoom(roomData);

      // Parse game state and config
      const parsedState = parseGameState(roomData.gameState);
      const parsedConfig = parseGameConfig(roomData.gameConfig);

      setGameState(parsedState);
      setGameConfig(parsedConfig);

      return roomData;
    } catch (err) {
      console.error('Failed to fetch room:', err);
      setError(err);
      throw err;
    }
  };

  const fetchPlayers = async () => {
    try {
      const players = await roomService.getRoomPlayers(roomId);
      setRoomPlayers(players);
      return players;
    } catch (err) {
      console.error('Failed to fetch room players:', err);
      setError(err);
      throw err;
    }
  };

  const startGame = async () => {
    try {
      const updatedRoom = await roomService.startGame(roomId);
      setRoom(updatedRoom);

      const parsedState = parseGameState(updatedRoom.gameState);
      setGameState(parsedState);

      return updatedRoom;
    } catch (err) {
      console.error('Failed to start game:', err);
      throw err;
    }
  };

  const joinRoom = async () => {
    try {
      await roomService.joinRoom(roomId);
      await fetchRoom();
      await fetchPlayers();
    } catch (err) {
      console.error('Failed to join room:', err);
      throw err;
    }
  };

  const leaveRoom = async (userId) => {
    try {
      await roomService.leaveRoom(roomId, userId);
    } catch (err) {
      console.error('Failed to leave room:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchRoom();
        await fetchPlayers();
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchInitialData();
    }
  }, [roomId]);

  return {
    room,
    setRoom,
    roomPlayers,
    setRoomPlayers,
    gameState,
    setGameState,
    gameConfig,
    setGameConfig,
    loading,
    error,
    fetchRoom,
    fetchPlayers,
    startGame,
    joinRoom,
    leaveRoom,
  };
};
