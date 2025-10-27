'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRoom, useGameActions, useGameSSE, usePlayerHands } from '@/lib/hooks';
import { roomService } from '@/lib/api';
import { getCurrentStage } from '@/lib/utils/blackjack';
import GameHeader from './components/GameHeader';
import PlayersList from './components/PlayersList';
import ChatPanel from './components/ChatPanel';
import BettingStage from './components/BettingStage';
import PlayerActionStage from './components/PlayerActionStage';
import FinishRoundStage from './components/FinishRoundStage';

export default function GameClient({ roomId }) {
  const router = useRouter();

  // Auth
  const { user, loading: authLoading } = useAuth();

  // Room data
  const {
    room,
    setRoom,
    roomPlayers,
    setRoomPlayers,
    gameState,
    setGameState,
    gameConfig,
    loading: roomLoading,
    error,
    fetchPlayers,
  } = useRoom(roomId);

  // Player hands
  const { playerHands, dealerHand, fetchPlayerHands, fetchDealerHand } = usePlayerHands(
    roomId,
    roomPlayers,
    gameState,
    room?.deckId
  );

  // Game actions
  const { placeBet, hit, stand, actionLoading } = useGameActions(
    roomId,
    user?.id,
    async () => {
      await fetchPlayers();
      await fetchPlayerHands();
      fetchDealerHand();
    }
  );

  // Local UI state
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Update bet amount when config loads
  useEffect(() => {
    if (gameConfig?.minBet) {
      setBetAmount(gameConfig.minBet);
    }
  }, [gameConfig]);

  // SSE connection
  useGameSSE(roomId, {
    onMessage: (data) => {
      setMessages((prev) => [...prev, { type: 'chat', data }]);
    },
    onRoomUpdate: async (updatedRoom) => {
      if (room && room.hostId !== updatedRoom.hostId) {
        if (updatedRoom.hostId === user?.id) {
          alert('The previous host left. You are now the host!');
        } else {
          alert('The host has left. Host privileges have been transferred.');
        }
      }

      setRoom(updatedRoom);

      if (updatedRoom.gameState) {
        try {
          const parsedState = JSON.parse(updatedRoom.gameState);
          setGameState(parsedState);
        } catch (e) {
          console.error('Failed to parse game state:', e);
        }
      }

      await fetchPlayers();
    },
  });

  // Event handlers
  const handleStartGame = async () => {
    try {
      const updatedRoom = await roomService.startGame(roomId);
      setRoom(updatedRoom);

      if (updatedRoom.gameState) {
        const parsedState = JSON.parse(updatedRoom.gameState);
        setGameState(parsedState);
      }
    } catch (error) {
      alert(`Failed to start game: ${error.message}`);
    }
  };

  const handlePlaceBet = async () => {
    try {
      await placeBet(betAmount);
    } catch (error) {
      alert(`Failed to place bet: ${error.message}`);
    }
  };

  const handleHit = async () => {
    try {
      await hit();
    } catch (error) {
      alert(`Failed to hit: ${error.message}`);
    }
  };

  const handleStand = async () => {
    try {
      await stand();
    } catch (error) {
      alert(`Failed to stand: ${error.message}`);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user) return;

    const currentStage = getCurrentStage(gameState);
    const gameInProgress = room?.isActive && currentStage !== 'init' && currentStage !== 'unknown';

    if (gameInProgress) {
      const confirmLeave = window.confirm(
        'The game is currently in progress. Are you sure you want to leave? Your bet and progress will be lost.'
      );
      if (!confirmLeave) return;
    }

    try {
      await roomService.leaveRoom(roomId, user.id);
      router.push('/rooms');
    } catch (error) {
      alert(`Failed to leave room: ${error.message}`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      await roomService.sendChatMessage(roomId, chatMessage);
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Loading and error states
  if (authLoading || roomLoading) {
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
          <p className="text-yellow-100 mb-4">{error.message || 'An error occurred'}</p>
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

  // Computed values
  const isHost = user && room && user.id === room.hostId;
  const currentStage = getCurrentStage(gameState);
  const gameNotStarted = !gameState?.currentStage || currentStage === 'init' || currentStage === 'unknown';
  const currentPlayer = roomPlayers.find(p => p.userId === user?.id);
  const hasBetPlaced = gameState?.currentStage?.bets && Object.keys(gameState.currentStage.bets).some(id => {
    const player = roomPlayers.find(p => p.id === id);
    return player?.userId === user?.id;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4 md:p-8">
      {/* Header */}
      <GameHeader
        room={room}
        roomId={roomId}
        isActive={room?.isActive}
        currentStage={currentStage}
        onLeaveRoom={handleLeaveRoom}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 max-h-[calc(100vh-12rem)] overflow-hidden">
        {/* Left Sidebar - Players List */}
        <div className="hidden lg:block lg:col-span-1 overflow-hidden">
          <PlayersList
            players={roomPlayers}
            maxPlayers={room?.maxPlayers}
            currentUserId={user?.id}
            hostId={room?.hostId}
          />
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-2 overflow-y-auto">
          <div className="space-y-2">
            {/* Game State Info */}
            <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-3 md:gap-6 flex-wrap">
                  <div>
                    <p className="text-yellow-100/60 text-xs">Stage</p>
                    <p className="text-yellow-200 font-bold text-sm capitalize">{currentStage}</p>
                  </div>
                  <div>
                    <p className="text-yellow-100/60 text-xs">Your Balance</p>
                    <p className="text-yellow-200 font-bold text-sm">${currentPlayer?.balance || 0}</p>
                  </div>
                  {gameConfig && (
                    <div>
                      <p className="text-yellow-100/60 text-xs">Min Bet</p>
                      <p className="text-yellow-200 font-bold text-sm">${gameConfig.minBet}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Host Controls */}
              {isHost && gameNotStarted && (
                <button
                  onClick={handleStartGame}
                  className="w-full py-3 mt-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-black font-bold rounded-lg hover:from-green-500 hover:to-green-700 transition-all duration-200 border-2 border-green-700 shadow-md"
                >
                  Start Game
                </button>
              )}

              {/* Waiting for Host */}
              {!isHost && gameNotStarted && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center mt-2">
                  <p className="text-blue-300">Waiting for host to start the game...</p>
                </div>
              )}
            </div>

            {/* Player Actions */}
            {room?.isActive && !gameNotStarted && (
              <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-2 md:p-3">
                <h2 className="text-base md:text-lg font-bold text-yellow-400 mb-2">Player Actions</h2>

                {/* Render stage-specific components */}
                {currentStage === 'betting' && (
                  <BettingStage
                    gameState={gameState}
                    gameConfig={gameConfig}
                    currentPlayer={currentPlayer}
                    betAmount={betAmount}
                    setBetAmount={setBetAmount}
                    onPlaceBet={handlePlaceBet}
                    roomPlayers={roomPlayers}
                    user={user}
                    hasBetPlaced={hasBetPlaced}
                    actionLoading={actionLoading}
                  />
                )}

                {currentStage === 'player_action' && (
                  <PlayerActionStage
                    dealerHand={dealerHand}
                    playerHands={playerHands}
                    currentPlayer={currentPlayer}
                    gameState={gameState}
                    roomPlayers={roomPlayers}
                    user={user}
                    onHit={handleHit}
                    onStand={handleStand}
                    actionLoading={actionLoading}
                  />
                )}

                {currentStage === 'finish_round' && (
                  <FinishRoundStage
                    dealerHand={dealerHand}
                    playerHands={playerHands}
                    currentPlayer={currentPlayer}
                  />
                )}

                {/* Other stages */}
                {!['betting', 'player_action', 'finish_round'].includes(currentStage) &&
                 currentStage !== 'init' && currentStage !== 'unknown' && (
                  <p className="text-yellow-100/60 text-center">Waiting for game to progress...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className="hidden lg:block lg:col-span-1 overflow-hidden">
          <ChatPanel
            messages={messages}
            chatMessage={chatMessage}
            onChatMessageChange={setChatMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Floating Chat Button - Mobile */}
      {!showMobileChat && (
        <button
          onClick={() => setShowMobileChat(true)}
          className="lg:hidden fixed bottom-4 right-4 w-14 h-14 bg-yellow-600 text-black rounded-full shadow-lg flex items-center justify-center font-bold text-xl z-50 hover:bg-yellow-700"
        >
          💬
        </button>
      )}

      {/* Mobile Chat Overlay */}
      {showMobileChat && (
        <div className="lg:hidden fixed inset-0 bg-black/80 z-40 flex items-end">
          <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 w-full max-h-[70vh] rounded-t-3xl border-t-4 border-yellow-600 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-yellow-600">
              <h2 className="text-xl font-bold text-yellow-400">Chat</h2>
              <button
                onClick={() => setShowMobileChat(false)}
                className="text-yellow-400 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-black/40">
              {messages.length === 0 ? (
                <p className="text-yellow-100/40 text-sm text-center">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="text-yellow-100 text-sm mb-2 bg-black/60 rounded p-2">
                    {msg.data}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-black/60 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-lg bg-black/60 border-2 border-yellow-700 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
