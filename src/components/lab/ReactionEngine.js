// ReactionEngine.js - Chemistry Simulation Engine

import { CHEMICALS, REACTION_RULES } from "./labConfig";

/**
 * Core chemistry engine that processes reactions between chemicals
 */
class ReactionEngine {
  constructor() {
    this.reactionHistory = [];
  }

  /**
   * Analyze beaker contents and determine what reactions occur
   * @param {Array} contents - Array of chemical IDs in the beaker
   * @returns {Object} Reaction result with products, effects, and visual data
   */
  analyzeReaction(contents) {
    if (!contents || contents.length === 0) {
      return this.createEmptyResult();
    }

    if (contents.length === 1) {
      return this.createSingleChemicalResult(contents[0]);
    }

    // Check for specific reaction patterns
    const reaction = this.findMatchingReaction(contents);

    if (reaction) {
      return this.processReaction(contents, reaction);
    }

    // No specific reaction - just mix colors
    return this.processMixture(contents);
  }

  /**
   * Find a matching reaction rule for the given chemicals
   */
  findMatchingReaction(contents) {
    // Check AgNO3 + NaCl precipitation
    if (contents.includes("AgNO3") && contents.includes("NaCl")) {
      return REACTION_RULES.find((r) => r.id === "precipitation");
    }

    // Check acid + base neutralization
    const acids = contents.filter(
      (c) => CHEMICALS[c]?.type === "acid" || CHEMICALS[c]?.type === "weak_acid"
    );
    const bases = contents.filter(
      (c) => CHEMICALS[c]?.type === "base" || CHEMICALS[c]?.type === "weak_base"
    );

    if (acids.length > 0 && bases.length > 0) {
      return REACTION_RULES.find((r) => r.id === "neutralization");
    }

    // Check KMnO4 + acid
    if (contents.includes("KMnO4") && acids.length > 0) {
      return REACTION_RULES.find((r) => r.id === "oxidation_permanganate");
    }

    // Check H2O2 decomposition (can be catalyzed or spontaneous)
    if (contents.includes("H2O2")) {
      return REACTION_RULES.find((r) => r.id === "decomposition_peroxide");
    }

    // Check Cu + NH3 complex
    if (contents.includes("CuSO4") && contents.includes("NH3")) {
      return REACTION_RULES.find((r) => r.id === "copper_complex");
    }

    return null;
  }

  /**
   * Process a matched reaction
   */
  processReaction(contents, reaction) {
    const resultColor = this.computeReactionColor(contents, reaction);
    const products = this.determineProducts(contents, reaction);

    return {
      occurred: true,
      type: reaction.id,
      description: reaction.description,
      equation: reaction.equation || this.generateEquation(contents),
      reactants: contents.map((c) => ({
        id: c,
        name: CHEMICALS[c]?.name,
        formula: CHEMICALS[c]?.formula,
      })),
      products: products,
      effects: {
        colorChange: reaction.effects.colorChange,
        heat: reaction.effects.heat,
        gas: reaction.effects.gas,
        precipitate: reaction.effects.precipitate,
        bubbles: reaction.effects.gas,
        steam: reaction.effects.heat,
      },
      visualData: {
        liquidColor: resultColor,
        precipitateColor: reaction.effects.precipitateColor,
        bubbleIntensity: reaction.effects.gas ? "high" : "none",
        heatLevel: reaction.effects.heat ? "warm" : "normal",
      },
      pH: this.estimatePH(contents, reaction),
      timestamp: Date.now(),
    };
  }

  /**
   * Process a simple mixture (no reaction)
   */
  processMixture(contents) {
    const mixedColor = this.mixColors(contents);

    return {
      occurred: false,
      type: "mixture",
      description: "Physical mixture (no chemical reaction)",
      equation: contents.map((c) => CHEMICALS[c]?.formula).join(" + "),
      reactants: contents.map((c) => ({
        id: c,
        name: CHEMICALS[c]?.name,
        formula: CHEMICALS[c]?.formula,
      })),
      products: [],
      effects: {
        colorChange: true,
        heat: false,
        gas: false,
        precipitate: false,
        bubbles: false,
        steam: false,
      },
      visualData: {
        liquidColor: mixedColor,
        precipitateColor: null,
        bubbleIntensity: "none",
        heatLevel: "normal",
      },
      pH: this.estimatePH(contents, null),
      timestamp: Date.now(),
    };
  }

