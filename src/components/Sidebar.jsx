import { useState } from "react";
import Avatar from "./Avatar";

export default function Sidebar({ contacts, activeId, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex flex-col w-80 min-w-[320px] bg-white border-r border-rose-100 h-full">

      {/* ── Brand ── */}
      <div className="px-6 pt-8 pb-5 border-b border-rose-100">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-800">
            us<span className="text-rose-500 italic">two</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-rose-50 border border-rose-100 rounded-full text-sm text-stone-700 placeholder-stone-400 outline-none focus:border-rose-300 transition-colors"
          />
        </div>
      </div>

      {/* ── Section label ── */}
      <p className="px-6 pt-5 pb-2 text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
        Messages
      </p>

      {/* ── Contact list ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {filtered.length === 0 && (
          <p className="px-6 py-8 text-sm text-stone-400 text-center">No results found</p>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-colors ${
              activeId === c.id ? "bg-rose-50 border-r-2 border-rose-400" : "hover:bg-stone-50"
            }`}
          >
            <Avatar initials={c.initials} online={c.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-800 truncate">{c.name}</span>
                <span className="text-[11px] text-stone-400 ml-2 flex-shrink-0">{c.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-stone-400 truncate">{c.preview}</span>
                {c.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-medium">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Profile footer ── */}
      <div className="px-6 py-4 border-t border-rose-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-semibold text-xs select-none">
          Me
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800">Your Profile</p>
          <p className="text-xs text-emerald-500">Online</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors">
          <svg className="w-[18px] h-[18px] stroke-stone-400 fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
