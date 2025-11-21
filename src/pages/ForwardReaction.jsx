import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Beaker,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// 🔥 AI Tutor Context
import { useAITutor } from "../context/AITutorContext";

const API_BASE_URL = "http://localhost:8000";

/**
 * 3D Molecule Viewer
 */
const MoleculeViewer3D = ({
  molData,
  reactiveAtoms = [],
  moleculeName = "",
  autoRotate = true,
  pulse = true,
}) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const pulseIntervalRef = useRef(null);
  const rotateIntervalRef = useRef(null);

  // -----------------------------
  // 1. Initialize Viewer
  // -----------------------------
  useEffect(() => {
    if (!molData || !window.$3Dmol || !containerRef.current) return;

    // Clean previous canvas
    containerRef.current.innerHTML = "";

    const viewer = window.$3Dmol.createViewer(containerRef.current, {
      backgroundColor: "white",
    });

    viewer.addModel(molData, "mol");

    // Base style
    viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });

    viewer.zoomTo();
    viewer.render();
    viewerRef.current = viewer;

    // Fade in animation
    containerRef.current.style.opacity = 0;
    setTimeout(() => {
      containerRef.current.style.transition = "opacity 0.6s ease";
      containerRef.current.style.opacity = 1;
    }, 10);

    return () => {
      clearInterval(pulseIntervalRef.current);
      clearInterval(rotateIntervalRef.current);
    };
  }, [molData]);

  // -----------------------------
  // 2. Highlight / Pulse Reactive Atoms
  // -----------------------------
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    clearInterval(pulseIntervalRef.current);

    if (!reactiveAtoms.length) {
      viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });
      viewer.render();
      return;
    }

    const serials = reactiveAtoms.map((i) => i + 1);

    const applyPulse = (inflate) => {
      viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });

      // Normal atoms dimmed
      viewer.setStyle(
        { not: { serial: serials } },
        { stick: { radius: 0.18, color: "lightgray" }, sphere: { scale: 0.26 } }
      );

      // Reactive atoms (pulse)
      viewer.setStyle(
        { serial: serials },
        {
          sphere: {
            scale: inflate ? 0.55 : 0.45,
            color: inflate ? "red" : "orange",
          },
          stick: {
            radius: inflate ? 0.30 : 0.25,
            color: inflate ? "red" : "orange",
          },
        }
      );

      viewer.render();
    };

    // First frame
    applyPulse(false);

    if (pulse) {
      let state = false;
      pulseIntervalRef.current = setInterval(() => {
        applyPulse(state);
        state = !state;
      }, 700);
    }

    return () => clearInterval(pulseIntervalRef.current);
  }, [reactiveAtoms, pulse]);

  // -----------------------------
  // 3. Auto Rotate The Model
  // -----------------------------
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    clearInterval(rotateIntervalRef.current);

    if (autoRotate) {
      rotateIntervalRef.current = setInterval(() => {
        viewer.rotate(1);
        viewer.render();
      }, 40);
    }

    return () => clearInterval(rotateIntervalRef.current);
  }, [autoRotate]);

  return (
    <div style={{ position: "relative" }}>
      {/* Molecule name label */}
      {moleculeName && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "10px",
            padding: "4px 8px",
            background: "rgba(0,0,0,0.55)",
            color: "white",
            fontSize: "13px",
            borderRadius: "6px",
            zIndex: 10,
          }}
        >
          {moleculeName}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "360px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      />
    </div>
  );
};





