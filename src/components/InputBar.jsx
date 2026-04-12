import { useEffect, useRef, useState } from "react";

export default function InputBar({
  input,
  setInput,
  onSendMessage,
  onSendMedia,
  onTyping,
  onStopTyping,
  placeholder,
  mediaUploading = false,
}) {
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const quickActionsRef = useRef(null);
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

  const autoResize = (e) => {
    e.target.style.height = "auto";
    const maxHeight = window.innerWidth < 640 ? 84 : 112;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
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

  const handleSend = async () => {
    const message = (currentInput || "").trim();
    if (!message || !onSendMessage) return;

    try {
      await Promise.resolve(onSendMessage(message));
      updateInput("");
      onStopTyping?.();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      // keep current input for retry if send fails
    }
  };

  const handleMediaPicked = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onSendMedia) return;

    await onSendMedia(file, type);
    setShowQuickActions(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!showQuickActions) return;
      if (!quickActionsRef.current?.contains(event.target)) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showQuickActions]);

  return (
    <div className="fixed md:static bottom-0 left-0 right-0 z-30 px-2 sm:px-3 md:px-4 py-2 md:py-3 border-t border-white/40 bg-white/55 backdrop-blur-xl flex items-end gap-2 flex-shrink-0 relative pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="relative" ref={quickActionsRef}>
        <button
          onClick={() => setShowQuickActions((prev) => !prev)}
          className="w-11 h-11 rounded-full bg-white/90 border border-pink-100 text-gray-600 hover:bg-pink-50 transition text-lg min-w-[44px] min-h-[44px]"
          aria-label="More actions"
        >
          +
        </button>

        {showQuickActions && (
          <div className="absolute bottom-14 left-0 bg-white/95 backdrop-blur-md border border-pink-100 rounded-2xl shadow-lg p-2.5 flex flex-col gap-1.5 z-30 min-w-[150px]">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="text-left text-sm px-3 py-2.5 rounded-xl hover:bg-pink-50 transition min-h-[44px]"
            >
              � Photo
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="text-left text-sm px-3 py-2.5 rounded-xl hover:bg-pink-50 transition min-h-[44px]"
            >
              � Video
            </button>
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleMediaPicked(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleMediaPicked(e, "video")}
        />
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
          className="flex-1 bg-transparent text-sm text-stone-700 placeholder-stone-400 outline-none resize-none max-h-[84px] sm:max-h-28 leading-relaxed"
          style={{ scrollbarWidth: "none" }}
        />
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={mediaUploading || !(currentInput || "").trim()}
        aria-label="Send message"
        className="w-11 h-11 rounded-full ustwo-brand-gradient flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_10px_22px_rgba(171,88,141,0.35)] min-w-[44px] min-h-[44px]"
      >
        {mediaUploading ? (
          <span className="inline-block h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
        ) : (
          <svg className="w-4 h-4 stroke-white fill-none stroke-2 translate-x-0.5" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </div>
  );
}
