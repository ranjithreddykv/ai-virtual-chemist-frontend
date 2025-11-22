import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Target,
  Info,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAITutor } from "../context/AITutorContext";

const API_BASE_URL = "http://localhost:8000";

/* ---------------------------------------------------------
   UPGRADED 3D MOLECULE VIEWER (For Retro + Forward)
---------------------------------------------------------- */
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

  /* ---------------------------
       1. Initialize Viewer
  ---------------------------- */
  useEffect(() => {
    if (!molData || !window.$3Dmol || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const viewer = window.$3Dmol.createViewer(containerRef.current, {
      backgroundColor: "white",
    });

    viewer.addModel(molData, "mol");

    viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });

    viewer.zoomTo();
    viewer.render();
    viewerRef.current = viewer;

    // Fade-in animation
    containerRef.current.style.opacity = 0;
    setTimeout(() => {
      containerRef.current.style.transition = "opacity 0.6s ease";
      containerRef.current.style.opacity = 1;
    }, 20);

    return () => {
      clearInterval(pulseIntervalRef.current);
      clearInterval(rotateIntervalRef.current);
    };
  }, [molData]);

  /* ---------------------------
       2. Pulsing Reactive Atoms
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
            radius: inflate ? 0.3 : 0.25,
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

  /* ---------------------------
       3. Auto-Rotation
  ---------------------------- */
 useEffect(() => {
   if (!molData || !window.$3Dmol || !containerRef.current) return;

   // Clean previous canvas
   containerRef.current.innerHTML = "";

   const viewer = window.$3Dmol.createViewer(containerRef.current, {
     backgroundColor: "white",
   });

   viewer.addModel(molData, "mol");

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

   // 🟢 Start rotation here for each molecule
   clearInterval(rotateIntervalRef.current);
   if (autoRotate) {
     rotateIntervalRef.current = setInterval(() => {
       viewer.rotate(1);
       viewer.render();
     }, 40);
   }

   return () => {
     clearInterval(pulseIntervalRef.current);
     clearInterval(rotateIntervalRef.current);
   };
 }, [molData, autoRotate]);

  /* ---------------------------
       4. Render Component
  ---------------------------- */
  return (
    <div className="relative">
      {moleculeName && (
        <div className="absolute top-2 left-3 bg-black/60 px-2 py-1 text-white text-xs rounded-md z-20">
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

/* ---------------------------------------------------------
   MAIN RETROSYNTHESIS COMPONENT
---------------------------------------------------------- */

const RetrosynthesisPrediction = () => {
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { updateContext } = useAITutor();
  useEffect(() => {
    updateContext({
      page: "retrosynthesis",
      mode: "retrosynthesis",
    });
  }, []);

  /* ---------------------------
       API CALL
  ---------------------------- */
  const predictRetro = async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/retro/predict_full`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    });

    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };

  const handleSubmit = async () => {
    if (!product.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentIndex(0);

    try {
      const data = await predictRetro();
      updateContext({
        page: "retrosynthesis",
        mode: "retrosynthesis",
        product: product,
        predicted_reactants: data?.predicted_reactants,
        reactants_list: data?.reactants_list,
      });

      setResult(data);


    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
const RETRO_EXAMPLES = [
  {
    product: "CCN(CC)CCNC(=S)NC1CCCc2cc(C)cnc21",
    name: "Thio-urea substituted bicyclic amine",
  },
  {
    product: "CCOC(=O)C1=CC=CC=C1",
    name: "Ethyl benzoate",
  },
  {
    product: "CC(C)OC(=O)C1=CC=CC=C1",
    name: "Isopropyl benzoate",
  },
  {
    product: "COC(=O)CCN1CCCC1=O",
    name: "N-morpholino propionate",
  },
  {
    product: "CC(C)N(CCO)C(=O)C1=CC=CC=C1",
    name: "Amide with isopropyl tertiary amine",
  },
  {
    product: "CCOC(=O)NCCC1=CC=CC=C1",
    name: "Phenethyl carbamate derivative",
  },
  {
    product: "CCN(CC)CCOC(=O)C1=CC=CC=N1",
    name: "Aromatic amide with tertiary amine",
  },
];

  const loadExample = () => {
    const random =
      RETRO_EXAMPLES[Math.floor(Math.random() * RETRO_EXAMPLES.length)];

    setProduct(random.product);

    // Update Tutor Context immediately
    updateContext({
      page: "retrosynthesis",
      mode: "retrosynthesis",
      product: random.product,
      exampleName: random.name,
      predicted_reactants: null,
      reactants_list: null,
    });
  };


  /* ---------------------------
       Prepare Molecules
  ---------------------------- */
  const threeDModels = useMemo(() => {
    if (!result) return [];
    return [...result.reactants_3d, result.product_3d];
  }, [result]);

  const threeDLabels = useMemo(() => {
    if (!result) return [];
    return [
      ...result.reactants_list.map((r, i) => `Reactant ${i + 1}`),
      "Target Product",
    ];
  }, [result]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < threeDModels.length - 1;

  /* ---------------------------
       RENDER PAGE
  ---------------------------- */
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-rose-100 relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 blur-xl opacity-60 animate-pulse rounded-full"></div>
        <div
          className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 blur-xl opacity-60 animate-pulse rounded-full"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Title Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow">
              <Sparkles className="text-purple-500 w-4 h-4" />
              <span className="ml-2 text-sm font-semibold">
                Retrosynthesis AI Engine
              </span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-pink-600 p-8 text-white">
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-white/20 rounded-2xl">
                  <Target className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Retrosynthesis Prediction
                  </h1>
                  <p className="text-purple-100 mt-1">
                    Break down your target into feasible starting materials
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-10 space-y-8">
              <div>
                <label className="font-semibold flex gap-2 mb-2">
                  <Target className="text-purple-600" />
                  Target Product (SMILES) *
                </label>
                <input
                  className="w-full p-4 rounded-xl border-2 bg-gray-50"
                  placeholder="Enter your target product SMILES"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Target />}
                  {loading ? "Analyzing..." : "Predict Reactants"}
                </button>

                <button
                  onClick={loadExample}
                  className="border-2 border-purple-600 text-purple-600 p-4 rounded-xl"
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

              {/* Results */}
              {result && (
                <div className="space-y-10">
                  {/* Success Message */}
                  <div className="p-6 bg-purple-50 border-l-4 border-purple-500 rounded-xl flex gap-3">
                    <CheckCircle2 className="text-purple-600" />
                    <div>
                      <h3 className="font-bold text-purple-800 text-lg">
                        Retrosynthesis Successful!
                      </h3>
                      <p className="text-purple-700 text-sm">
                        3D structures & explanation are ready.
                      </p>
                    </div>
                  </div>

                  {/* Reactants Output */}
                  <div className="bg-white border rounded-xl p-6 shadow">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Predicted Reactants
                    </h4>
                    <div className="font-mono bg-gray-100 p-4 rounded border">
                      {result.predicted_reactants}
                    </div>
                  </div>

                  {/* 3D Viewer Section */}
                  {threeDModels.length > 0 && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <FlaskConical className="text-pink-600" />
                        3D Molecular Viewer
                      </h3>

                      <p className="text-sm text-gray-700 mb-2">
                        {threeDLabels[currentIndex]}
                      </p>

                      {/* UPDATED COMPONENT USAGE */}
                      <MoleculeViewer3D
                        molData={threeDModels[currentIndex]}
                        moleculeName={threeDLabels[currentIndex]}
                      />

                      <div className="flex justify-between mt-4">
                        <button
                          disabled={!canPrev}
                          onClick={() =>
                            canPrev && setCurrentIndex((i) => i - 1)
                          }
                          className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                          <ChevronLeft className="mr-1" /> Prev
                        </button>

                        <span className="text-sm text-gray-600">
                          {currentIndex + 1} / {threeDModels.length}
                        </span>

                        <button
                          disabled={!canNext}
                          onClick={() =>
                            canNext && setCurrentIndex((i) => i + 1)
                          }
                          className="px-4 py-2 border rounded disabled:opacity-40"
                        >
                          Next <ChevronRight className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Professor Explanation */}
                  {result.teacher_explanation && (
                    <div className="bg-white rounded-xl border shadow p-6">
                      <h3 className="font-semibold text-pink-700 flex items-center gap-2 mb-3">
                        <Sparkles className="text-pink-500" />
                        Professor Explanation
                      </h3>

                      <div className="prose prose-sm text-gray-700">
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

          {/* Info Box */}
          <div className="mt-10 bg-white rounded-2xl p-8 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-600 text-white rounded-xl">
                <Info />
              </div>
              <h3 className="font-bold text-gray-800">How to Use</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Enter Product",
                  desc: "Provide SMILES of your target molecule",
                },
                {
                  title: "Predict Reactants",
                  desc: "AI identifies plausible precursors",
                },
                {
                  title: "Analyze Pathway",
                  desc: "Inspect 3D structures & explanations",
                },
                {
                  title: "Plan Synthesis",
                  desc: "Use predictions for lab route design",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-gray-100 rounded-xl border"
                >
                  <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full">
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

export default RetrosynthesisPrediction;
