/* eslint-disable no-self-assign */
import React, { useState, useRef, useEffect } from "react";
import { useAITutor } from "../context/AITutorContext";

export default function AITutorWidget() {
  const { messages, isLoading, askTutor } = useAITutor();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const [voiceOn, setVoiceOn] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Audio state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // ------------------ HELPERS ------------------

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "00:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getLastAssistantMessage = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  };

  // ------------------ AUDIO CONTROL ------------------

  const playAudioFromUrl = (url) => {
    if (!voiceOn) return;
    if (!audioRef.current || !url) return;

    audioRef.current.src = url;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn("Audio playback failed:", err);
        setIsPlaying(false);
      });
  };

  const handlePlayClick = () => {
    const last = getLastAssistantMessage();
    if (!last?.audio_url) return;

    // If paused in the middle, just resume
    if (audioRef.current && audioRef.current.src === last.audio_url) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Play failed:", err));
    } else {
      playAudioFromUrl(last.audio_url);
    }
  };

  const handlePauseClick = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStopClick = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();

    audioRef.current.src = audioRef.current.src; // important fix

    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleReplayClick = () => {
    const last = getLastAssistantMessage();
    if (!last?.audio_url || !audioRef.current) return;

    audioRef.current.currentTime = 0;
    playAudioFromUrl(last.audio_url);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || isSeeking) return;
    setCurrentTime(audioRef.current.currentTime || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleSeekChange = (e) => {
    const value = Number(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
  };

  const toggleVoice = () => {
    setVoiceOn((prev) => {
      const next = !prev;
      if (!next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      }

      return next;
    });
  };

  // ------------------ SEND MESSAGE ------------------

  const sendMessage = () => {
    if (!input.trim()) return;
    askTutor(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ------------------ AUTO-PLAY ON NEW ASSISTANT MESSAGE ------------------

  useEffect(() => {
    const last = messages[messages.length - 1];

    // scroll always
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // only play if:
    // 1) it's an assistant message
    // 2) it has audio
    // 3) voice tutor is ON
    // 4) it is NOT an error message
    if (
      last?.role === "assistant" &&
      last?.audio_url &&
      voiceOn &&
      !last.text?.includes("There was an issue") &&
      !last.text?.includes("Try again")
    ) {
      audioRef.current.src = last.audio_url;
      audioRef.current.onloadedmetadata = () => {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      };
    }
  }, [messages, voiceOn]);

  // ------------------ SPEECH-TO-TEXT (VOICE-DRIVEN MODE) ------------------

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;

    recog.onstart = () => setIsListening(true);
    recog.onend = () => setIsListening(false);
    recog.onerror = () => setIsListening(false);

    // Voice-driven: automatically send question after recognition
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput("");
      // slight delay so autoPlay doesn't collide with mic event
      setTimeout(() => askTutor(text), 150);
    };

    recognitionRef.current = recog;
    recog.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleMicClick = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ------------------ JSX ------------------

  return (
    <>
      {/* Siri-style waveform CSS */}
      <style>{`
        .ai-tutor-waveform {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 16px;
        }
        .ai-tutor-bar {
          width: 3px;
          border-radius: 999px;
          background: #22c55e;
          animation: ai-tutor-wave 0.9s ease-in-out infinite;
          transform-origin: bottom;
        }
        .ai-tutor-bar:nth-child(2) {
          animation-delay: 0.1s;
        }
        .ai-tutor-bar:nth-child(3) {
          animation-delay: 0.2s;
        }
        .ai-tutor-bar:nth-child(4) {
          animation-delay: 0.3s;
        }
        .ai-tutor-bar:nth-child(5) {
          animation-delay: 0.4s;
        }

        @keyframes ai-tutor-wave {
          0%, 100% {
            height: 4px;
            opacity: 0.8;
          }
          50% {
            height: 16px;
            opacity: 1;
          }
        }
      `}</style>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Floating open button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#2563eb",
            color: "white",
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            cursor: "pointer",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
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
            bottom: 20,
            right: 20,
            width: 380,
            maxHeight: "75vh",
            background: "white",
            borderRadius: 18,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 15px 40px rgba(0,0,0,0.35)",
            zIndex: 9999,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              background: "linear-gradient(to right, #1d4ed8, #22c55e)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                AI Chemist Tutor
              </div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                Voice + text explanations for organic chemistry
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Voice toggle */}
              <button
                onClick={toggleVoice}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: 18,
                  cursor: "pointer",
                }}
                title={voiceOn ? "Mute tutor voice" : "Enable tutor voice"}
              >
                {voiceOn ? "🔊" : "🔇"}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10,
              background: "#f3f4f6",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 10px",
                    borderRadius: 12,
                    fontSize: 13,
                    background: m.role === "user" ? "#2563eb" : "white",
                    color: m.role === "user" ? "white" : "#111827",
                    boxShadow:
                      m.role === "user"
                        ? "0 2px 6px rgba(37,99,235,0.5)"
                        : "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  fontStyle: "italic",
                  marginTop: 4,
                }}
              >
                AI Chemist is thinking…
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Audio player controls + waveform */}
          <div
            style={{
              padding: "8px 10px",
              borderTop: "1px solid #e5e7eb",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {/* Top row: waveform + status */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isPlaying && voiceOn ? (
                  <div className="ai-tutor-waveform">
                    <div className="ai-tutor-bar" />
                    <div className="ai-tutor-bar" />
                    <div className="ai-tutor-bar" />
                    <div className="ai-tutor-bar" />
                    <div className="ai-tutor-bar" />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 999,
                      background: "#e5e7eb",
                    }}
                  />
                )}

                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {isPlaying && voiceOn
                    ? "Explaining out loud…"
                    : "Voice tutor ready"}
                </span>
              </div>

              <span
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  minWidth: 80,
                  textAlign: "right",
                }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Middle row: progress bar */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeekChange}
              onMouseDown={handleSeekMouseDown}
              onMouseUp={handleSeekMouseUp}
              style={{ width: "100%" }}
            />

            {/* Bottom row: control buttons */}
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={handlePlayClick}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ▶ Play
              </button>
              <button
                onClick={handlePauseClick}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ⏸ Pause
              </button>
              <button
                onClick={handleStopClick}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ⏹ Stop
              </button>
              <button
                onClick={handleReplayClick}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                🔁 Replay
              </button>
            </div>
          </div>

          {/* Input (text + mic) */}
          <div
            style={{
              padding: 10,
              background: "white",
            }}
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question, or tap the mic and speak…"
              style={{
                width: "100%",
                padding: 8,
                resize: "none",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 8,
                fontSize: 13,
              }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleMicClick}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: isListening ? "#f97316" : "#f3f4f6",
                  color: isListening ? "white" : "#111827",
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {isListening ? "🎙 Listening…" : "🎤 Speak"}
              </button>

              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 8,
                  border: "none",
                  background:
                    !input.trim() || isLoading ? "#9ca3af" : "#2563eb",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    !input.trim() || isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Thinking…" : "Ask"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
