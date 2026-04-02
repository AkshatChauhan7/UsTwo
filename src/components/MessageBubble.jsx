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
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-white text-gray-800 border border-pink-100'
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
                className="text-xs bg-white border border-pink-100 rounded-full px-2 py-0.5"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {!message.deleted && (
          <div className="flex gap-1 flex-wrap">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message._id, emoji)}
                className="text-xs bg-white border border-pink-100 rounded-full px-2 py-0.5 hover:bg-pink-50"
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
      </div>
    </div>
  );
};

export default MessageBubble;
