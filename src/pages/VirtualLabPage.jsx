/* eslint-disable no-unused-vars */
// VirtualLabPage.jsx - Main Virtual Chemistry Lab Interface

import React, { useState, useEffect } from "react";
import LabScene from "../components/lab/LabScene";
import ChemicalMenu from "../components/lab/ChemicalMenu";
import { reactionEngine } from "../components/lab/ReactionEngine";
import { CHEMICALS, LAB_SETTINGS } from "../components/lab/labConfig";
import {
  Beaker,
  FlaskConical,
  Trash2,
  PlayCircle,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  Info,
  Send,
} from "lucide-react";

export default function VirtualLabPage() {
  const [beakers, setBeakers] = useState([
    {
      id: "beaker-1",
      contents: [],
      liquidColor: "#E8F4F8",
      fillLevel: 0.5,
      label: "Beaker 1",
      showBubbles: false,
      showPrecipitate: false,
      precipitateColor: "#FFFFFF",
      bubbleIntensity: "none",
      reactionResult: null,
    },
  ]);

  const [activeBeaker, setActiveBeaker] = useState("beaker-1");
  const [reactionHistory, setReactionHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  // Get current beaker
  const currentBeaker = beakers.find((b) => b.id === activeBeaker);

  // Add chemical to beaker
  const handleAddChemical = (chemicalId) => {
    if (!activeBeaker) return;

    setBeakers((prev) =>
      prev.map((beaker) => {
        if (beaker.id === activeBeaker) {
          if (beaker.contents.length >= LAB_SETTINGS.maxChemicalsPerBeaker) {
            alert("Beaker is full! Remove some chemicals first.");
            return beaker;
          }

          const newContents = [...beaker.contents, chemicalId];
          const reactionResult = reactionEngine.analyzeReaction(newContents);

          return {
            ...beaker,
            contents: newContents,
            liquidColor: reactionResult.visualData.liquidColor,
            fillLevel: Math.min(0.8, 0.3 + newContents.length * 0.1),
            showBubbles: reactionResult.effects.bubbles,
            showPrecipitate: reactionResult.effects.precipitate,
            precipitateColor: reactionResult.visualData.precipitateColor,
            bubbleIntensity: reactionResult.visualData.bubbleIntensity,
            reactionResult: reactionResult,
          };
        }
        return beaker;
      })
    );
  };

  // Remove last chemical
  const handleRemoveChemical = () => {
    if (!activeBeaker) return;

    setBeakers((prev) =>
      prev.map((beaker) => {
        if (beaker.id === activeBeaker && beaker.contents.length > 0) {
          const newContents = beaker.contents.slice(0, -1);
          const reactionResult = reactionEngine.analyzeReaction(newContents);

          return {
            ...beaker,
            contents: newContents,
            liquidColor: reactionResult.visualData.liquidColor,
            fillLevel: Math.max(0.3, 0.3 + newContents.length * 0.1),
            showBubbles: reactionResult.effects.bubbles,
            showPrecipitate: reactionResult.effects.precipitate,
            precipitateColor: reactionResult.visualData.precipitateColor,
            bubbleIntensity: reactionResult.visualData.bubbleIntensity,
            reactionResult: reactionResult,
          };
        }
        return beaker;
      })
    );
  };

  // Clear beaker
  const handleClearBeaker = () => {
    if (!activeBeaker) return;

    setBeakers((prev) =>
      prev.map((beaker) => {
        if (beaker.id === activeBeaker) {
          return {
            ...beaker,
            contents: [],
            liquidColor: "#E8F4F8",
            fillLevel: 0.5,
            showBubbles: false,
            showPrecipitate: false,
            bubbleIntensity: "none",
            reactionResult: null,
          };
        }
        return beaker;
      })
    );
  };

  // Add new beaker
  const handleAddBeaker = () => {
    if (beakers.length >= LAB_SETTINGS.maxBeakers) {
      alert("Maximum number of beakers reached!");
      return;
    }

    const newBeaker = {
      id: `beaker-${beakers.length + 1}`,
      contents: [],
      liquidColor: "#E8F4F8",
      fillLevel: 0.5,
      label: `Beaker ${beakers.length + 1}`,
      showBubbles: false,
      showPrecipitate: false,
      precipitateColor: "#FFFFFF",
      bubbleIntensity: "none",
      reactionResult: null,
    };

    setBeakers([...beakers, newBeaker]);
    setActiveBeaker(newBeaker.id);
  };

  // Run reaction analysis
  const handleRunReaction = async () => {
    if (!currentBeaker || currentBeaker.contents.length === 0) return;

    setIsProcessing(true);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = currentBeaker.reactionResult;
    setReactionHistory((prev) => [
      ...prev,
      {
        beakerId: activeBeaker,
        timestamp: new Date().toISOString(),
        result: result,
      },
    ]);

    setIsProcessing(false);
  };

  // Submit to AI APIs
  const handleCommitReaction = async () => {
    if (!currentBeaker || !currentBeaker.reactionResult) return;

    setIsProcessing(true);

    try {
      const payload = reactionEngine.formatForAPI(
        activeBeaker,
        currentBeaker.contents,
        currentBeaker.reactionResult
      );

      // Call your existing APIs
      const [forwardResult, mechanismResult, yieldResult] = await Promise.all([
        callForwardAPI(payload),
        callMechanismAPI(payload),
        callYieldAPI(payload),
      ]);

      // Get AI explanation
      const explanation = await callLLMExplanation({
        ...payload,
        forwardResult,
        mechanismResult,
        yieldResult,
      });

      setAiExplanation(explanation);
      setShowAIPanel(true);
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to analyze reaction with AI. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock API calls (replace with your actual endpoints)
  const callForwardAPI = async (payload) => {
    // Replace with: fetch('/api/forward', { method: 'POST', body: JSON.stringify(payload) })
    return { prediction: "Mock forward prediction", confidence: 0.89 };
  };

  const callMechanismAPI = async (payload) => {
    // Replace with: fetch('/api/mechanism', ...)
    return { mechanism: "Mock mechanism pathway", steps: [] };
  };

  const callYieldAPI = async (payload) => {
    // Replace with: fetch('/api/yield', ...)
    return { yield: 0.75, conditions: {} };
  };

  const callLLMExplanation = async (data) => {
    // Replace with: fetch('/api/explain', ...)
    return `This reaction involves ${
      data.chemicals.length
    } chemicals: ${data.chemicals
      .map((c) => c.formula)
      .join(", ")}. The reaction is ${data.reaction.type}.`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">
                3D Virtual Chemistry Lab
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddBeaker}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Beaker className="w-4 h-4" />
                Add Beaker
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Chemical Menu */}
          <div className="lg:col-span-1">
            <ChemicalMenu
              onAddChemical={handleAddChemical}
              selectedBeaker={activeBeaker}
            />
          </div>

          {/* Center - 3D Scene */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-xl">
              <div className="h-[600px]">
                <LabScene
                  beakers={beakers}
                  activeBeaker={activeBeaker}
                  onBeakerClick={setActiveBeaker}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRemoveChemical}
                disabled={!currentBeaker || currentBeaker.contents.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Remove Last
              </button>

              <button
                onClick={handleClearBeaker}
                disabled={!currentBeaker || currentBeaker.contents.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Clear
              </button>

              <button
                onClick={handleRunReaction}
                disabled={
                  !currentBeaker ||
                  currentBeaker.contents.length === 0 ||
                  isProcessing
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                {isProcessing ? "Processing..." : "Analyze"}
              </button>
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Beaker Info */}
            <div className="bg-slate-800 rounded-lg p-4 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                {currentBeaker?.label || "No Beaker Selected"}
              </h3>

              {currentBeaker && currentBeaker.contents.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Contents:</p>
                    <div className="space-y-1">
                      {currentBeaker.contents.map((chem, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHEMICALS[chem]?.color }}
                          />
                          <span className="text-white">
                            {CHEMICALS[chem]?.formula}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentBeaker.reactionResult && (
                    <div className="pt-3 border-t border-slate-700">
                      <p className="text-sm font-semibold text-white mb-1">
                        {currentBeaker.reactionResult.description}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {currentBeaker.reactionResult.equation}
                      </p>
                      {currentBeaker.reactionResult.occurred && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {currentBeaker.reactionResult.effects.heat && (
                            <span className="text-xs px-2 py-0.5 bg-orange-600/30 text-orange-300 rounded">
                              Heat
                            </span>
                          )}
                          {currentBeaker.reactionResult.effects.gas && (
                            <span className="text-xs px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded">
                              Gas
                            </span>
                          )}
                          {currentBeaker.reactionResult.effects.precipitate && (
                            <span className="text-xs px-2 py-0.5 bg-gray-600/30 text-gray-300 rounded">
                              Precipitate
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleCommitReaction}
                    disabled={isProcessing || !currentBeaker.reactionResult}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Analysis
                  </button>
                </div>
              )}

              {(!currentBeaker || currentBeaker.contents.length === 0) && (
                <p className="text-sm text-slate-400">
                  Add chemicals to this beaker to see reaction details.
                </p>
              )}
            </div>

            {/* AI Explanation Panel */}
            {showAIPanel && aiExplanation && (
              <div className="bg-linear-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 shadow-xl border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Insights
                </h3>
                <p className="text-sm text-slate-300">{aiExplanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
