import { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({ messages, contact, typing }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div
      className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-2"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#fecdd3 transparent" }}
    >
      {/* Date divider */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-rose-100" />
        <span className="text-[11px] text-stone-400 tracking-wide px-1">Today</span>
        <div className="flex-1 h-px bg-rose-100" />
      </div>

      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} contactInitials={contact.initials} />
      ))}

      {typing && <TypingIndicator initials={contact.initials} />}

      <div ref={endRef} />
    </div>
  );
}
