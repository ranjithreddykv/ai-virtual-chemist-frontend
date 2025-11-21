// labConfig.js - Chemical Database and Configuration

export const CHEMICALS = {
  // Acids
  HCl: {
    name: "Hydrochloric Acid",
    formula: "HCl",
    color: "#E8F4F8",
    type: "acid",
    concentration: "1M",
    pH: 1,
    properties: ["strong acid", "corrosive"],
  },
  H2SO4: {
    name: "Sulfuric Acid",
    formula: "H₂SO₄",
    color: "#F0F0F0",
    type: "acid",
    concentration: "1M",
    pH: 1,
    properties: ["strong acid", "dehydrating agent"],
  },
  HNO3: {
    name: "Nitric Acid",
    formula: "HNO₃",
    color: "#FFFFCC",
    type: "acid",
    concentration: "1M",
    pH: 1,
    properties: ["strong acid", "oxidizing agent"],
  },
  CH3COOH: {
    name: "Acetic Acid",
    formula: "CH₃COOH",
    color: "#FAFAFA",
    type: "weak_acid",
    concentration: "1M",
    pH: 3,
    properties: ["weak acid", "vinegar"],
  },

  // Bases
  NaOH: {
    name: "Sodium Hydroxide",
    formula: "NaOH",
    color: "#F5F5F5",
    type: "base",
    concentration: "1M",
    pH: 14,
    properties: ["strong base", "caustic"],
  },
  KOH: {
    name: "Potassium Hydroxide",
    formula: "KOH",
    color: "#F8F8F8",
    type: "base",
    concentration: "1M",
    pH: 14,
    properties: ["strong base", "caustic"],
  },
  NH3: {
    name: "Ammonia",
    formula: "NH₃",
    color: "#F0FFFF",
    type: "weak_base",
    concentration: "1M",
    pH: 11,
    properties: ["weak base", "pungent odor"],
  },

  // Salts
  NaCl: {
    name: "Sodium Chloride",
    formula: "NaCl",
    color: "#FFFFFF",
    type: "salt",
    concentration: "1M",
    pH: 7,
    properties: ["neutral salt", "soluble"],
  },
  AgNO3: {
    name: "Silver Nitrate",
    formula: "AgNO₃",
    color: "#F8F8FF",
    type: "salt",
    concentration: "0.1M",
    pH: 7,
    properties: ["oxidizing agent", "light sensitive"],
  },
  CuSO4: {
    name: "Copper(II) Sulfate",
    formula: "CuSO₄",
    color: "#1E90FF",
    type: "salt",
    concentration: "1M",
    pH: 5,
    properties: ["blue solution", "toxic"],
  },
  FeCl3: {
    name: "Iron(III) Chloride",
    formula: "FeCl₃",
    color: "#CD853F",
    type: "salt",
    concentration: "0.5M",
    pH: 2,
    properties: ["brown solution", "acidic"],
  },

  // Oxidizing Agents
  KMnO4: {
    name: "Potassium Permanganate",
    formula: "KMnO₄",
    color: "#8B008B",
    type: "oxidizer",
    concentration: "0.1M",
    pH: 7,
    properties: ["strong oxidizer", "purple color"],
  },
  H2O2: {
    name: "Hydrogen Peroxide",
    formula: "H₂O₂",
    color: "#F0FFFF",
    type: "oxidizer",
    concentration: "3%",
    pH: 6,
    properties: ["oxidizing agent", "bleaching"],
  },

  // Indicators
  Phenolphthalein: {
    name: "Phenolphthalein",
    formula: "C₂₀H₁₄O₄",
    color: "#FFFFFF",
    type: "indicator",
    concentration: "0.01M",
    pH: 7,
    properties: ["pH indicator", "colorless in acid, pink in base"],
  },

  // Water
  H2O: {
    name: "Water",
    formula: "H₂O",
    color: "#E8F4F8",
    type: "solvent",
    concentration: "pure",
    pH: 7,
    properties: ["universal solvent", "neutral"],
  },
};

export const REACTION_RULES = [
  {
    id: "neutralization",
    pattern: ["acid", "base"],
    description: "Acid-Base Neutralization",
    example: "HCl + NaOH → NaCl + H₂O",
    effects: {
      heat: true,
      gas: false,
      precipitate: false,
      colorChange: true,
    },
  },
  {
    id: "precipitation",
    pattern: ["AgNO3", "NaCl"],
    description: "Silver Chloride Precipitation",
    equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
    effects: {
      heat: false,
      gas: false,
      precipitate: true,
      precipitateColor: "#F5F5F5",
      colorChange: true,
    },
  },
  {
    id: "oxidation_permanganate",
    pattern: ["KMnO4", "acid"],
    description: "Permanganate Oxidation",
    equation: "KMnO₄ + H⁺ → Mn²⁺ + ...",
    effects: {
      heat: false,
      gas: true,
      precipitate: false,
      colorChange: true,
      finalColor: "#FFB6C1",
    },
  },
  {
    id: "decomposition_peroxide",
    pattern: ["H2O2"],
    description: "Hydrogen Peroxide Decomposition",
    equation: "2H₂O₂ → 2H₂O + O₂↑",
    effects: {
      heat: true,
      gas: true,
      precipitate: false,
      colorChange: false,
    },
  },
  {
    id: "copper_complex",
    pattern: ["CuSO4", "NH3"],
    description: "Copper-Ammonia Complex Formation",
    equation: "CuSO₄ + 4NH₃ → [Cu(NH₃)₄]²⁺ + SO₄²⁻",
    effects: {
      heat: false,
      gas: false,
      precipitate: false,
      colorChange: true,
      finalColor: "#000080",
    },
  },
];

export const LAB_SETTINGS = {
  maxBeakers: 4,
  maxChemicalsPerBeaker: 5,
  beakerCapacity: 100, // mL
  defaultVolume: 50, // mL
  animationDuration: 2000, // ms
  bubbleLifetime: 3000, // ms
};

export const VISUAL_EFFECTS = {
  bubble: {
    count: 20,
    speed: 0.02,
    size: 0.05,
    lifetime: 3000,
  },
  precipitate: {
    particleCount: 50,
    settleDuration: 2000,
    size: 0.02,
  },
  steam: {
    particleCount: 30,
    riseSpeed: 0.03,
    lifetime: 2000,
  },
};
