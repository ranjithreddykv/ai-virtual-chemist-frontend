import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I’m your AI Chemist Tutor. Ask me about reactions, mechanisms, or anything on this page.",
      audio_url: null,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [pageContext, setPageContext] = useState({
    page: location.pathname,
  });

  const [chemContext, setChemContext] = useState({});

  const lastRouteRef = useRef(location.pathname);

  /* ===============================================================
     RESET CONVERSATION WHEN ROUTE ACTUALLY CHANGES
  ============================================================== */
  useEffect(() => {
    if (location.pathname !== lastRouteRef.current) {
      lastRouteRef.current = location.pathname;

      console.log(
        "🔄 Route changed → resetting tutor context:",
        location.pathname
      );

      setPageContext({ page: location.pathname });
      setChemContext({});

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: "Hi! I’m your AI Chemist Tutor. Ask me about reactions, mechanisms, or anything on this page.",
          audio_url: null,
        },
      ]);
    }
  }, [location.pathname]);

  /* ===============================================================
     MANUALLY UPDATE CHEM CONTEXT FROM A PAGE
  ============================================================== */
  const updateContext = useCallback((ctx) => {
    if (!ctx) return;

    const cleaned = Object.fromEntries(
      Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null)
    );

    setChemContext(cleaned);
  }, []);

  /* ===============================================================
     ASK TUTOR — Main Logic
  ============================================================== */
  const askTutor = useCallback(
    async (question) => {
      if (!question.trim()) return;

      const userMessage = {
        id: `${Date.now()}-user`,
        role: "user",
        text: question.trim(),
        audio_url: null,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Prepare history in LLM-friendly format
        const historyForLLM = [...messages, userMessage].map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const res = await fetch("http://localhost:8000/api/v1/ai-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            pageContext: pageContext,
            chemContext: chemContext,
            history: historyForLLM,
          }),
        });

        if (!res.ok) throw new Error("Tutor API failed");

        const data = await res.json();

        const assistantMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: data.answer,
          audio_url: data.audio_url || null,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("Tutor Error:", err);

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-error`,
            role: "assistant",
            text: "Sorry, I had trouble processing that. Please try again.",
            audio_url: null,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, pageContext, chemContext]
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
