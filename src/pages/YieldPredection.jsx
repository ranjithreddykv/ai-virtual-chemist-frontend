import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LineChart,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Droplet,
  Target,
  Info,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAITutor } from "../context/AITutorContext";

const API_BASE_URL = "http://localhost:8000";

/* ----------------------------------------------------
   UPGRADED 3D MOLECULAR VIEWER
   Matches ForwardPrediction + Retrosynthesis
----------------------------------------------------- */
const MoleculeViewer3D = ({
  molData,
  reactiveAtoms = [],
  moleculeName = "",
  autoRotate = true,
  pulse = true,
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pulseIntervalRef = useRef(null);
  const rotateIntervalRef = useRef(null);

  /* Load 3Dmol.js dynamically */
  const load3DmolScript = () =>
    new Promise((resolve) => {
      if (window.$3Dmol) return resolve();
      const script = document.createElement("script");
      script.src = "https://3Dmol.org/build/3Dmol-min.js";
      script.async = true;
      script.onload = resolve;
      document.head.appendChild(script);
    });

  /* ---------------------------
       Initialize + Rotation
  ---------------------------- */
  useEffect(() => {
    if (!molData || !containerRef.current) return;

    const initViewer = async () => {
      await load3DmolScript();

      const el = containerRef.current;

      // clear previous contents
      el.innerHTML = "";

      const viewer = window.$3Dmol.createViewer(el, {
        backgroundColor: "white",
      });

      try {
        viewer.addModel(molData, "mol");
      } catch {
        viewer.addModel(molData, "mol2");
      }

      viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });

      viewer.zoomTo();
      viewer.render();
      viewerRef.current = viewer;

      // Fade in
      el.style.opacity = 0;
      setTimeout(() => {
        el.style.transition = "opacity 0.6s ease-in-out";
        el.style.opacity = 1;
      }, 20);

      /* ---------- ROTATION FIX ----------- */
      clearInterval(rotateIntervalRef.current);
      if (autoRotate) {
        rotateIntervalRef.current = setInterval(() => {
          viewer.rotate(1);
          viewer.render();
        }, 40);
      }
    };

    initViewer();

    return () => {
      clearInterval(pulseIntervalRef.current);
      clearInterval(rotateIntervalRef.current);
    };
  }, [molData, autoRotate]);

  /* ---------------------------
       Reactive Atom Pulse
  ---------------------------- */
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
            scale: inflate ? 0.55 : 0.45,
            color: inflate ? "red" : "orange",
          },
          stick: {
            radius: inflate ? 0.32 : 0.25,
            color: inflate ? "red" : "orange",
          },
        }
      );

      viewer.render();
    };

    applyPulse(false);

    if (pulse) {
      let toggle = false;
      pulseIntervalRef.current = setInterval(() => {
        applyPulse(toggle);
        toggle = !toggle;
      }, 700);
    }
  }, [reactiveAtoms, pulse]);

  return (
    <div className="relative">
      {moleculeName && (
        <div className="absolute top-2 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded z-20">
          {moleculeName}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-80 bg-white border rounded-xl"
        style={{ minHeight: "320px", overflow: "hidden" }}
      />
    </div>
  );
};

/* ----------------------------------------------------
   MAIN YIELD PREDICTION PAGE
----------------------------------------------------- */

const YieldPrediction = () => {
  const [reactants, setReactants] = useState("");
  const [reagents, setReagents] = useState("");
  const [product, setProduct] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [current3DIndex, setCurrent3DIndex] = useState(0);
  const { updateContext } = useAITutor();
  useEffect(() => {
    updateContext({
      page: "yield-prediction",
      reactants,
      reagents,
      product,
    });
  }, [reactants, reagents, product, updateContext]);

  /* ---------------------------
      API CALL
  ---------------------------- */
  const predictYieldFull = async (reactantsVal, reagentsVal, productVal) => {
    const resp = await fetch(`${API_BASE_URL}/api/v1/yield/predict_full`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reactants: reactantsVal,
        reagents: reagentsVal,
        product: productVal,
      }),
    });

    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  };

  const handleSubmit = async () => {
    if (!reactants || !product) {
      setError("Please enter both reactants and product.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrent3DIndex(0);

    try {
      const data = await predictYieldFull(reactants, reagents, product);
      setResult(data);
      // Push complete chemistry context to tutor
      updateContext({
        page: "yield-prediction",

        reactants,
        reagents,
        product,

        predicted_yield: data.predicted_yield,
        predicted_reactants: data.predicted_reactants,
        improved_variants: data.yield_improvement_structured,
        explanation: data.teacher_explanation,

        reactants_list: data.reactants_list,
        threeD_count: data.reactants_3d?.length || 0,
      });
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };
  const RANDOM_YIELD_EXAMPLES = [
    {
      reactants: "CC(=O)OC.O",
      reagents: "H2O",
      product: "CC(=O)O",
    },
    {
      reactants: "CCO.CCBr",
      reagents: "NaOH",
      product: "CCOC(C)Br",
    },
    {
      reactants: "C1=CC=CC=C1.O=O",
      reagents: "",
      product: "C1=CC=CC=C1O",
    },
    {
      reactants: "CCN(CC)CC.ClC1=CC=CC=C1",
      reagents: "NaHCO3",
      product: "CCN(CC)CCOC1=CC=CC=C1",
    },
    {
      reactants: "CC(C)=O.OCCO",
      reagents: "H2SO4",
      product: "CC(C)=OCCO",
    },
  ];

  const loadExample = () => {
    const random =
      RANDOM_YIELD_EXAMPLES[
        Math.floor(Math.random() * RANDOM_YIELD_EXAMPLES.length)
      ];

    setReactants(random.reactants);
    setReagents(random.reagents);
    setProduct(random.product);

    // Update context immediately
    updateContext({
      page: "yield-prediction",
      reactants: random.reactants,
      reagents: random.reagents,
      product: random.product,
    });
  };


  /* ---------------------------
      Apply Better Variant
  ---------------------------- */
  const handleApplyVariant = async (variant) => {
    const newReactants = variant.reactants || reactants;
    const newReagents =
      variant.reagents !== undefined ? variant.reagents : reagents;
    const newProduct = variant.product || product;

    setReactants(newReactants);
    setReagents(newReagents);
    setProduct(newProduct);

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrent3DIndex(0);

    try {
      const data = await predictYieldFull(
        newReactants,
        newReagents,
        newProduct
      );
      setResult(data);
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
      Prepare 3D Molecules
  ---------------------------- */
  const threeDModels = useMemo(() => {
    if (!result) return [];
    return [...result.reactants_3d, result.product_3d];
  }, [result]);

  const threeDLabels = useMemo(() => {
    if (!result) return [];
    return [
      ...result.reactants_list.map((_, i) => `Reactant ${i + 1}`),
      "Product",
    ];
  }, [result]);

  const canPrev = current3DIndex > 0;
  const canNext = current3DIndex < threeDModels.length - 1;

  /* ---------------------------
      RENDER PAGE
  ---------------------------- */
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-100 relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-300 blur-xl opacity-60 animate-pulse rounded-full"></div>
        <div
          className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-300 blur-xl opacity-60 animate-pulse rounded-full"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow">
              <Sparkles className="text-green-600 w-4 h-4" />
              <span className="ml-2 text-sm font-semibold">
                Optimize Your Yield
              </span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-green-600 to-emerald-600 p-8 text-white">
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-white/20 rounded-2xl">
                  <LineChart className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Reaction Yield Prediction
                  </h1>
                  <p className="text-green-100 mt-1">
                    Predict & optimize your synthetic yield
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="p-10 space-y-8">
              {/* Reactants */}
              <div>
                <label className="font-semibold flex gap-2 mb-2">
                  <FlaskConical className="text-green-600" />
                  Reactants *
                </label>
                <input
                  className="w-full p-4 rounded-xl border bg-gray-50"
                  value={reactants}
                  onChange={(e) => setReactants(e.target.value)}
                  placeholder="CC(=O)OC.O"
                />
              </div>

              {/* Reagents */}
              <div>
                <label className="font-semibold flex gap-2 mb-2">
                  <Droplet className="text-teal-600" />
                  Reagents (optional)
                </label>
                <input
                  className="w-full p-4 rounded-xl border bg-gray-50"
                  value={reagents}
                  onChange={(e) => setReagents(e.target.value)}
                  placeholder="H2O.NaOH"
                />
              </div>

              {/* Product */}
              <div>
                <label className="font-semibold flex gap-2 mb-2">
                  <Target className="text-emerald-600" />
                  Product *
                </label>
                <input
                  className="w-full p-4 rounded-xl border bg-gray-50"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="CC(=O)O"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {loading ? "Predicting..." : "Predict Yield"}
                </button>

                <button
                  onClick={loadExample}
                  className="border-2 border-green-600 text-green-600 p-4 rounded-xl"
                >
                  Load Example
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex gap-3">
                  <AlertCircle className="text-red-600" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* RESULTS */}
              {result && (
                <div className="space-y-10">
                  {/* Yield */}
                  <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-xl flex gap-3">
                    <TrendingUp className="text-green-600 w-6 h-6" />
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">
                        Yield Prediction:{" "}
                        {Number(result.predicted_yield).toFixed(2)}%
                      </h3>
                    </div>
                  </div>

                  {/* 3D VIEWER */}
                  {threeDModels.length > 0 && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">
                        3D Molecular Viewer
                      </h3>

                      <p className="text-sm text-gray-700 mb-2">
                        {threeDLabels[current3DIndex]}
                      </p>

                      <MoleculeViewer3D
                        molData={threeDModels[current3DIndex]}
                        moleculeName={threeDLabels[current3DIndex]}
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

                  {/* Explanation */}
                  {result.teacher_explanation && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-3">
                        <Sparkles className="text-green-500" />
                        Why This Yield?
                      </h3>

                      <div className="prose prose-sm text-gray-700">
                        {result.teacher_explanation
                          .split("\n")
                          .map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* STRUCTURED VARIANTS */}
                  {Array.isArray(result.yield_improvement_structured) &&
                    result.yield_improvement_structured.length > 0 && (
                      <div className="bg-white rounded-xl border shadow p-6">
                        <h3 className="font-semibold text-emerald-700 mb-3">
                          Model-Suggested Better Variants
                        </h3>

                        <p className="text-xs text-gray-600 mb-3">
                          Click <strong>Apply Variant</strong> to re-run yield
                          prediction, update 3D models, and view new results.
                        </p>

                        <div className="space-y-3">
                          {result.yield_improvement_structured.map(
                            (cand, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border bg-emerald-50/70 flex flex-col gap-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-semibold text-gray-800">
                                    Variant {idx + 1}
                                  </span>

                                  <span className="text-sm font-mono text-green-700">
                                    {Number(cand.predicted_yield).toFixed(2)}%
                                  </span>
                                </div>

                                <p className="text-xs text-gray-700">
                                  <strong>Reactants:</strong> {cand.reactants}
                                </p>
                                <p className="text-xs text-gray-700">
                                  <strong>Reagents:</strong>{" "}
                                  {cand.reagents || "—"}
                                </p>
                                <p className="text-xs text-gray-700">
                                  <strong>Product:</strong>{" "}
                                  {cand.product || product}
                                </p>

                                {cand.rationale && (
                                  <p className="text-xs text-gray-700 mt-1">
                                    {cand.rationale}
                                  </p>
                                )}

                                <div className="flex justify-end mt-1">
                                  <button
                                    onClick={() => handleApplyVariant(cand)}
                                    disabled={loading}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-60"
                                  >
                                    {loading ? "Applying..." : "Apply Variant"}
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Simple Notes */}
                  {result.yield_improvement && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-emerald-700 mb-3">
                        How To Improve Yield (General Tips)
                      </h3>

                      <div className="prose prose-sm text-gray-700">
                        {result.yield_improvement
                          .split("\n")
                          .map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* INFO */}
          <div className="mt-10 bg-white rounded-2xl p-8 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-600 text-white rounded-xl">
                <Info />
              </div>
              <h3 className="font-bold text-gray-800">
                About Yield Prediction
              </h3>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed">
              This AI-powered model predicts your reaction yield based on
              reactants, reagents, and product. It can suggest optimized
              variants with higher yields, but laboratory validation is still
              essential for real-world synthesis planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPrediction;
