export default function ChatPanel({ messages, chatMessage, onChatMessageChange, onSendMessage }) {
  return (
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
      <form onSubmit={onSendMessage} className="flex gap-2">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => onChatMessageChange(e.target.value)}
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
  );
}
