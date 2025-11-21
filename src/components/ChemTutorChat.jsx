// src/components/ChemTutorChat.jsx
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:8080";

const ChemTutorChat = ({ contextSmiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I'm your virtual chemistry tutor. Ask me anything about mechanisms, reagents, or your current reaction.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try{
      const res = await fetch(`${API_BASE_URL}/api/v1/chem_tutor_chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context_smiles: contextSmiles || null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Tutor request failed");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I had trouble processing that question. Please try again.",
        },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white p-4 shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-semibold">
          Ask Chem Tutor
        </span>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">AI Chem Tutor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs underline"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 p-3 space-y-3 overflow-y-auto bg-linear-to-b from-gray-50 to-white"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] text-xs sm:text-sm rounded-2xl px-3 py-2 ${
                  m.role === "user"
                    ? "ml-auto bg-purple-600 text-white rounded-br-sm"
                    : "mr-auto bg-white border border-gray-200 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-2 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="flex-1 text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ask about mechanisms, reagents, steps..."
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChemTutorChat;
