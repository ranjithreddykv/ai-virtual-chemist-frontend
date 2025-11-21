/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useCallback } from "react";

const AITutorContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAITutor() {
  const ctx = useContext(AITutorContext);
  if (!ctx) {
    throw new Error("useAITutor must be used within AITutorProvider");
  }
  return ctx;
}

export function AITutorProvider({ children }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I’m your AI Chemist Tutor. Ask me about reactions, mechanisms, or anything on this page.",
      audio_url: null,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [pageContext, setPageContext] = useState(null);
  const [chemContext, setChemContext] = useState(null);

  // Safely store context for the tutor
  const updateContext = useCallback((ctx) => {
    if (!ctx) return;

    setPageContext({ page: ctx.page || "unknown" });

    const cleaned = Object.fromEntries(
      Object.entries(ctx).filter(([_, v]) => v !== undefined)
    );
    setChemContext(cleaned);
  }, []);

  // ------------------ ASK TUTOR ------------------
  const askTutor = useCallback(
    async (question) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      const userMessage = {
        id: `${Date.now()}-user`,
        role: "user",
        text: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const safePageContext = pageContext || { page: "unknown" };

        const safeChemContext =
          chemContext &&
          Object.fromEntries(
            Object.entries(chemContext).filter(([_, v]) => v !== undefined)
          );

        let historySnapshot;
        setMessages((prev) => {
          historySnapshot = prev.map((m) => ({
            role: m.role,
            text: m.text,
          }));
          return prev;
        });

        const res = await fetch("http://localhost:8000/api/v1/ai-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            pageContext: safePageContext,
            chemContext: safeChemContext || {},
            history: historySnapshot,
          }),
        });

        if (!res.ok) throw new Error("Tutor API failed");

        const data = await res.json();

        const assistantMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: data.answer, // markdown text answer
          audio_url: data.audio_url || null, // neural TTS audio
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("AI Tutor Error:", err);

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-error`,
            role: "assistant",
            text: "There was an issue processing your request. Please try again.",
            audio_url: null,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageContext, chemContext]
  );

  return (
    <AITutorContext.Provider
      value={{
        messages,
        isLoading,
        askTutor,
        updateContext,
      }}
    >
      {children}
    </AITutorContext.Provider>
  );
}
