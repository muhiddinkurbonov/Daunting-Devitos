import { useRouter } from 'next/navigation';

export default function FinishRoundStage({ dealerHand, playerHands, currentPlayer }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-yellow-400 text-center mb-4">Round Complete!</h2>

      {/* Dealer Final Hand */}
      <div className="bg-black/60 border border-yellow-700 rounded-lg p-4">
        <h3 className="text-yellow-400 font-bold mb-2">
          Dealer - Final Hand (Value: {dealerHand.value})
        </h3>
        <div className="flex gap-3 flex-wrap">
          {dealerHand.cards?.map((card, idx) => (
            <div key={idx} className="relative">
              <img
                src={card.image}
                alt={`${card.value} of ${card.suit}`}
                className="w-24 h-36 rounded-lg border-2 border-gray-700 shadow-lg object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Your Final Hand */}
      {currentPlayer && playerHands[currentPlayer.userId] && (
        <div className="bg-black/60 border border-yellow-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-yellow-400 font-bold">Your Hand</h3>
            <div className="text-right">
              <div className="text-yellow-200 font-bold">
                Value: {playerHands[currentPlayer.userId].value}
              </div>
              {playerHands[currentPlayer.userId].bet > 0 && (
                <div className="text-yellow-100/60 text-sm">
                  Bet: ${playerHands[currentPlayer.userId].bet}
                </div>
              )}
              <div className="text-green-400 font-bold">Balance: ${currentPlayer.balance}</div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {playerHands[currentPlayer.userId].cards?.map((card, idx) => (
              <div key={idx} className="relative">
                <img
                  src={card.image}
                  alt={`${card.value} of ${card.suit}`}
                  className="w-16 h-24 rounded-lg border-2 border-gray-700 shadow-md object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
        <p className="text-blue-300 mb-4">Check your updated balance above!</p>
        <button
          onClick={() => router.push('/rooms')}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 border-2 border-blue-700"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
