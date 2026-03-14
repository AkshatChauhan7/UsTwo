export default function MessageBubble({ msg, contactInitials }) {
  return (
    <div
      className={`flex items-end gap-2 ${msg.sent ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "fadeUp .22s ease both" }}
    >
      {/* Received avatar */}
      {!msg.sent && (
        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-[11px] font-semibold text-rose-700 flex-shrink-0 mb-1">
          {contactInitials}
        </div>
      )}

      <div className={`flex flex-col max-w-[58%] ${msg.sent ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            msg.sent
              ? "bg-rose-500 text-white rounded-br-sm"
              : "bg-white text-stone-800 rounded-bl-sm shadow-sm border border-rose-50"
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[10.5px] text-stone-400 mt-1 px-1">{msg.time}</span>
      </div>
    </div>
  );
}
