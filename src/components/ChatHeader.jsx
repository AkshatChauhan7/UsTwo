import Avatar from "./Avatar";

export default function ChatHeader({ contact }) {
  if (!contact) return null;

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-rose-100 flex-shrink-0">
      {/* Left: avatar + name */}
      <div className="flex items-center gap-4">
        <Avatar initials={contact.initials} online={contact.online} />
        <div>
          <p className="text-base font-semibold text-stone-800">{contact.name}</p>
          <p className={`text-xs ${contact.online ? "text-emerald-500" : "text-stone-400"}`}>
            {contact.online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Search in chat */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors" title="Search">
          <svg className="w-[18px] h-[18px] stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {/* Call */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors" title="Call">
          <svg className="w-[18px] h-[18px] stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.53 3.47 2 2 0 0 1 3.5 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>

        {/* Video */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors" title="Video call">
          <svg className="w-[18px] h-[18px] stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>

        {/* More */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors" title="More">
          <svg className="w-[18px] h-[18px] stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
