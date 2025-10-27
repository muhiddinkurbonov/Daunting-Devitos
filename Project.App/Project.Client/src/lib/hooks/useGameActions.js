import { useState } from 'react';
import { gameService } from '../api';

/**
 * Custom hook for game actions
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID
 * @param {Function} onActionComplete - Callback after action completes
 * @returns {Object} Action handlers and loading state
 */
export const useGameActions = (roomId, userId, onActionComplete) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const performAction = async (action, data = {}) => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      console.log(`[GameAction] Performing action: ${action}`, data);
      await gameService.performAction(roomId, userId, { action, data });
      console.log(`[GameAction] Action ${action} performed successfully`);

      // Call callback if provided
      if (onActionComplete) {
        await onActionComplete();
      }
    } catch (err) {
      console.error('Error performing action:', err);
      setActionError(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const placeBet = async (amount) => {
    await performAction('bet', { amount });
  };

  const hit = async () => {
    await performAction('hit');
  };

  const stand = async () => {
    await performAction('stand');
  };

  const doubleDown = async () => {
    await performAction('double');
  };

  return {
    performAction,
    placeBet,
    hit,
    stand,
    doubleDown,
    actionLoading,
    actionError,
  };
};