const ForwardPrediction = () => {
  const [reactants, setReactants] = useState("");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [current3DIndex, setCurrent3DIndex] = useState(0);

  // 🔥 AI Tutor context
  const { updateContext } = useAITutor();

  /**
   * Update Tutor Context Anytime:
   * - reactants
   * - conditions
   * - prediction result
   */
  useEffect(() => {
    updateContext({
      page: "forward_prediction",
      reactants,
      conditions,
      predictedProduct: result?.predicted_product,
      teacherExplanation: result?.teacher_explanation,
      reactant3DCount: result?.reactants_3d?.length || 0,
      has3DProduct: !!result?.product_3d,
    });
  }, [reactants, conditions, result, updateContext]);

  const threeDModels = useMemo(() => {
    if (!result) return [];
    const arr = [];
    if (result.reactants_3d) arr.push(...result.reactants_3d);
    if (result.product_3d) arr.push(result.product_3d);
    return arr;
  }, [result]);

  const threeDLabels = useMemo(() => {
    if (!result) return [];
    const arr = [];
    if (result.reactants_3d)
      result.reactants_3d.forEach((_, i) => arr.push(`Reactant ${i + 1}`));
    if (result.product_3d) arr.push("Predicted Product");
    return arr;
  }, [result]);

  const canPrev = current3DIndex > 0;
  const canNext =
    threeDModels.length > 0 && current3DIndex < threeDModels.length - 1;

  const predictForwardReaction = async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/forward/predict_full`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactants,
          reagents: conditions,
        }),
      }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };

  const handleSubmit = async () => {
    if (!reactants.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrent3DIndex(0);

    try {
      const data = await predictForwardReaction();
      setResult(data);

      // 🔥 Update tutor with final prediction details
      updateContext({
        page: "forward_prediction",
        reactants,
        conditions,
        predictedProduct: data.predicted_product,
        teacherExplanation: data.teacher_explanation,
        reactant3DCount: data.reactants_3d?.length || 0,
        has3DProduct: !!data.product_3d,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setReactants("CC(=O)OC.O");
    setConditions("H2O.NaOH");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300 mix-blend-multiply blur-xl opacity-60 animate-pulse rounded-full"></div>
        <div
          className="absolute bottom-20 right-10 w-64 h-64 bg-purple-300 mix-blend-multiply blur-xl opacity-60 animate-pulse rounded-full"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-5xl mx-auto">
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow">
              <Sparkles className="text-blue-500 w-4 h-4" />
              <span className="ml-2 text-sm font-semibold">
                AI-Powered Synthesis
              </span>
            </div>
          </div>

          {/* MAIN CARD */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-white/20 rounded-2xl">
                  <Beaker className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Forward Reaction Prediction
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Predict products & visualize molecules in 3D
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="p-10 space-y-8">
              {/* REACTANTS */}
              <div>
                <label className="font-semibold flex gap-2 mb-2">
                  <FlaskConical className="text-blue-600" />
                  Reactants (SMILES) *
                </label>
                <input
                  className="w-full p-4 rounded-xl border-2 bg-gray-50"
                  placeholder="CC(=O)OC.O"
                  value={reactants}
                  onChange={(e) => setReactants(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <code>.</code> to separate multiple reactants
                </p>
              </div>

              {/* CONDITIONS */}
              <div>
                <label className="font-semibold flex gap-2 mb-2">
                  <Info className="text-indigo-600" />
                  Reaction Conditions (Optional)
                </label>
                <input
                  className="w-full p-4 rounded-xl border-2 bg-gray-50"
                  placeholder="H2O.NaOH"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {loading ? "Predicting..." : "Predict Product"}
                </button>

                <button
                  onClick={loadExample}
                  className="border-2 border-blue-600 text-blue-600 p-4 rounded-xl"
                >
                  Load Example
                </button>
              </div>

              {/* ERROR */}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex gap-3">
                  <AlertCircle className="text-red-600" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* RESULTS */}
              {result && (
                <div className="space-y-10">
                  {/* SUCCESS BOX */}
                  <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-xl flex gap-3">
                    <CheckCircle2 className="text-green-600" />
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">
                        Prediction Successful!
                      </h3>
                      <p className="text-green-700 text-sm">
                        3D structures & explanation are ready.
                      </p>
                    </div>
                  </div>

                  {/* PRODUCT SUMMARY */}
                  <div className="bg-white border rounded-xl p-6 shadow">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Predicted Product SMILES
                    </h4>
                    <div className="font-mono text-gray-900 bg-gray-100 p-4 rounded border">
                      {result.predicted_product}
                    </div>
                  </div>

                  {/* 3D VIEWER */}
                  {threeDModels.length > 0 && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <FlaskConical className="text-indigo-600" />
                        3D Molecular Viewer
                      </h3>

                      <p className="text-sm text-gray-700 mb-2">
                        {threeDLabels[current3DIndex]}
                      </p>

                      <MoleculeViewer3D
                        molData={threeDModels[current3DIndex]}
                      />

                      <div className="flex justify-between mt-4">
                        <button
                          disabled={!canPrev}
                          onClick={() =>
                            canPrev && setCurrent3DIndex((i) => i - 1)
                          }
                          className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                          <ChevronLeft className="inline-block mr-1" />
                          Prev
                        </button>

                        <span className="text-sm text-gray-600">
                          {current3DIndex + 1} / {threeDModels.length}
                        </span>

                        <button
                          disabled={!canNext}
                          onClick={() =>
                            canNext && setCurrent3DIndex((i) => i + 1)
                          }
                          className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                          Next
                          <ChevronRight className="inline-block ml-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TEACHER EXPLANATION */}
                  {result.teacher_explanation && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-blue-700 flex items-center gap-2 mb-3">
                        <Sparkles className="text-blue-500" />
                        Professor Explanation
                      </h3>

                      <div className="prose prose-sm max-w-none text-gray-700">
                        {result.teacher_explanation
                          .split("\n")
                          .map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* INFO BOX */}
          <div className="mt-10 bg-white rounded-2xl p-8 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 text-white rounded-xl">
                <Info />
              </div>
              <h3 className="font-bold text-gray-800">How to Use</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Enter Reactants",
                  desc: "Use SMILES separated by dots",
                },
                {
                  title: "Add Conditions",
                  desc: "Specify catalysts (optional)",
                },
                { title: "Predict", desc: "AI predicts the likely products" },
                { title: "Explore", desc: "View 3D structures & explanation" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-gray-100 rounded-xl border"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {item.title}
                    </h4>
                    <p className="text-gray-700 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardPrediction;
