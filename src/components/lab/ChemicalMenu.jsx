/* eslint-disable no-unused-vars */
// ChemicalMenu.jsx - Chemical Selection Panel

import React, { useState } from "react";
import { CHEMICALS } from "./labConfig";
import { Beaker, Droplet, FlaskConical, TestTube } from "lucide-react";

export default function ChemicalMenu({ onAddChemical, selectedBeaker }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = {
    all: { name: "All", icon: Beaker },
    acid: { name: "Acids", icon: Droplet },
    base: { name: "Bases", icon: FlaskConical },
    salt: { name: "Salts", icon: TestTube },
    oxidizer: { name: "Oxidizers", icon: FlaskConical },
  };

  const filteredChemicals = Object.entries(CHEMICALS).filter(([id, chem]) => {
    const matchesCategory =
      activeCategory === "all" ||
      chem.type === activeCategory ||
      chem.type === `weak_${activeCategory}`;
    const matchesSearch =
      chem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chem.formula.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4">Chemical Library</h2>

      {!selectedBeaker && (
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 mb-4">
          <p className="text-amber-200 text-sm">⚠️ Select a beaker first</p>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search chemicals..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {Object.entries(categories).map(([key, { name, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
              activeCategory === key
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Icon className="w-4 h-4" />
            {name}
          </button>
        ))}
      </div>

      {/* Chemical Grid */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {filteredChemicals.map(([id, chemical]) => (
          <button
            key={id}
            onClick={() => selectedBeaker && onAddChemical(id)}
            disabled={!selectedBeaker}
            className={`w-full p-3 rounded-lg text-left transition-all ${
              selectedBeaker
                ? "bg-slate-700 hover:bg-slate-600 cursor-pointer"
                : "bg-slate-700/50 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-white">{chemical.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                {chemical.type.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border-2 border-slate-500"
                style={{ backgroundColor: chemical.color }}
              />
              <p className="text-sm text-slate-300">{chemical.formula}</p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400">
                pH: {chemical.pH} | {chemical.concentration}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredChemicals.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No chemicals found
        </div>
      )}
    </div>
  );
}
