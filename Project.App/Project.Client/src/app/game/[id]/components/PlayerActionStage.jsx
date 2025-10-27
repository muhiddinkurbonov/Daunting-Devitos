export default function PlayerActionStage({
  dealerHand,
  playerHands,
  currentPlayer,
  gameState,
  roomPlayers,
  user,
  onHit,
  onStand,
  actionLoading
}) {
  const isCurrentPlayerTurn = roomPlayers[gameState?.currentStage?.index || 0]?.userId === user?.id;
  const currentTurnPlayer = roomPlayers[gameState?.currentStage?.index || 0];

  return (
    <div className="space-y-2">
      {/* Dealer Hand */}
      <div className="bg-black/60 border border-yellow-700 rounded-lg p-2">
        <h3 className="text-yellow-400 font-bold mb-1 text-xs md:text-sm">Dealer</h3>
        <div className="flex gap-1.5 flex-wrap">
          {dealerHand.cards && dealerHand.cards.length > 0 ? (
            dealerHand.cards.map((card, idx) => (
              <div key={idx} className="relative">
                {idx === 1 ? (
                  <div className="w-12 h-18 md:w-16 md:h-24 bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-md border-2 border-yellow-600 shadow-md flex items-center justify-center">
                    <div className="text-yellow-400 text-xl md:text-2xl font-bold">?</div>
                  </div>
                ) : (
                  <img
                    src={card.image}
                    alt={`${card.value} of ${card.suit}`}
                    className="w-12 h-18 md:w-16 md:h-24 rounded-md border-2 border-gray-700 shadow-sm object-cover"
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-yellow-100/40 text-sm">No cards</p>
          )}
        </div>
      </div>

      {/* Player Hand */}
      {currentPlayer && playerHands[currentPlayer.userId] && (
        <div className={`bg-black/60 border rounded-lg p-2 ${
          isCurrentPlayerTurn ? 'border-green-500 border-2' : 'border-yellow-700'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <h3 className={`font-bold text-xs md:text-sm ${
              isCurrentPlayerTurn ? 'text-green-400' : 'text-yellow-400'
            }`}>
              Your Hand
              {isCurrentPlayerTurn && <span className="ml-1 text-xs">&larr; Turn</span>}
            </h3>
            <div className="text-right">
              <div className="text-yellow-200 font-bold text-xs md:text-sm">
                Value: {playerHands[currentPlayer.userId].value}
              </div>
              {playerHands[currentPlayer.userId].bet > 0 && (
                <div className="text-yellow-100/60 text-xs">
                  Bet: ${playerHands[currentPlayer.userId].bet}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {playerHands[currentPlayer.userId].cards?.map((card, idx) => (
              <div key={idx} className="relative">
                <img
                  src={card.image}
                  alt={`${card.value} of ${card.suit}`}
                  className="w-12 h-18 md:w-16 md:h-24 rounded-md border-2 border-gray-700 shadow-sm object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isCurrentPlayerTurn ? (
        <div className="flex gap-3 mt-2">
          <button
            onClick={onHit}
            disabled={actionLoading}
            className="flex-1 py-4 md:py-3 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white font-bold text-lg md:text-base rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all duration-200 border-2 border-blue-700 shadow-lg disabled:opacity-50"
          >
            HIT
          </button>
          <button
            onClick={onStand}
            disabled={actionLoading}
            className="flex-1 py-4 md:py-3 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold text-lg md:text-base rounded-lg hover:from-red-500 hover:to-red-700 transition-all duration-200 border-2 border-red-700 shadow-lg disabled:opacity-50"
          >
            STAND
          </button>
        </div>
      ) : (
        <p className="text-yellow-100/60 text-center mt-4">
          Waiting for {currentTurnPlayer?.userName || 'player'} to make a move...
        </p>
      )}
    </div>
  );
}
