// src/components/VirtualChemistVoiceAssistant.jsx

import React, { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  MessageCircle,
  Volume2,
  Loader2,
  X,
  Square,
} from "lucide-react"; 
const API_BASE_URL = "http://localhost:8080";

const VirtualChemistVoiceAssistant = ({ contextSmiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  const getRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    return recognition;
  };

  const startListening = () => {
    if (isListening) return;
    const recognition = getRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript("");
    setAnswer("");

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };
  const askChemist = async () => {
    if (!transcript.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/voice_chemist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: transcript,
          context_smiles: contextSmiles || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setAnswer(data.answer);
      speakText(data.answer);
    } catch (err) {
      console.error(err);
      setAnswer("Sorry, I couldn't process that question.");
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white p-4 shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-semibold">
          Talk to Chemist
        </span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Virtual Chemist</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                stopListening();
              }}
              className="p-1 rounded-full hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
            <p className="text-xs text-gray-500">
              Ask anything like{" "}
              <span className="font-medium text-purple-600">
                "Explain oxidative addition in this reaction"
              </span>{" "}
              or{" "}
              <span className="font-medium text-purple-600">
                "Why is palladium a good catalyst here?"
              </span>
            </p>

            {/* Transcript box */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Your Question (voice → text)
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={2}
                className="mt-1 w-full text-xs border rounded-lg p-2 font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Click the mic and speak, or type your question..."
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
              {/* MIC BUTTON */}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm ${
                  isListening
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-purple-600 text-white"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Stop Mic
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start Mic
                  </>
                )}
              </button>

              {/* ASK BUTTON */}
              <button
                onClick={askChemist}
                disabled={loading || !transcript.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Asking...
                  </>
                ) : (
                  "Ask Chemist"
                )}
              </button>

              {/* STOP SPEAKING BUTTON (NEW) */}
              <button
                onClick={stopSpeaking}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </div>

            {/* Answer */}
            {answer && (
              <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-purple-800">
                    Chemist’s Answer
                  </span>
                  <button
                    onClick={() => speakText(answer)}
                    className="p-1 rounded-full hover:bg-purple-100"
                  >
                    <Volume2 className="w-4 h-4 text-purple-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                  {answer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VirtualChemistVoiceAssistant;
