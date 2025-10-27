import { useState, useEffect } from 'react';
import { gameService } from '../api';
import { calculateHandValue } from '../utils/blackjack';

/**
 * Custom hook for fetching and managing player hands
 * @param {string} roomId - Room ID
 * @param {Array} roomPlayers - List of room players
 * @param {Object} gameState - Current game state
 * @param {string} deckId - Deck ID
 * @returns {Object} Player hands and dealer hand
 */
export const usePlayerHands = (roomId, roomPlayers, gameState, deckId) => {
  const [playerHands, setPlayerHands] = useState({});
  const [dealerHand, setDealerHand] = useState({ cards: [], value: 0 });

  const fetchPlayerHands = async () => {
    if (!roomPlayers || roomPlayers.length === 0 || !deckId) {
      console.log('[usePlayerHands] Skipping fetch - missing data');
      return;
    }

    try {
      const handsData = {};

      for (const player of roomPlayers) {
        try {
          // Fetch hands for this player
          const hands = await gameService.getPlayerHands(roomId, player.userId);
          console.log(`[usePlayerHands] Player ${player.userId} has ${hands.length} hands:`, hands);

          if (hands && hands.length > 0) {
            // Fetch cards for the first hand
            const hand = hands[0];
            console.log(`[usePlayerHands] Fetching cards for hand ${hand.id}`);

            const cards = await gameService.getHandCards(roomId, hand.id);
            console.log(`[usePlayerHands] Got ${cards.length} cards for hand ${hand.id}:`, cards);

            handsData[player.userId] = {
              cards: cards || [],
              value: calculateHandValue(cards || []),
              bet: hand.bet,
            };
          }
        } catch (err) {
          console.error(`[usePlayerHands] Error fetching hands for player ${player.userId}:`, err);
        }
      }

      setPlayerHands(handsData);
    } catch (error) {
      console.error('[usePlayerHands] Error fetching player hands:', error);
    }
  };

  const fetchDealerHand = () => {
    if (gameState?.dealerHand && Array.isArray(gameState.dealerHand)) {
      const cards = gameState.dealerHand;
      setDealerHand({
        cards: cards,
        value: calculateHandValue(cards),
      });
    }
  };

  useEffect(() => {
    const currentStage = gameState?.currentStage?.$type || gameState?.currentStage?.type;
    console.log('[usePlayerHands] Stage changed:', currentStage);

    if (currentStage === 'player_action' || currentStage === 'finish_round') {
      console.log('[usePlayerHands] Fetching hands for stage:', currentStage);
      fetchPlayerHands();
      fetchDealerHand();
    }
  }, [gameState, roomPlayers, deckId]);

  return {
    playerHands,
    dealerHand,
    fetchPlayerHands,
    fetchDealerHand,
  };
};
