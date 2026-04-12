import React from 'react';

const emojiOptions = ['❤️', '😂', '🔥', '👍'];

const MessageBubble = ({
  message,
  isOwn,
  onReact,
  onEdit,
  onDelete,
  canEdit = false,
  showRead = false
}) => {
  const [burstEmoji, setBurstEmoji] = React.useState(null);
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const reactionsCount = (message.reactions || []).reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});

  const handleEdit = () => {
    const updated = window.prompt('Edit message', message.content);
    if (updated !== null && updated.trim() && updated.trim() !== message.content) {
      onEdit?.(message._id, updated.trim());
    }
  };

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`} style={{ animation: 'fadeIn 220ms ease' }}>
      <div className={`max-w-[86%] sm:max-w-[76%] lg:max-w-[58%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'ustwo-brand-gradient text-white rounded-br-md shadow-[0_10px_20px_rgba(171,88,141,0.3)]'
              : 'bg-white/92 text-gray-800 border border-pink-100 rounded-bl-md backdrop-blur-sm'
          }`}
        >
          <p className={`text-sm ${message.deleted ? 'italic opacity-80' : ''}`}>{message.content}</p>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className={`text-[11px] ${isOwn ? 'text-pink-100' : 'text-gray-500'}`}>
              {time} {message.edited ? '· edited' : ''}
            </span>
            {isOwn && showRead && (
              <span className="text-[11px] text-pink-100">{message.read ? 'Seen' : 'Sent'}</span>
            )}
          </div>
        </div>

        {/* Reactions summary */}
        {Object.keys(reactionsCount).length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {Object.entries(reactionsCount).map(([emoji, count]) => (
              <span
                key={emoji}
                className="text-xs bg-white/90 border border-pink-100 rounded-full px-2 py-0.5 shadow-sm"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {!message.deleted && (
          <div className="flex gap-1 flex-wrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setBurstEmoji(emoji);
                  window.setTimeout(() => setBurstEmoji(null), 500);
                  onReact?.(message._id, emoji);
                }}
                className="text-xs bg-white/90 border border-pink-100 rounded-full px-2 py-0.5 hover:bg-pink-50 hover:-translate-y-0.5 transition"
              >
                {emoji}
              </button>
            ))}

            {canEdit && (
              <>
                <button
                  onClick={handleEdit}
                  className="text-xs bg-white border border-blue-100 text-blue-600 rounded-full px-2 py-0.5 hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(message._id)}
                  className="text-xs bg-white border border-red-100 text-red-600 rounded-full px-2 py-0.5 hover:bg-red-50"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {burstEmoji && (
          <span className="text-lg pointer-events-none animate-float-soft">{burstEmoji}</span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
