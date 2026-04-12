import Avatar from "./Avatar";

export default function ChatHeader({ contact, onToggleSidebar, showMenuButton = false, isSidebarOpen = false }) {
  if (!contact) return null;

  return (
    <header className="flex items-center justify-between px-3 sm:px-5 md:px-8 py-3 sm:py-4 bg-white border-b border-rose-100 flex-shrink-0">
      {/* Left: avatar + name */}
      <div className="flex items-center gap-4">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors"
            aria-label={isSidebarOpen ? 'Back' : 'Menu'}
          >
            {isSidebarOpen ? (
              <svg className="w-5 h-5 stroke-stone-500 fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 stroke-stone-500 fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        ) : null}
        <Avatar initials={contact.initials} online={contact.online} />
        <div>
          <p className="text-base font-semibold text-stone-800">{contact.name}</p>
          <p className={`text-xs ${contact.online ? "text-emerald-500" : "text-stone-400"}`}>
            {contact.online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="hidden sm:flex items-center gap-1">
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
