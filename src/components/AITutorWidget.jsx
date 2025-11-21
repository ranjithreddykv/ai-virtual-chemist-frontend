// src/components/AITutorWidget.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAITutor } from "../context/AITutorContext";

export default function AITutorWidget() {
  const { messages, isLoading, askTutor } = useAITutor();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    askTutor(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            borderRadius: "999px",
            padding: "10px 16px",
            border: "none",
            background: "#2563eb",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            cursor: "pointer",
            fontWeight: 600,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          💡 Ask AI Chemist
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "360px",
            maxHeight: "70vh",
            background: "white",
            borderRadius: "18px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            border: "1px solid rgba(148, 163, 184, 0.5)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(to right, #1d4ed8, #22c55e)",
              color: "white",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>
                AI Chemist Tutor
              </div>
              <div style={{ fontSize: "11px", opacity: 0.9 }}>
                Ask about this reaction, mechanism, or concept
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              background: "#f3f4f6",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    background: m.role === "user" ? "#2563eb" : "white",
                    color: m.role === "user" ? "white" : "#111827",
                    boxShadow:
                      m.role === "user"
                        ? "0 2px 6px rgba(37, 99, 235, 0.5)"
                        : "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic",
                  marginTop: "4px",
                }}
              >
                AI Chemist is thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "8px",
              borderTop: "1px solid #e5e7eb",
              background: "white",
            }}
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this reaction, mechanism, or concept…"
              style={{
                width: "100%",
                resize: "none",
                fontSize: "13px",
                padding: "6px 8px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                outline: "none",
                marginBottom: "6px",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "8px",
                border: "none",
                background: isLoading || !input.trim() ? "#9ca3af" : "#2563eb",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Thinking..." : "Ask"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
