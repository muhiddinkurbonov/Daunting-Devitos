'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateGameForm from '../components/CreateGameForm';
import { roomService } from '@/lib/api';
import { parseGameConfig } from '@/lib/utils/blackjack';
import { useAuth } from '@/lib/hooks';

export default function RoomsClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [userRooms, setUserRooms] = useState([]);

  // Fetch rooms the user is already in
  const fetchUserRooms = async () => {
    if (!user?.id) return;

    try {
      const activeRooms = await roomService.getActiveRooms();
      const myRooms = [];

      for (const room of activeRooms) {
        if (room.hostId === user.id) {
          myRooms.push(room.id);
          continue;
        }

        // Check if user is a player in this room
        try {
          const players = await roomService.getRoomPlayers(room.id);
          if (players.some(p => p.userId === user.id)) {
            console.log(`[fetchUserRooms] User ${user.id} is in room ${room.id}`);
            myRooms.push(room.id);
          }
        } catch (e) {
          console.error('Error checking room players:', e);
        }
      }

      console.log(`[fetchUserRooms] User rooms found:`, myRooms);
      setUserRooms(myRooms);
    } catch (error) {
      console.error('Error fetching user rooms:', error);
    }
  };

  // Fetch rooms
  const handleRefreshRooms = async () => {
    try {
      const updatedRooms = await roomService.getPublicRooms();
      const activeRooms = updatedRooms.filter(room => room.isActive);
      setRooms(activeRooms);
      setIsLoadingRooms(false);

      // Also fetch user's rooms
      await fetchUserRooms();
    } catch (error) {
      console.error('Error refreshing rooms:', error);
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      console.log('[RoomsClient] ✅ Authenticated as:', user.name);
      handleRefreshRooms();
    }
  }, [user]);

  // Auto-refresh rooms every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        handleRefreshRooms();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleJoinRoom = async (roomId) => {
    if (!user?.id) {
      alert('Please log in first');
      return;
    }

    setJoiningRoomId(roomId);

    try {
      await roomService.joinRoom(roomId);
      console.log('Successfully joined room');
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);

      // If already in room (409 Conflict), just redirect to the room
      if (error.response?.status === 409) {
        const errorMsg = (error.response?.data?.detail || error.response?.data?.Detail || error.message || '').toLowerCase();
        console.log('[JoinRoom] Conflict error message:', errorMsg);

        if (errorMsg.includes('already') || errorMsg.includes('player')) {
          console.log('[JoinRoom] Already in room, redirecting...');
          router.push(`/game/${roomId}`);
          return;
        }
      }

      alert(`Failed to join room: ${error.response?.data?.detail || error.message}`);
      setJoiningRoomId(null);
    }
  };

  // Parse game config to get min bet
  const getMinBet = (room) => {
    const config = parseGameConfig(room.gameConfig);
    return config?.minBet || 0;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-yellow-100 text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden">
      <div className="flex-1 max-w-lg relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Available Game Rooms
          </h2>
          <button
            onClick={handleRefreshRooms}
            className="px-3 py-1 text-sm bg-yellow-600/20 border border-yellow-600 text-yellow-200 rounded-lg hover:bg-yellow-600/30 transition-colors"
          >
            Refresh
          </button>
        </div>
        {isLoadingRooms ? (
          <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-8 text-center">
            <p className="text-yellow-100 text-lg">Loading rooms...</p>
          </div>
        ) : rooms.filter(room => !userRooms.includes(room.id)).length === 0 ? (
          <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-8 text-center">
            <p className="text-yellow-100 text-lg mb-2">No rooms available</p>
            <p className="text-yellow-300 text-sm mb-4">
              {userRooms.length > 0
                ? "You're already in a game!"
                : "Create a new game to get started!"}
            </p>
            {userRooms.length > 0 && (
              <button
                onClick={() => router.push(`/game/${userRooms[0]}`)}
                className="px-4 py-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all duration-200 border-2 border-blue-700 shadow-md"
              >
                Go to Your Game
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {rooms.filter(room => !userRooms.includes(room.id)).map((room) => (
              <li
                key={room.id}
                className="bg-black/80 border-2 border-yellow-600 rounded-xl p-5 shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-yellow-200 font-bold text-lg mb-1">
                      {room.description || 'Blackjack Game'}
                    </div>
                    <div className="text-yellow-100/60 font-mono text-xs mb-2">
                      ID: {room.id.substring(0, 8)}...
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    room.isActive
                      ? 'bg-green-600/20 text-green-300 border border-green-600'
                      : 'bg-gray-600/20 text-gray-300 border border-gray-600'
                  }`}>
                    {room.isActive ? 'Active' : 'Waiting'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-yellow-300 text-sm">
                    Mode: <span className="font-bold text-yellow-200">{room.gameMode}</span>
                  </div>
                  <div className="text-yellow-300 text-sm">
                    Min Bet: <span className="font-bold text-yellow-200">${getMinBet(room)}</span>
                  </div>
                  <div className="text-yellow-300 text-sm">
                    Players: <span className="font-bold text-yellow-200">{room.minPlayers}-{room.maxPlayers}</span>
                  </div>
                  <div className="text-yellow-300 text-sm">
                    Public: <span className="font-bold text-yellow-200">{room.isPublic ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={joiningRoomId === room.id}
                  className="w-full py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 border-2 border-yellow-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joiningRoomId === room.id ? 'Joining...' : 'Join Room'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 flex flex-col items-start md:items-end relative z-10">
        {user && <CreateGameForm userId={user.id} onRoomCreated={handleRefreshRooms} />}
      </div>
    </div>
  );
}
