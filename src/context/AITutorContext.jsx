/* eslint-disable no-unused-vars */
// src/context/AITutorContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const AITutorContext = createContext(null);

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
      text: "Hi! I’m your AI Chemist Tutor. Ask me about reactions, mechanisms, or anything in this page.",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Track user context (page + chemical info)
  const [pageContext, setPageContext] = useState(null);
  const [chemContext, setChemContext] = useState(null);

  // Update tutor context safely
  const updateContext = useCallback((ctx) => {
    if (!ctx) return;

    setPageContext({ page: ctx.page || "unknown" });

    // Remove undefined values
    const cleaned = Object.fromEntries(
      Object.entries(ctx).filter(([_, v]) => v !== undefined)
    );

    setChemContext(cleaned);
  }, []);

  /**
   * Send question to backend AI Tutor
   */
  const askTutor = useCallback(
    async (question) => {
      if (!question.trim()) return;

      const userMessage = {
        id: Date.now() + "-user",
        role: "user",
        text: question.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // ---- SAFE NORMALIZATION ----
        const safePageContext = pageContext || { page: "unknown" };

        const safeChemContext =
          chemContext &&
          Object.fromEntries(
            Object.entries(chemContext).filter(([_, v]) => v !== undefined)
          );

        const safeHistory = messages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        // ---- API CALL ----
        const res = await fetch("http://localhost:8000/api/v1/ai-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            pageContext: safePageContext,
            chemContext: safeChemContext || {},
            history: safeHistory,
          }),
        });

        if (!res.ok) throw new Error("Tutor API failed");

        const data = await res.json();

        const assistantMessage = {
          id: Date.now() + "-assistant",
          role: "assistant",
          text:
            data.answer ||
            "I'm not sure — but let's work through this together.",
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("AI Tutor Error:", err);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + "-error",
            role: "assistant",
            text: "I ran into an issue while answering. Please try again in a moment or rephrase the question.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageContext, chemContext, messages]
  );

  const value = {
    messages,
    isLoading,
    askTutor,
    updateContext,
  };

  return (
    <AITutorContext.Provider value={value}>{children}</AITutorContext.Provider>
  );
}
