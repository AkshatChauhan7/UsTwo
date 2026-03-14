export default function TypingIndicator({ initials }) {
  return (
    <div className="flex items-end gap-2 mt-1">
      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-[11px] font-semibold text-rose-700 flex-shrink-0">
        {initials}
      </div>
      <div className="bg-white border border-rose-50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full bg-rose-300 block animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