  /**
   * Create result for single chemical
   */
  createSingleChemicalResult(chemicalId) {
    const chemical = CHEMICALS[chemicalId];

    return {
      occurred: false,
      type: "single",
      description: `Pure ${chemical.name}`,
      equation: chemical.formula,
      reactants: [
        {
          id: chemicalId,
          name: chemical.name,
          formula: chemical.formula,
        },
      ],
      products: [],
      effects: {
        colorChange: false,
        heat: false,
        gas: false,
        precipitate: false,
        bubbles: false,
        steam: false,
      },
      visualData: {
        liquidColor: chemical.color,
        precipitateColor: null,
        bubbleIntensity: "none",
        heatLevel: "normal",
      },
      pH: chemical.pH,
      timestamp: Date.now(),
    };
  }

  /**
   * Create empty beaker result
   */
  createEmptyResult() {
    return {
      occurred: false,
      type: "empty",
      description: "Empty beaker",
      equation: "",
      reactants: [],
      products: [],
      effects: {},
      visualData: {
        liquidColor: "#E8F4F8",
        precipitateColor: null,
        bubbleIntensity: "none",
        heatLevel: "normal",
      },
      pH: 7,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine reaction products
   */
  determineProducts(contents, reaction) {
    switch (reaction.id) {
      case "neutralization":
        return [
          { formula: "Salt", name: "Salt (varies)" },
          { formula: "H₂O", name: "Water" },
        ];
      case "precipitation":
        return [
          { formula: "AgCl↓", name: "Silver Chloride (precipitate)" },
          { formula: "NaNO₃", name: "Sodium Nitrate" },
        ];
      case "oxidation_permanganate":
        return [
          { formula: "Mn²⁺", name: "Manganese(II) ion" },
          { formula: "H₂O", name: "Water" },
        ];
      case "decomposition_peroxide":
        return [
          { formula: "H₂O", name: "Water" },
          { formula: "O₂↑", name: "Oxygen gas" },
        ];
      case "copper_complex":
        return [
          { formula: "[Cu(NH₃)₄]²⁺", name: "Tetraamminecopper(II) complex" },
        ];
      default:
        return [];
    }
  }

  /**
   * Compute color after reaction
   */
  computeReactionColor(contents, reaction) {
    if (reaction.effects.finalColor) {
      return reaction.effects.finalColor;
    }
    return this.mixColors(contents);
  }

  /**
   * Mix colors from multiple chemicals
   */
  mixColors(chemicalIds) {
    if (chemicalIds.length === 0) return "#E8F4F8";
    if (chemicalIds.length === 1)
      return CHEMICALS[chemicalIds[0]]?.color || "#E8F4F8";

    // Convert hex to RGB, average, convert back
    const colors = chemicalIds
      .map((id) => CHEMICALS[id]?.color)
      .filter(Boolean)
      .map((hex) => this.hexToRgb(hex));

    const avgR = Math.round(
      colors.reduce((sum, c) => sum + c.r, 0) / colors.length
    );
    const avgG = Math.round(
      colors.reduce((sum, c) => sum + c.g, 0) / colors.length
    );
    const avgB = Math.round(
      colors.reduce((sum, c) => sum + c.b, 0) / colors.length
    );

    return this.rgbToHex(avgR, avgG, avgB);
  }

  /**
   * Estimate pH of mixture
   */
  estimatePH(contents, reaction) {
    if (reaction?.id === "neutralization") {
      return 7; // Neutralization produces neutral pH
    }

    const pHValues = contents
      .map((id) => CHEMICALS[id]?.pH)
      .filter((pH) => pH !== undefined);

    if (pHValues.length === 0) return 7;

    // Simple average (not chemically accurate but reasonable approximation)
    return pHValues.reduce((sum, pH) => sum + pH, 0) / pHValues.length;
  }

  /**
   * Generate equation string
   */
  generateEquation(contents) {
    return (
      contents.map((c) => CHEMICALS[c]?.formula).join(" + ") + " → Products"
    );
  }

  /**
   * Color conversion utilities
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 232, g: 244, b: 248 };
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Format reaction for API submission
   */
  formatForAPI(beakerId, contents, reactionResult) {
    return {
      beaker_id: beakerId,
      chemicals: contents.map((c) => ({
        id: c,
        name: CHEMICALS[c]?.name,
        formula: CHEMICALS[c]?.formula,
        concentration: CHEMICALS[c]?.concentration,
      })),
      reaction: {
        type: reactionResult.type,
        occurred: reactionResult.occurred,
        equation: reactionResult.equation,
        products: reactionResult.products,
      },
      conditions: {
        temperature: 298, // Kelvin (25°C)
        pressure: 1, // atm
        pH: reactionResult.pH,
      },
      timestamp: reactionResult.timestamp,
    };
  }
}

// Export singleton instance
export const reactionEngine = new ReactionEngine();
export default ReactionEngine;
