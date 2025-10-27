export default function PlayersList({ players, maxPlayers, currentUserId, hostId }) {
  return (
    <div className="bg-black/80 border-2 border-yellow-600 rounded-xl p-3 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-yellow-400 mb-3">
        Players ({players.length}/{maxPlayers || '?'})
      </h2>
      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-yellow-100/40 text-sm text-center">No players yet</p>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-black/60 rounded-lg p-3 border border-yellow-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 font-bold text-sm">
                    {player.userName}
                    {player.userId === currentUserId && (
                      <span className="ml-2 text-xs text-yellow-400">(You)</span>
                    )}
                    {player.userId === hostId && (
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
  );
}
