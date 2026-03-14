import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import { CONTACTS, INITIAL_MESSAGES } from "./data/contacts";

export default function App() {
  const [activeId, setActiveId] = useState(1);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);

  const activeContact  = CONTACTS.find((c) => c.id === activeId) || null;
  const activeMessages = messages[activeId] || [];

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { id: Date.now(), text, sent: true, time: now };

    setMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));
    setInput("");
    setTyping(true);

    // Simulate a reply after 1.8s
    setTimeout(() => {
      setTyping(false);
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const reply = { id: Date.now() + 1, text: "That sounds lovely 💕", sent: false, time: replyTime };
      setMessages((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), reply],
      }));
    }, 1800);
  };

  return (
    <>
      {/* Global keyframe */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-rose-50">
        <Sidebar
          contacts={CONTACTS}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <ChatPanel
          contact={activeContact}
          messages={activeMessages}
          typing={typing}
          input={input}
          setInput={setInput}
          onSend={handleSend}
        />
      </div>
    </>
  );
}
