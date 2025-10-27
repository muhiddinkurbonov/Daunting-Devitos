/**
 * Calculate the value of a blackjack hand
 * @param {Array} cards - Array of card objects
 * @returns {number} Total hand value
 */
export const calculateHandValue = (cards) => {
  if (!cards || cards.length === 0) return 0;

  let total = 0;
  let aces = 0;

  cards.forEach((card) => {
    const value = card.value.toUpperCase();
    if (value === 'ACE') {
      aces++;
      total += 11;
    } else if (['KING', 'QUEEN', 'JACK'].includes(value)) {
      total += 10;
    } else {
      total += parseInt(value);
    }
  });

  // Adjust for aces
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

/**
 * Check if a hand is blackjack (21 with 2 cards)
 * @param {Array} cards - Array of card objects
 * @returns {boolean} True if blackjack
 */
export const isBlackjack = (cards) => {
  return cards?.length === 2 && calculateHandValue(cards) === 21;
};

/**
 * Check if a hand is busted (over 21)
 * @param {Array} cards - Array of card objects
 * @returns {boolean} True if busted
 */
export const isBusted = (cards) => {
  return calculateHandValue(cards) > 21;
};

/**
 * Parse game state JSON safely
 * @param {string} gameStateJson - JSON string
 * @returns {Object|null} Parsed game state or null
 */
export const parseGameState = (gameStateJson) => {
  try {
    return JSON.parse(gameStateJson);
  } catch (e) {
    console.error('Failed to parse game state:', e);
    return null;
  }
};

/**
 * Parse game config JSON safely
 * @param {string} gameConfigJson - JSON string
 * @returns {Object|null} Parsed game config or null
 */
export const parseGameConfig = (gameConfigJson) => {
  try {
    return JSON.parse(gameConfigJson);
  } catch (e) {
    console.error('Failed to parse game config:', e);
    return null;
  }
};

/**
 * Get current game stage
 * @param {Object} gameState - Game state object
 * @returns {string|null} Current stage type
 */
export const getCurrentStage = (gameState) => {
  return gameState?.currentStage?.$type || gameState?.currentStage?.type || null;
};

/**
 * Check if it's a player's turn
 * @param {Object} gameState - Game state object
 * @param {string} playerId - Player ID to check
 * @returns {boolean} True if it's the player's turn
 */
export const isPlayerTurn = (gameState, playerId) => {
  const currentStage = getCurrentStage(gameState);
  if (currentStage !== 'player_action') return false;

  const currentPlayerIndex = gameState?.currentStage?.index;
  const currentPlayer = gameState?.players?.[currentPlayerIndex];

  return currentPlayer?.userId === playerId;
};
