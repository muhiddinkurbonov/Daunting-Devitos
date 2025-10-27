export default function BettingStage({
  gameState,
  gameConfig,
  currentPlayer,
  betAmount,
  setBetAmount,
  onPlaceBet,
  roomPlayers,
  user,
  hasBetPlaced,
  actionLoading
}) {
  return (
    <div className="space-y-2">
      {/* Player Balance */}
      {currentPlayer && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-yellow-100/80">Your Balance:</span>
            <span className="text-yellow-400 font-bold text-xl">${currentPlayer.balance}</span>
          </div>
        </div>
      )}

      {/* Betting Deadline */}
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
          max={currentPlayer?.balance || 1000}
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
          onClick={() => setBetAmount(currentPlayer?.balance || 1000)}
          className="py-2 px-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-300 rounded text-sm font-semibold transition"
        >
          All In
        </button>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={onPlaceBet}
        disabled={hasBetPlaced || actionLoading}
        className="w-full py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 border-2 border-yellow-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {hasBetPlaced ? 'Bet Placed - Waiting for Others' : `Place Bet $${betAmount}`}
      </button>

      {/* Show bets placed */}
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
  );
}
