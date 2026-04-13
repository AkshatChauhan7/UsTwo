import { useRef, useState } from "react";

export default function InputBar({
  input,
  setInput,
  onSend,
  onSendMessage,
  onTyping,
  onStopTyping,
  placeholder,
}) {
  const textareaRef = useRef(null);
  const [localInput, setLocalInput] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const isControlled = typeof input === "string" && typeof setInput === "function";
  const currentInput = isControlled ? input : localInput;
  const updateInput = (value) => {
    if (isControlled) {
      setInput(value);
    } else {
      setLocalInput(value);
    }
  };

  const sendHandler = onSend || onSendMessage;

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    const value = e.target.value;
    updateInput(value);

    if (value.trim()) {
      onTyping?.();
    } else {
      onStopTyping?.();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleSend = () => {
    const message = (currentInput || "").trim();
    if (!message || !sendHandler) return;
    sendHandler(message);
    updateInput("");
    onStopTyping?.();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const addMoodToken = (token) => {
    const next = `${currentInput || ""}${currentInput ? " " : ""}${token}`;
    updateInput(next);
    onTyping?.();
    setShowQuickActions(false);
  };

  return (
    <div className="px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 border-t border-white/40 bg-white/55 backdrop-blur-xl flex items-end gap-2 flex-shrink-0 relative">
      <div className="relative">
        <button
          onClick={() => setShowQuickActions((prev) => !prev)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 border border-pink-100 text-gray-600 hover:bg-pink-50 transition"
          aria-label="More actions"
        >
          +
        </button>

        {showQuickActions && (
          <div className="absolute bottom-10 sm:bottom-11 left-0 bg-white border border-pink-100 rounded-xl shadow-lg p-1.5 sm:p-2 flex items-center gap-1 z-20">
            {['❤️', '✨', '🫶'].map((token) => (
              <button
                key={token}
                onClick={() => addMoodToken(token)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 border border-pink-100 hover:bg-pink-50 transition"
              >
                {token}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Textarea */}
      <div className="flex-1 flex items-end bg-white/75 border border-pink-100 rounded-2xl px-4 py-2.5 focus-within:border-pink-300 focus-within:shadow-[0_0_0_4px_rgba(233,122,174,0.12)] transition-colors">
        <textarea
          ref={textareaRef}
          rows={1}
          value={currentInput}
          onChange={autoResize}
          onKeyDown={handleKey}
          placeholder={placeholder || "Write something sweet…"}
          className="flex-1 bg-transparent text-sm text-stone-700 placeholder-stone-400 outline-none resize-none max-h-28 leading-relaxed"
          style={{ scrollbarWidth: "none" }}
        />
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!(currentInput || "").trim()}
        aria-label="Send message"
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ustwo-brand-gradient flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_10px_22px_rgba(171,88,141,0.35)]"
      >
        <svg className="w-4 h-4 stroke-white fill-none stroke-2 translate-x-0.5" viewBox="0 0 24 24">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
