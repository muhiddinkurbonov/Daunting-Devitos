export default function GameHeader({ room, roomId, isActive, currentStage, onLeaveRoom }) {
  const isGameInProgress = isActive && currentStage !== 'init' && currentStage !== 'unknown';

  return (
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
            isActive
              ? 'bg-green-600/20 text-green-300 border border-green-600'
              : 'bg-gray-600/20 text-gray-300 border border-gray-600'
          }`}>
            {isActive ? 'Active' : 'Waiting'}
          </div>
          <button
            onClick={onLeaveRoom}
            className="px-4 py-2 bg-red-600/80 text-white font-bold rounded-lg hover:bg-red-700 border-2 border-red-700 transition-all duration-200"
            title={isGameInProgress ? 'Leave game (will forfeit)' : 'Return to lobby'}
          >
            {isGameInProgress ? 'Leave Game' : 'Back to Lobby'}
          </button>
        </div>
      </div>
    </div>
  );
}
