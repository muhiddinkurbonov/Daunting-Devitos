'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GameClient({ roomId }) {
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerHands, setPlayerHands] = useState({}); // { playerId: { cards: [], value: 0 } }
  const [dealerHand, setDealerHand] = useState({ cards: [], value: 0 });
  const eventSourceRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7069';

  // Calculate hand value from cards
  const calculateHandValue = (cards) => {
    if (!cards || cards.length === 0) return 0;

    let total = 0;
    let aces = 0;

    cards.forEach(card => {
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

  // Fetch player hands and cards
  const fetchPlayerHands = async () => {
    if (!roomPlayers || roomPlayers.length === 0 || !room?.deckId) return;

    try {
      const handsData = {};

      for (const player of roomPlayers) {
        // Fetch hands for this player
        const handsRes = await fetch(`${API_URL}/api/rooms/${roomId}/hands/user/${player.userId}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (handsRes.ok) {
          const hands = await handsRes.json();
          console.log(`[fetchPlayerHands] Player ${player.userId} has ${hands.length} hands:`, hands);
          if (hands && hands.length > 0) {
            // Fetch cards for the first hand
            const hand = hands[0];
            console.log(`[fetchPlayerHands] Fetching cards for hand ${hand.id}`);
            const cardsRes = await fetch(
              `${API_URL}/api/rooms/${roomId}/hands/${hand.id}/cards`,
              {
                credentials: 'include',
                cache: 'no-store'
              }
            );

            if (cardsRes.ok) {
              const cards = await cardsRes.json();
              console.log(`[fetchPlayerHands] Got ${cards.length} cards for hand ${hand.id}:`, cards);
              handsData[player.userId] = {
                cards: cards || [],
                value: calculateHandValue(cards || []),
                bet: hand.bet
              };
            } else {
              const errorText = await cardsRes.text();
              console.error(`[fetchPlayerHands] Failed to fetch cards for hand ${hand.id}:`, cardsRes.status, errorText);
            }
          }
        } else {
          console.error(`[fetchPlayerHands] Failed to fetch hands for player ${player.userId}:`, handsRes.status);
        }
      }

      setPlayerHands(handsData);
    } catch (error) {
      console.error('Error fetching player hands:', error);
    }
  };

  // Fetch dealer hand from game state
  const fetchDealerHand = () => {
    if (gameState?.dealerHand && Array.isArray(gameState.dealerHand)) {
      const cards = gameState.dealerHand;
      setDealerHand({
        cards: cards,
        value: calculateHandValue(cards)
      });
    }
  };

  // Fetch room players
  const fetchRoomPlayers = async () => {
    try {
      const playersRes = await fetch(`${API_URL}/api/room/${roomId}/players`, {
        credentials: 'include',
        cache: 'no-store', // Force fresh data, no caching
      });
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        console.log('[GameClient] Players fetched:', playersData);
        console.log('[GameClient] Player count:', playersData.length);
        console.log('[GameClient] Player balances:', playersData.map(p => ({ id: p.userId, balance: p.balance })));
        setRoomPlayers(playersData);
      }
    } catch (e) {
      console.error('Failed to fetch room players:', e);
    }
  };

  // Fetch initial room data and user info
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch user
        const userRes = await fetch(`${API_URL}/api/user/me`, {
          credentials: 'include',
        });
        if (!userRes.ok) {
          router.replace('/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData);

        // Fetch room
        const roomRes = await fetch(`${API_URL}/api/room/${roomId}`, {
          credentials: 'include',
        });
        if (!roomRes.ok) {
          throw new Error('Failed to fetch room');
        }
        const roomData = await roomRes.json();
        setRoom(roomData);

        // Fetch room players
        await fetchRoomPlayers();

        console.log('[GameClient] Room loaded:', roomData);
        console.log('[GameClient] MaxPlayers:', roomData.maxPlayers);

        // Parse game state and config
        try {
          const parsedState = JSON.parse(roomData.gameState);
          console.log('[GameClient] Parsed game state:', parsedState);
          console.log('[GameClient] Current stage:', parsedState?.currentStage);
          console.log('[GameClient] Stage $type:', parsedState?.currentStage?.$type);
          setGameState(parsedState);
        } catch (e) {
          console.error('Failed to parse game state:', e);
        }

        try {
          const parsedConfig = JSON.parse(roomData.gameConfig);
          setGameConfig(parsedConfig);
          setBetAmount(parsedConfig.minBet || 10);
        } catch (e) {
          console.error('Failed to parse game config:', e);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [roomId, API_URL, router]);

  // Setup SSE connection
  useEffect(() => {
    if (!roomId) return;

    const eventSource = new EventSource(`${API_URL}/api/room/${roomId}/events`, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
    };

    eventSource.addEventListener('message', (event) => {
      console.log('[SSE] Message received:', event.data);
      setMessages((prev) => [...prev, { type: 'chat', data: event.data }]);
    });

    eventSource.addEventListener('room_updated', (event) => {
      console.log('[SSE] Room updated:', event.data);
      try {
        const updatedRoom = JSON.parse(event.data);
        console.log('[SSE] Parsed room data:', updatedRoom);
        console.log('[SSE] MaxPlayers:', updatedRoom.maxPlayers);

        // Check if room has been closed (no players left)
        if (updatedRoom.isActive === false) {
          alert('The room has been closed.');
          router.push('/rooms');
          return;
        }

        // Check if host has changed (host left and transferred to someone else)
        if (room && room.hostId !== updatedRoom.hostId) {
          if (updatedRoom.hostId === user?.id) {
            alert('The previous host left. You are now the host!');
          } else {
            alert('The host has left. Host privileges have been transferred.');
          }
        }

        setRoom(updatedRoom);

        // Update game state
        if (updatedRoom.gameState) {
          const parsedState = JSON.parse(updatedRoom.gameState);
          setGameState(parsedState);
        }

        // Refresh room players
        fetchRoomPlayers();
      } catch (e) {
        console.error('Failed to parse room update:', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [roomId, API_URL]);

  // Fetch player hands and dealer hand when game state changes
  useEffect(() => {
    const currentStage = gameState?.currentStage?.$type || gameState?.currentStage?.type;
    console.log('[GameClient] useEffect triggered. currentStage:', currentStage, 'roomPlayers:', roomPlayers?.length, 'room.deckId:', room?.deckId);

    if (currentStage === 'player_action' || currentStage === 'finish_round') {
      console.log('[GameClient] Fetching hands for stage:', currentStage);
      fetchPlayerHands();
      fetchDealerHand();
    }
  }, [gameState, roomPlayers, room]);

  const handleStartGame = async () => {
    try {
      console.log('[StartGame] Starting game for room:', roomId);
      const response = await fetch(`${API_URL}/api/room/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(null),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.title || 'Failed to start game');
      }

      const updatedRoom = await response.json();
      console.log('[StartGame] Updated room received:', updatedRoom);
      setRoom(updatedRoom);

      if (updatedRoom.gameState) {
        const parsedState = JSON.parse(updatedRoom.gameState);
        console.log('[StartGame] Parsed game state:', parsedState);
        console.log('[StartGame] Current stage:', parsedState?.currentStage);
        console.log('[StartGame] Stage $type:', parsedState?.currentStage?.$type);
        setGameState(parsedState);
      } else {
        console.warn('[StartGame] No game state in response');
      }

      console.log('[StartGame] Game started successfully');
    } catch (error) {
      console.error('[StartGame] Error starting game:', error);
      alert(`Failed to start game: ${error.message}`);
    }
  };

  const handlePlayerAction = async (action, data = {}) => {
    if (!user) return;

    try {
      console.log(`[PlayerAction] Performing action: ${action}`, data);
      const response = await fetch(
        `${API_URL}/api/room/${roomId}/player/${user.id}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action, data }),
        }
      );
      console.log(response);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.title || 'Failed to perform action');
      }

      console.log(`[PlayerAction] Action ${action} performed successfully`);

      // Immediately refresh player data and hands
      // This supplements the SSE room_updated event for faster UI update
      await fetchRoomPlayers();
      await fetchPlayerHands();
      await fetchDealerHand();
      console.log('[PlayerAction] Player data and hands refreshed');
    } catch (error) {
      console.error('Error performing action:', error);
      alert(`Failed to perform action: ${error.message}`);
    }
  };

  const handlePlaceBet = () => {
    handlePlayerAction('bet', { amount: betAmount });
  };

  const handleHit = () => {
    handlePlayerAction('hit', {});
  };

  const handleStand = () => {
    handlePlayerAction('stand', {});
  };

  const handleLeaveRoom = async () => {
    if (!user) return;

    // Check if game is active and show confirmation
    const gameInProgress = room?.isActive && currentStage !== 'init' && currentStage !== 'unknown';

    if (gameInProgress) {
      const confirmLeave = window.confirm(
        'The game is currently in progress. Are you sure you want to leave? Your bet and progress will be lost.'
      );
      if (!confirmLeave) return;
    }

    try {
      // Close SSE connection before leaving
      if (eventSourceRef.current) {
        console.log('[handleLeaveRoom] Closing SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const response = await fetch(`${API_URL}/api/room/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.title || 'Failed to leave room');
      }

      // Navigate back to lobby
      console.log('[handleLeaveRoom] Successfully left room, returning to lobby');
      router.push('/rooms');
    } catch (error) {
      console.error('Error leaving room:', error);
      alert(`Failed to leave room: ${error.message}`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      await fetch(`${API_URL}/api/room/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: chatMessage }),
      });

      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-yellow-100 text-2xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="bg-black/80 border-2 border-red-600 rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-yellow-100 mb-4">{error}</p>
          <button
            onClick={() => router.push('/rooms')}
            className="px-4 py-2 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  const isHost = user && room && user.id === room.hostId;
  const currentStage = gameState?.currentStage?.$type || gameState?.currentStage?.type || 'unknown';

  // Game has not started if there's no stage or it's in 'init' stage
  const gameNotStarted = !gameState?.currentStage || currentStage === 'init' || currentStage === 'unknown';

  // Debug logging
  console.log('[GameClient] Render - gameState:', gameState);
  console.log('[GameClient] Render - currentStage:', currentStage);
  console.log('[GameClient] Render - gameNotStarted:', gameNotStarted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4 md:p-8">
      {/* Header */}
      <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
              {room?.description || 'Blackjack Table'}
            </h1>
            <p className="text-yellow-100/60 text-sm font-mono">
              Room ID: {roomId.substring(0, 8)}...
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-sm font-semibold ${
              room?.isActive
                ? 'bg-green-600/20 text-green-300 border border-green-600'
                : 'bg-gray-600/20 text-gray-300 border border-gray-600'
            }`}>
              {room?.isActive ? 'Active' : 'Waiting'}
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-600/80 text-white font-bold rounded-lg hover:bg-red-700 border-2 border-red-700 transition-all duration-200"
              title={room?.isActive && currentStage !== 'init' && currentStage !== 'unknown' ? 'Leave game (will forfeit)' : 'Return to lobby'}
            >
              {room?.isActive && currentStage !== 'init' && currentStage !== 'unknown' ? 'Leave Game' : 'Back to Lobby'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 max-h-[calc(100vh-14rem)] overflow-hidden">
        {/* Left Sidebar - Players List */}
        <div className="xl:col-span-1 overflow-hidden">
          {/* Players List */}
          <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-3 h-full overflow-y-auto">
            <h2 className="text-lg font-bold text-yellow-400 mb-3">
              Players ({roomPlayers.length}/{room?.maxPlayers || '?'})
            </h2>
            <div className="space-y-2">
              {roomPlayers.length === 0 ? (
                <p className="text-yellow-100/40 text-sm text-center">No players yet</p>
              ) : (
                roomPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-black/60 rounded-lg p-3 border border-yellow-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-200 font-bold text-sm">
                          {player.userName}
                          {player.userId === user?.id && (
                            <span className="ml-2 text-xs text-yellow-400">(You)</span>
                          )}
                          {player.userId === room?.hostId && (
                            <span className="ml-2 text-xs text-green-400">(Host)</span>
                          )}
                        </p>
                        <p className="text-yellow-100/60 text-xs">
                          {player.userEmail}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-200 font-bold text-sm">
                          ${player.balance}
                        </p>
                        <p className={`text-xs font-semibold ${
                          player.status === 'Active'
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }`}>
                          {player.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="xl:col-span-2 overflow-y-auto">
          <div className="space-y-3">
          {/* Game State - Compact */}
          <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div>
                  <p className="text-yellow-100/60 text-xs">Stage</p>
                  <p className="text-yellow-200 font-bold text-sm capitalize">{currentStage}</p>
                </div>
                <div>
                  <p className="text-yellow-100/60 text-xs">Your Balance</p>
                  <p className="text-yellow-200 font-bold text-sm">${user?.balance || 0}</p>
                </div>
                {gameConfig && (
                  <>
                    <div>
                      <p className="text-yellow-100/60 text-xs">Min Bet</p>
                      <p className="text-yellow-200 font-bold text-sm">${gameConfig.minBet}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Host Controls */}
            {isHost && gameNotStarted && (
              <button
                onClick={handleStartGame}
                className="w-full py-3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-black font-bold rounded-lg hover:from-green-500 hover:to-green-700 transition-all duration-200 border-2 border-green-700 shadow-md"
              >
                Start Game
              </button>
            )}

            {/* Waiting for Host to Start */}
            {!isHost && gameNotStarted && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
                <p className="text-blue-300">
                  Waiting for host to start the game...
                </p>
              </div>
            )}
          </div>

          {/* Player Actions */}
          {room?.isActive && !gameNotStarted && (
            <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-4">
              <h2 className="text-lg font-bold text-yellow-400 mb-3">Player Actions</h2>

              {currentStage === 'betting' && (
                <div className="space-y-2">
                  {/* Player Balance */}
                  {roomPlayers.find(p => p.userId === user?.id) && (
                    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-100/80">Your Balance:</span>
                        <span className="text-yellow-400 font-bold text-xl">
                          ${roomPlayers.find(p => p.userId === user?.id)?.balance || 0}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Betting Deadline Timer */}
                  {gameState?.currentStage?.deadline && (
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-2 text-center">
                      <span className="text-red-300 text-sm">
                        Betting closes: {new Date(gameState.currentStage.deadline).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Bet Amount Input */}
                  <div>
                    <label className="block text-yellow-100 mb-2 font-semibold">
                      Bet Amount (Min: ${gameConfig?.minBet || 10})
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(parseInt(e.target.value))}
                      min={gameConfig?.minBet || 10}
                      step="10"
                      max={roomPlayers.find(p => p.userId === user?.id)?.balance || 1000}
                      className="w-full px-4 py-2 rounded bg-black/60 border border-yellow-700 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  {/* Quick Bet Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setBetAmount(gameConfig?.minBet || 10)}
                      className="py-2 px-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-300 rounded text-sm font-semibold transition"
                    >
                      Min
                    </button>
                    <button
                      onClick={() => setBetAmount((gameConfig?.minBet || 10) * 2)}
                      className="py-2 px-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-300 rounded text-sm font-semibold transition"
                    >
                      2x
                    </button>
                    <button
                      onClick={() => setBetAmount((gameConfig?.minBet || 10) * 5)}
                      className="py-2 px-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-300 rounded text-sm font-semibold transition"
                    >
                      5x
                    </button>
                    <button
                      onClick={() => setBetAmount(roomPlayers.find(p => p.userId === user?.id)?.balance || 1000)}
                      className="py-2 px-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-300 rounded text-sm font-semibold transition"
                    >
                      All In
                    </button>
                  </div>

                  {/* Place Bet Button */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={gameState?.currentStage?.bets && Object.keys(gameState.currentStage.bets).some(id => {
                      const player = roomPlayers.find(p => p.id === id);
                      return player?.userId === user?.id;
                    })}
                    className="w-full py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 border-2 border-yellow-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gameState?.currentStage?.bets && Object.keys(gameState.currentStage.bets).some(id => {
                      const player = roomPlayers.find(p => p.id === id);
                      return player?.userId === user?.id;
                    }) ? 'Bet Placed - Waiting for Others' : `Place Bet $${betAmount}`}
                  </button>

                  {/* Show who has bet */}
                  {gameState?.currentStage?.bets && Object.keys(gameState.currentStage.bets).length > 0 && (
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                      <p className="text-green-300 text-sm mb-2 font-semibold">Bets Placed:</p>
                      <div className="space-y-1">
                        {Object.entries(gameState.currentStage.bets).map(([playerId, amount]) => {
                          const player = roomPlayers.find(p => p.id === playerId);
                          return (
                            <div key={playerId} className="flex justify-between text-sm">
                              <span className="text-green-200">{player?.userName || 'Player'}</span>
                              <span className="text-green-400 font-bold">${amount}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStage === 'player_action' && (
                <div className="space-y-3">
                  {/* Dealer Hand */}
                  <div className="bg-black/60 border border-yellow-700 rounded-lg p-3">
                    <h3 className="text-yellow-400 font-bold mb-2 text-sm">Dealer</h3>
                    <div className="flex gap-2 flex-wrap">
                      {dealerHand.cards && dealerHand.cards.length > 0 ? (
                        dealerHand.cards.map((card, idx) => (
                          <div key={idx} className="relative">
                            {idx === 1 ? (
                              // Card back for hidden dealer card
                              <div className="w-16 h-24 bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-lg border-2 border-yellow-600 shadow-md flex items-center justify-center">
                                <div className="text-yellow-400 text-2xl font-bold">?</div>
                              </div>
                            ) : (
                              // Show actual card image
                              <img
                                src={card.image}
                                alt={`${card.value} of ${card.suit}`}
                                className="w-16 h-24 rounded-lg border-2 border-gray-700 shadow-md object-cover"
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-yellow-100/40 text-sm">No cards</p>
                      )}
                    </div>
                  </div>

                  {/* Player Hands - Only show current user's hand */}
                  {roomPlayers.filter(p => p.userId === user?.id).map((player) => {
                    const hand = playerHands[player.userId];
                    const isCurrentPlayer = gameState?.currentStage?.index !== undefined &&
                                          roomPlayers[gameState.currentStage.index]?.userId === player.userId;

                    return (
                      <div key={player.userId} className={`bg-black/60 border rounded-lg p-3 ${
                        isCurrentPlayer ? 'border-green-500 border-2' : 'border-yellow-700'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className={`font-bold text-sm ${isCurrentPlayer ? 'text-green-400' : 'text-yellow-400'}`}>
                            Your Hand
                            {isCurrentPlayer && <span className="ml-2 text-xs">&larr; Your Turn</span>}
                          </h3>
                          {hand && (
                            <div className="text-right">
                              <div className="text-yellow-200 font-bold text-sm">Value: {hand.value}</div>
                              {hand.bet > 0 && <div className="text-yellow-100/60 text-xs">Bet: ${hand.bet}</div>}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {hand && hand.cards && hand.cards.length > 0 ? (
                            hand.cards.map((card, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={card.image}
                                  alt={`${card.value} of ${card.suit}`}
                                  className="w-16 h-24 rounded-lg border-2 border-gray-700 shadow-md object-cover hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                            ))
                          ) : (
                            <p className="text-yellow-100/40 text-sm">No cards</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Action Buttons - only enabled for current player */}
                  {roomPlayers[gameState?.currentStage?.index || 0]?.userId === user?.id && (
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={handleHit}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all duration-200 border-2 border-blue-700 shadow-md"
                      >
                        Hit
                      </button>
                      <button
                        onClick={handleStand}
                        className="flex-1 py-3 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-700 transition-all duration-200 border-2 border-red-700 shadow-md"
                      >
                        Stand
                      </button>
                    </div>
                  )}

                  {roomPlayers[gameState?.currentStage?.index || 0]?.userId !== user?.id && (
                    <p className="text-yellow-100/60 text-center mt-4">
                      Waiting for {roomPlayers[gameState?.currentStage?.index || 0]?.userName || 'player'} to make a move...
                    </p>
                  )}
                </div>
              )}

              {!['betting', 'player_action'].includes(currentStage) && currentStage !== 'init' && currentStage !== 'unknown' && (
                <div className="space-y-4">
                  {currentStage === 'finish_round' ? (
                    <>
                      <h2 className="text-xl font-bold text-yellow-400 text-center mb-4">Round Complete!</h2>

                      {/* Dealer Final Hand */}
                      <div className="bg-black/60 border border-yellow-700 rounded-lg p-4">
                        <h3 className="text-yellow-400 font-bold mb-2">Dealer - Final Hand (Value: {dealerHand.value})</h3>
                        <div className="flex gap-3 flex-wrap">
                          {dealerHand.cards && dealerHand.cards.length > 0 ? (
                            dealerHand.cards.map((card, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={card.image}
                                  alt={`${card.value} of ${card.suit}`}
                                  className="w-24 h-36 rounded-lg border-2 border-gray-700 shadow-lg object-cover"
                                />
                              </div>
                            ))
                          ) : (
                            <p className="text-yellow-100/40 text-sm">No cards</p>
                          )}
                        </div>
                      </div>

                      {/* Your Results - Only show current user's hand */}
                      {roomPlayers.filter(p => p.userId === user?.id).map((player) => {
                        const hand = playerHands[player.userId];
                        return (
                          <div key={player.userId} className="bg-black/60 border border-yellow-700 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-yellow-400 font-bold">
                                Your Hand
                              </h3>
                              {hand && (
                                <div className="text-right">
                                  <div className="text-yellow-200 font-bold">Value: {hand.value}</div>
                                  {hand.bet > 0 && <div className="text-yellow-100/60 text-sm">Bet: ${hand.bet}</div>}
                                  <div className="text-green-400 font-bold">Balance: ${player.balance}</div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-3 flex-wrap">
                              {hand && hand.cards && hand.cards.length > 0 ? (
                                hand.cards.map((card, idx) => (
                                  <div key={idx} className="relative">
                                    <img
                                      src={card.image}
                                      alt={`${card.value} of ${card.suit}`}
                                      className="w-16 h-24 rounded-lg border-2 border-gray-700 shadow-md object-cover"
                                    />
                                  </div>
                                ))
                              ) : (
                                <p className="text-yellow-100/40 text-sm">No cards</p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
                        <p className="text-blue-300 mb-4">
                          Check your updated balance above!
                        </p>
                        <button
                          onClick={() => router.push('/rooms')}
                          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 border-2 border-blue-700"
                        >
                          Back to Lobby
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-yellow-100/60 text-center">
                      Waiting for game to progress...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className="xl:col-span-1 overflow-hidden">
          {/* Chat */}
          <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-3 h-full flex flex-col">
            <h2 className="text-lg font-bold text-yellow-400 mb-3">Chat</h2>
            <div className="bg-black/60 rounded-lg p-2 overflow-y-auto mb-3 flex-1 min-h-0">
              {messages.length === 0 ? (
                <p className="text-yellow-100/40 text-sm text-center">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="text-yellow-100 text-sm mb-2">
                    {msg.data}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded bg-black/60 border border-yellow-700 text-yellow-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
