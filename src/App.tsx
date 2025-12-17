import { useState } from "react";
import "./App.css";
import { runSimulation, type SimulationParameters } from "./engine";

function App() {
  const [results, setResults] = useState<string>("");

  const runTestSimulation = () => {
    // Test case: 10 attacks, 4+ to hit, 4+ to wound, 4+ armor save
    const params: SimulationParameters = {
      numAttacks: 10,
      toHit: 4,
      rerollHits: "none",
      toWound: 4,
      rerollWounds: "none",
      armorSave: 4,
      armorPiercing: 0,
      rerollArmorSaves: "none",
      specialSave: "none",
      rerollSpecialSaves: "none",
      poison: false,
      lethalStrike: false,
      fury: false,
      multipleWounds: 1,
      targetMaxWounds: 10,
      iterations: 10000,
    };

    const simResults = runSimulation(params);

    const output = `
Simulation Results (10,000 iterations)
======================================
Mean: ${simResults.mean.toFixed(2)} wounds
Median: ${simResults.median.toFixed(2)} wounds
Mode: ${simResults.mode} wounds

Percentiles:
- 25th: ${simResults.percentile25.toFixed(2)} wounds
- 50th: ${simResults.percentile50.toFixed(2)} wounds
- 75th: ${simResults.percentile75.toFixed(2)} wounds
- 95th: ${simResults.percentile95.toFixed(2)} wounds

Range: ${simResults.min} - ${simResults.max} wounds
Execution time: ${simResults.executionTimeMs.toFixed(2)}ms

Top Results:
${simResults.probabilityDistribution
  .sort((a, b) => b.probability - a.probability)
  .slice(0, 5)
  .map(
    (p) =>
      `  ${p.wounds} wounds: ${p.probability.toFixed(2)}% (${p.count} times)`
  )
  .join("\n")}
    `.trim();

    setResults(output);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>T9A Dice Simulator</h1>
      <p>Core simulation engine is ready!</p>

      <button
        type="button"
        onClick={runTestSimulation}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          background: "#646cff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginTop: "1rem",
        }}
      >
        Run Test Simulation
      </button>

      {results && (
        <pre
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#1a1a1a",
            borderRadius: "8px",
            overflow: "auto",
            textAlign: "left",
            fontSize: "0.9rem",
          }}
        >
          {results}
        </pre>
      )}
    </div>
  );
}

export default App;
