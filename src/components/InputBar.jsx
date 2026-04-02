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

  return (
    <div className="px-6 py-4 bg-white border-t border-rose-100 flex items-end gap-3 flex-shrink-0">
      {/* Emoji */}
      <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors flex-shrink-0">
        <svg className="w-5 h-5 stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 13s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>

      {/* Attach */}
      <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors flex-shrink-0">
        <svg className="w-5 h-5 stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      {/* Textarea */}
      <div className="flex-1 flex items-end bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2.5 focus-within:border-rose-300 transition-colors">
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
        className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
      >
        <svg className="w-4 h-4 stroke-white fill-none stroke-2 translate-x-0.5" viewBox="0 0 24 24">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
