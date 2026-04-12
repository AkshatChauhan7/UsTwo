import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

/* Shown when no conversation is selected */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-rose-50">
      <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
        <svg className="w-9 h-9 stroke-rose-300 fill-none" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-stone-600">No conversation open</p>
        <p className="text-sm text-stone-400 mt-1 max-w-[220px] leading-relaxed">
          Select someone from the list to start your private chat
        </p>
      </div>
    </div>
  );
}

export default function ChatPanel({ contact, messages, typing, input, setInput, onSend }) {
  if (!contact) {
    return (
      <main className="flex flex-col flex-1 h-full overflow-hidden bg-rose-50">
        <EmptyState />
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 h-full overflow-hidden bg-rose-50">
      <ChatHeader contact={contact} />
      <MessageList messages={messages} contact={contact} typing={typing} />
      <InputBar input={input} setInput={setInput} onSend={onSend} />
    </main>
  );
}
