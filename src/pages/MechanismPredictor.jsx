/****************************************************************************************
 *  ReactionMechanismPredictor.jsx
 *  - Mechanism prediction + SVG visuals + professor explanation
 *  - 3Dmol.js viewer integrated after steps section (layout B)
 *  - Viewer is fully contained using React ref (no floating canvas)
 ***************************************************************************************/
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Atom,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Beaker,
  Info,
  ChevronRight,
  Microscope,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAITutor } from "../context/AITutorContext";

const API_BASE_URL = "http://localhost:8080";

/* ======================================================================================
   3D Molecule Viewer Component (ref-based, no random IDs)
   ====================================================================================== */

const MoleculeViewer3D = ({
  molData,
  reactiveAtoms = [],
  moleculeName = "",
  autoRotate = true,
  pulse = true,
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pulseInterval = useRef(null);
  const rotateInterval = useRef(null);

  // -------------------------
  // Load 3Dmol.js once
  // -------------------------
  const load3dmol = () =>
    new Promise((resolve) => {
      if (window.$3Dmol) return resolve();
      const s = document.createElement("script");
      s.src = "https://3Dmol.org/build/3Dmol-min.js";
      s.onload = resolve;
      document.head.appendChild(s);
    });

  // -------------------------
  // Initialize viewer (ONE EFFECT)
  // -------------------------
  useEffect(() => {
    if (!molData || !containerRef.current) return;
    let viewer;

    const init = async () => {
      await load3dmol();

      const el = containerRef.current;
      el.innerHTML = "";

      viewer = window.$3Dmol.createViewer(el, {
        backgroundColor: "white",
      });

      viewer.addModel(molData, "mol");
      viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });
      viewer.zoomTo();
      viewer.render();

      viewerRef.current = viewer;

      // fade in
      el.style.opacity = 0;
      setTimeout(() => {
        el.style.transition = "opacity 0.6s ease";
        el.style.opacity = 1;
      }, 20);

      // rotate
      clearInterval(rotateInterval.current);
      if (autoRotate) {
        rotateInterval.current = setInterval(() => {
          viewer.rotate(1);
          viewer.render();
        }, 40);
      }

      // pulse reactive atoms
      clearInterval(pulseInterval.current);
      if (pulse && reactiveAtoms.length > 0) {
        let toggle = false;
        pulseInterval.current = setInterval(() => {
          const serials = reactiveAtoms.map((x) => x + 1);

          viewer.setStyle(
            {},
            { stick: { radius: 0.2 }, sphere: { scale: 0.3 } }
          );

          viewer.setStyle(
            { not: { serial: serials } },
            {
              stick: { radius: 0.18, color: "lightgray" },
              sphere: { scale: 0.26 },
            }
          );

          viewer.setStyle(
            { serial: serials },
            {
              sphere: {
                scale: toggle ? 0.55 : 0.45,
                color: toggle ? "red" : "orange",
              },
              stick: {
                radius: toggle ? 0.32 : 0.25,
                color: toggle ? "red" : "orange",
              },
            }
          );

          viewer.render();
          toggle = !toggle;
        }, 700);
      }
    };

    init();

    return () => {
      clearInterval(rotateInterval.current);
      clearInterval(pulseInterval.current);
    };
  }, [molData, reactiveAtoms, autoRotate, pulse]);

  return (
    <div className="relative">
      {moleculeName && (
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 text-xs text-white rounded">
          {moleculeName}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-80 border rounded-xl"
        style={{ overflow: "hidden" }}
      />
    </div>
  );
};

/* ======================================================================================
   Main Page Component
   ====================================================================================== */

const ReactionMechanismPredictor = () => {
  const [smilesInput, setSmilesInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 3D state
  const [threeDModels, setThreeDModels] = useState([]); // array of MOL blocks
  const [current3DIndex, setCurrent3DIndex] = useState(0);
  const [threeDLoading, setThreeDLoading] = useState(false);
  const { updateContext } = useAITutor();

  /* ======================= API: Mechanism prediction ======================= */

  const predictMechanism = async (smilesString) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/predict_crm_path_explained`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smiles_string: smilesString }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Prediction failed: ${errText}`);
    }

    return await response.json();
  };

  /* ======================= API: 3D structure generation ===================== */

  const fetch3DModel = async (smiles) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/generate_3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smiles }),
      });

      if (!res.ok) {
        console.error("3D generation failed for", smiles);
        return null;
      }

      const molBlock = await res.text();
      return molBlock;
    } catch (e) {
      console.error("3D fetch error:", e);
      return null;
    }
  };

  /* ============================ Handlers ============================ */

  const handleSubmit = async () => {
    if (!smilesInput.trim()) {
      setError("Please enter a valid SMILES string.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setThreeDModels([]);
    setCurrent3DIndex(0);

    try {
      const data = await predictMechanism(smilesInput);
      setResult(data);
      updateContext({
        page: "mechanism_prediction",
        mode: "mechanism_prediction",
        inputSmiles: smilesInput,
        initialSystem: data.initial_smiles,
        finalProduct: data.final_product_smiles,
        finalSystem: data.final_smiles_system,
        stepCount: data.steps?.length || 0,
        stepTypes: data.steps?.map(
          (s) => s.model_step.predicted_elementary_step
        ),
        reactiveAtomsPerStep: data.steps?.map(
          (s) => s.model_step.predicted_reactive_atoms_indices
        ),
      });
    } catch (err) {
      setError(err.message || "Failed to predict reaction mechanism.");
    } finally {
      setLoading(false);
    }
  };
  const MECHANISM_EXAMPLES = [
    {
      smiles:
        "CC(C)(C)[P+]([Pd])(c1ccccc1-c1ccccc1)C(C)(C)C.Clc1ccccn1.OB(O)c1cccc2ccccc12.[Cs]O",
      title: "Suzuki–Miyaura Cross-Coupling (Palladium Catalysis)",
    },
    {
      smiles: "ClC1=CC=CC=C1.CC[Ni]Cl.CCO.[K]OH",
      title: "Nickel–Catalyzed Aryl Chloride Activation",
    },
    {
      smiles: "CCOC(=O)C1=CC=CC=C1.NaOEt",
      title: "Claisen Condensation (Ester Enolate Formation)",
    },
    {
      smiles: "CC(=O)OC1=CC=CC=C1.NH3",
      title: "Aminolysis of Esters (Nucleophilic Acyl Substitution)",
    },
    {
      smiles: "BrC1=CC=CC=C1.CC=CC.O[Mg]Br",
      title: "Grignard Addition to Alkenyl Aromatic System",
    },
    {
      smiles: "O=CC1=CC=CC=C1.NH2OH.HCl",
      title: "Oxime Formation via Nucleophilic Addition",
    },
    {
      smiles: "CC(=O)C1=CC=CC=C1.Cl2.Pd(PPh3)4",
      title: "Heck Reaction (Palladium-Catalyzed Arylation)",
    },
  ];

  const loadExample = () => {
    const random =
      MECHANISM_EXAMPLES[Math.floor(Math.random() * MECHANISM_EXAMPLES.length)];

    setSmilesInput(random.smiles);

    // Reset old results
    setResult(null);
    setThreeDModels([]);
    setCurrent3DIndex(0);

    // 🔥 Update AI Tutor context immediately
    updateContext({
      page: "mechanism_prediction",
      isExampleLoaded: true,
      exampleTitle: random.title,
      exampleSmiles: random.smiles,
    });
  };

  const getStepColor = (step) => {
    const colors = {
      oxidative_addition: "from-purple-500 to-pink-500",
      boronate_formation: "from-blue-500 to-cyan-500",
      "boron transmetallation": "from-orange-500 to-amber-500",
      reductive_elemination: "from-green-500 to-emerald-500",
    };
    return colors[step] || "from-gray-500 to-gray-600";
  };

  const formatStepName = (step) =>
    step
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  /* ==================== 3D Sequence construction ==================== */

  // Build the SMILES sequence for 3D animation: Initial → each step → Final product
  const smilesSequence = useMemo(() => {
    if (!result) return [];
    const seq = [];
    // initial
    seq.push(result.initial_smiles);
    // after each step
    result.steps.forEach((step) => {
      seq.push(step.model_step.next_reaction_smiles);
    });
    // final product (if different from last)
    if (
      result.final_product_smiles &&
      result.final_product_smiles !==
        result.steps[result.steps.length - 1].model_step.next_reaction_smiles
    ) {
      seq.push(result.final_product_smiles);
    }
    return seq;
  }, [result]);

  // Labels for each 3D state in sequence
  const sequenceLabels = useMemo(() => {
    if (!result) return [];
    const labels = [];
    labels.push("Initial System");
    result.steps.forEach((step, idx) => {
      labels.push(
        `After Step ${idx + 1}: ${formatStepName(
          step.model_step.predicted_elementary_step
        )}`
      );
    });
    if (
      result.final_product_smiles &&
      result.final_product_smiles !==
        result.steps[result.steps.length - 1].model_step.next_reaction_smiles
    ) {
      labels.push("Final Product");
    }
    return labels;
  }, [result]);

  // When `result` changes, fetch all 3D models for the sequence
  useEffect(() => {
    const loadAll3D = async () => {
      if (!smilesSequence.length) return;
      setThreeDLoading(true);
      const models = [];
      for (const smiles of smilesSequence) {
        const molBlock = await fetch3DModel(smiles);
        models.push(molBlock);
      }
      setThreeDModels(models);
      setCurrent3DIndex(0);
      setThreeDLoading(false);
    };
    loadAll3D();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smilesSequence.length]); // trigger when sequence length changes

  // Determine reactive atoms for current 3D index (only for intermediate steps)
  const currentReactiveAtoms = useMemo(() => {
    if (!result || !result.steps || result.steps.length === 0) return [];
    // Index mapping:
    // 0 -> initial system (no reactive atoms)
    // 1..steps.length -> use steps[index-1]
    // last (if extra final product) -> no reactive atoms
    if (current3DIndex <= 0) return [];
    if (current3DIndex >= 1 && current3DIndex <= result.steps.length) {
      return (
        result.steps[current3DIndex - 1].model_step
          .predicted_reactive_atoms_indices || []
      );
    }
    return [];
  }, [current3DIndex, result]);

  const canGoPrev = current3DIndex > 0;
  const canGoNext =
    threeDModels.length > 0 && current3DIndex < threeDModels.length - 1;

  /* =============================== UI =============================== */

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* Background animation blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg mb-4 animate-bounce">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Uncover Reaction Pathways
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Top banner */}
            <div className="bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-2xl">
                  <Atom className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white">
                    Reaction Mechanism Predictor
                  </h1>
                  <p className="text-purple-100 mt-2 text-sm">
                    Predict elementary steps, visualize changes & understand
                    mechanisms
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs and results */}
            <div className="p-8">
              {/* SMILES input */}
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                  <Beaker className="w-5 h-5 text-purple-600" />
                  Reaction SMILES String <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={smilesInput}
                  onChange={(e) => setSmilesInput(e.target.value)}
                  placeholder="Enter a reaction SMILES..."
                  rows={3}
                  className="w-full p-4 text-sm border-2 border-gray-300 rounded-xl focus:border-purple-500 bg-gray-50 font-mono"
                />

                <p className="text-xs text-gray-500 mt-2">
                  All components separated by "."
                  (Catalyst.ArylHalide.Reagent.Base)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Microscope />
                  )}
                  {loading ? "Analyzing..." : "Predict Mechanism"}
                </button>

                <button
                  onClick={loadExample}
                  className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-xl hover:bg-purple-50"
                >
                  Load Example
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex gap-3">
                  <AlertCircle className="text-red-600" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="mt-10 space-y-8">
                  {/* Success box */}
                  <div className="p-5 bg-purple-50 border-l-4 border-purple-500 rounded-xl flex gap-3">
                    <CheckCircle2 className="text-purple-600" />
                    <div>
                      <h3 className="font-bold text-purple-700 text-lg">
                        Mechanism Prediction Complete!
                      </h3>
                      <p className="text-purple-600 text-sm">
                        {result.steps.length} elementary steps identified
                      </p>
                    </div>
                  </div>

                  {/* Initial & Final SMILES */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border shadow">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase">
                        Initial System
                      </h4>
                      <p className="font-mono text-sm break-all">
                        {result.initial_smiles}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border shadow">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase">
                        Final Product
                      </h4>
                      <p className="font-mono text-sm break-all">
                        {result.final_product_smiles}
                      </p>
                    </div>
                  </div>

                  {/* STEPS SECTION */}
                  <div className="bg-white p-6 rounded-xl border shadow">
                    <div className="flex items-center gap-2 mb-5">
                      <GitBranch className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-700 uppercase text-sm">
                        Elementary Steps
                      </h4>
                    </div>

                    <div className="space-y-6">
                      {result.steps.map((step, index) => {
                        const s = step.model_step;

                        return (
                          <div
                            key={index}
                            className="relative bg-gray-50 rounded-xl p-5 border hover:border-purple-300 transition-all duration-300"
                          >
                            {/* Step number badge */}
                            <div className="absolute -top-3 -left-3">
                              <div
                                className={`w-10 h-10 rounded-full bg-linear-to-br ${getStepColor(
                                  s.predicted_elementary_step
                                )} text-white flex items-center justify-center font-bold shadow-lg`}
                              >
                                {index + 1}
                              </div>
                            </div>

                            <div className="ml-6 sm:ml-8">
                              <div className="flex items-center gap-2 mb-3">
                                <h5 className="text-sm sm:text-base font-bold text-gray-800">
                                  {formatStepName(s.predicted_elementary_step)}
                                </h5>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                                  Class {s.predicted_class_index}
                                </span>
                              </div>

                              {/* SVG visual */}
                              {step.visual_svg && (
                                <div
                                  className="w-full bg-white border rounded-lg p-3 mb-4"
                                  dangerouslySetInnerHTML={{
                                    __html: step.visual_svg,
                                  }}
                                ></div>
                              )}

                              {/* Reactive atoms */}
                              <div className="mb-3">
                                <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">
                                  Reactive Atoms:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {s.predicted_reactive_atoms_indices.map(
                                    (atom, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1 bg-white border-2 border-purple-300 text-purple-700 text-xs sm:text-sm rounded-lg font-mono font-semibold"
                                      >
                                        {atom}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Next reaction state */}
                              <div className="bg-white rounded-lg p-3 border border-gray-300">
                                <p className="text-xs text-gray-500 font-semibold mb-1">
                                  Next Reaction State:
                                </p>
                                <p className="text-xs sm:text-sm text-gray-700 font-mono break-all">
                                  {s.next_reaction_smiles}
                                </p>
                              </div>
                            </div>

                            {/* Arrow to next step */}
                            {index < result.steps.length - 1 && (
                              <div className="flex justify-center mt-4">
                                <ChevronRight className="w-6 h-6 text-purple-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3D MECHANISM VIEWER (PLACED AFTER STEPS) */}
                  <div className="bg-white p-6 rounded-xl border shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Microscope className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-700 text-sm sm:text-base">
                          3D Mechanism Viewer
                        </h4>
                      </div>
                      {threeDLoading && (
                        <span className="flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating 3D structures...
                        </span>
                      )}
                    </div>

                    {threeDModels.length > 0 && threeDModels[current3DIndex] ? (
                      <>
                        <div className="mb-3 text-sm font-medium text-gray-700">
                          {sequenceLabels[current3DIndex] || "Structure"}
                        </div>

                        <MoleculeViewer3D
                          molData={threeDModels[current3DIndex]}
                          reactiveAtoms={currentReactiveAtoms}
                        />

                        <div className="flex items-center justify-between mt-4">
                          <button
                            onClick={() =>
                              canGoPrev && setCurrent3DIndex((prev) => prev - 1)
                            }
                            disabled={!canGoPrev}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs sm:text-sm disabled:opacity-40 hover:bg-gray-50"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </button>

                          <div className="text-xs sm:text-sm text-gray-600">
                            State {current3DIndex + 1} of {threeDModels.length}
                          </div>

                          <button
                            onClick={() =>
                              canGoNext && setCurrent3DIndex((prev) => prev + 1)
                            }
                            disabled={!canGoNext}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs sm:text-sm disabled:opacity-40 hover:bg-gray-50"
                          >
                            Next
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        3D structures are not available yet or failed to
                        generate.
                      </p>
                    )}
                  </div>

                  {/* Professor explanation */}
                  <div className="bg-white rounded-xl p-6 border shadow">
                    <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-3">
                      <Sparkles className="text-blue-500" />
                      Professor Explanation
                    </h3>

                    <div className="prose prose-sm sm:prose-base max-w-none text-gray-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result.teacher_explanation}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Final System */}
                  <div className="bg-green-50 p-5 rounded-xl border border-green-300 shadow">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Final System SMILES
                    </h4>
                    <p className="text-sm sm:text-base text-gray-800 font-mono break-all bg-white rounded-lg p-4 border border-green-200">
                      {result.final_smiles_system}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info section */}
          <div className="mt-10 bg-white rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                How to Use
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                {
                  title: "Input Reaction",
                  desc: "Paste complete reaction SMILES with all components",
                },
                {
                  title: "Run Prediction",
                  desc: "AI analyzes and identifies elementary steps",
                },
                {
                  title: "View Steps",
                  desc: "Examine each mechanistic transformation",
                },
                {
                  title: "Explore 3D",
                  desc: "Use the 3D viewer to see structural changes",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 sm:p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-linear-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">
                      {item.title}
                    </h4>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <h4 className="font-semibold text-gray-800 text-sm mb-2">
                🔬 About Mechanism Prediction
              </h4>
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                This AI-powered tool predicts reaction mechanisms by breaking
                down complex transformations into elementary steps. It
                identifies reactive atom positions, predicts step types, traces
                the full catalytic cycle, and now lets you explore the 3D
                evolution of your system like a true virtual chemist.
              </p>
            </div>
          </div>
        </div>
      </div>
      <></>
    </div>
  );
};

export default ReactionMechanismPredictor;
