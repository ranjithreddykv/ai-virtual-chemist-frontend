import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

import ForwardPrediction from "./pages/ForwardReaction";
import RetrosynthesisPrediction from "./pages/RetroSynthesis";
import YieldPrediction from "./pages/YieldPredection";
import ReactionMechanismPredictor from "./pages/MechanismPredictor";

import {
  Beaker,
  FlaskConical,
  LineChart,
  Home,
  Sparkles,
  ArrowRight,
  Atom,
} from "lucide-react";

import { useEffect, useState } from "react";

// ✅ Import Tutor Context + Widget
import { AITutorProvider } from "./context/AITutorContext";
import AITutorWidget from "./components/AITutorWidget";

function App() {
  return (
    <AITutorProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 relative">
          <nav className="bg-white shadow-md z-50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link
                    to="/"
                    className="flex items-center gap-2 text-xl font-bold text-gray-900"
                  >
                    <div className="p-2 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                      <Beaker className="w-6 h-6 text-white" />
                    </div>
                    AI Virtual Chemist
                  </Link>
                </div>

                <div className="flex items-center space-x-4">
                  <Link
                    to="/forward"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all"
                  >
                    <Beaker className="w-5 h-5" />
                    Forward
                  </Link>
                  <Link
                    to="/retrosynthesis"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all"
                  >
                    <FlaskConical className="w-5 h-5" />
                    Retrosynthesis
                  </Link>
                  <Link
                    to="/yield"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-600 transition-all"
                  >
                    <LineChart className="w-5 h-5" />
                    Yield
                  </Link>
                  <Link
                    to="/mechanism"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all"
                  >
                    <Atom className="w-5 h-5" />
                    Mechanism
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/forward" element={<ForwardPrediction />} />
            <Route
              path="/retrosynthesis"
              element={<RetrosynthesisPrediction />}
            />
            <Route path="/yield" element={<YieldPrediction />} />
            <Route path="/mechanism" element={<ReactionMechanismPredictor />} />
          </Routes>

          {/* ✅ AI Tutor always visible (floating widget) */}
          <AITutorWidget />
        </div>
      </Router>
    </AITutorProvider>
  );
}

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      id: "forward",
      title: "Forward Prediction",
      description:
        "Predict reaction products from reactants and conditions. Input SMILES strings and get predicted product structures.",
      icon: Beaker,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "retrosynthesis",
      title: "Retrosynthesis",
      description:
        "Predict possible reactants from a target product. Discover synthetic routes for your target molecules.",
      icon: FlaskConical,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "yield",
      title: "Yield Prediction",
      description:
        "Estimate reaction yields from complete reaction SMILES. Optimize your synthetic planning.",
      icon: LineChart,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      id: "mechanism",
      title: "Mechanism Prediction",
      description:
        "Predict elementary steps and reactive atom positions. Uncover detailed reaction pathways and mechanisms.",
      icon: Atom,
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* BG blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero */}
        <div
          className={`text-center mb-16 pt-12 transition-all duration-1000 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6 animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">
              AI-Powered Chemical Intelligence
            </span>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Chemical Reaction
            <span className="block bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Prediction Platform
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trained models on millions of reactions for forward synthesis,
            retrosynthesis, yield, and mechanism prediction.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredCard === feature.id;

            return (
              <div
                key={feature.id}
                className={`transition-all duration-700 ${
                  isVisible ? "opacity-100" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(`/${feature.id}`)}
              >
                <div className="group cursor-pointer h-full p-8 bg-white/90 rounded-3xl shadow-xl hover:scale-105 transition-all">
                  <div
                    className={`p-4 bg-linear-to-br ${
                      feature.gradient
                    } rounded-2xl w-fit mb-6 transition-all ${
                      isHovered ? "rotate-6 scale-110" : ""
                    }`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center justify-between">
                    {feature.title}
                    <ArrowRight
                      className={`w-5 h-5 transition-all ${
                        isHovered
                          ? "translate-x-2 text-gray-900"
                          : "text-gray-400"
                      }`}
                    />
                  </h2>

                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* About */}
        <div
          className={`bg-white/90 p-10 rounded-3xl shadow-2xl transition-all ${
            isVisible ? "opacity-100" : "opacity-0 translate-y-10"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              About the Models
            </h3>
          </div>

          <p className="text-gray-700 text-lg mb-6">
            This platform uses state-of-the-art ReactionT5v2 models trained on
            millions of chemical reactions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
