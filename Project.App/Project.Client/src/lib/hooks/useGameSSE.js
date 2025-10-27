import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gameService } from '../api';
import { parseGameState } from '../utils/blackjack';

/**
 * Custom hook for Server-Sent Events (SSE) connection
 * @param {string} roomId - Room ID
 * @param {Object} options - Options object
 * @param {Function} options.onRoomUpdate - Callback when room is updated
 * @param {Function} options.onMessage - Callback when message is received
 * @param {Function} options.onError - Callback when error occurs
 * @returns {Object} EventSource ref
 */
export const useGameSSE = (roomId, { onRoomUpdate, onMessage, onError } = {}) => {
  const eventSourceRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!roomId) return;

    console.log('[SSE] Setting up connection for room:', roomId);
    const eventSource = gameService.subscribeToGameEvents(roomId);

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
    };

    eventSource.addEventListener('message', (event) => {
      console.log('[SSE] Message received:', event.data);
      if (onMessage) {
        onMessage(event.data);
      }
    });

    eventSource.addEventListener('room_updated', (event) => {
      console.log('[SSE] Room updated:', event.data);
      try {
        const updatedRoom = JSON.parse(event.data);
        console.log('[SSE] Parsed room data:', updatedRoom);

        // Check if room has been closed
        if (updatedRoom.isActive === false) {
          alert('The room has been closed.');
          router.push('/rooms');
          return;
        }

        if (onRoomUpdate) {
          onRoomUpdate(updatedRoom);
        }
      } catch (e) {
        console.error('[SSE] Failed to parse room update:', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error);
      if (onError) {
        onError(error);
      }
      eventSource.close();
    };

    eventSourceRef.current = eventSource;

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing connection');
        eventSourceRef.current.close();
      }
    };
  }, [roomId, router, onRoomUpdate, onMessage, onError]);

  return { eventSourceRef };
};
