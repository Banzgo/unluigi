import { useState } from "react";
import "./App.css";
import { DiceInput, type DiceInputState } from "./components/DiceInput";
import { ProbabilityChart } from "./components/ProbabilityChart";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import {
  calculateStatistics,
  parseDiceExpression,
  runSimulation,
  type SimulationParameters,
  type SimulationResults,
} from "./engine";

function App() {
  const [inputs, setInputs] = useState<DiceInputState[]>([
    {
      id: crypto.randomUUID(),
      numAttacks: "10",
      hit: "auto",
      wound: "auto",
      armorSave: "none",
      specialSave: "none",
    },
  ]);
  const [results, setResults] = useState<string>("");
  const [simResults, setSimResults] = useState<SimulationResults | null>(null);

  const addInput = () => {
    setInputs([
      ...inputs,
      {
        id: crypto.randomUUID(),
        numAttacks: "10",
        hit: "auto",
        wound: "auto",
        armorSave: "none",
        specialSave: "none",
      },
    ]);
  };

  const removeInput = (id: string) => {
    setInputs(inputs.filter((input) => input.id !== id));
  };

  const updateInput = (id: string, updates: Partial<DiceInputState>) => {
    setInputs(
      inputs.map((input) =>
        input.id === id ? { ...input, ...updates } : input
      )
    );
  };

  const validateInput = (input: DiceInputState): boolean => {
    if (!input.numAttacks || input.numAttacks.trim() === "") {
      return false;
    }
    try {
      parseDiceExpression(input.numAttacks);
      return true;
    } catch {
      return false;
    }
  };

  const runCombinedSimulation = () => {
    // Validate all inputs
    const allValid = inputs.every(validateInput);
    if (!allValid) {
      return;
    }

    const startTime = performance.now();
    const iterations = 10000;

    // Run simulations for each input and collect distributions
    const distributions: number[][] = inputs.map((input) => {
      const params: SimulationParameters = {
        numAttacks: input.numAttacks,
        toHit: input.hit === "auto" ? "auto" : input.hit,
        rerollHits: "none",
        toWound: input.wound === "auto" ? "auto" : input.wound,
        rerollWounds: "none",
        armorSave: input.armorSave === "none" ? "none" : input.armorSave,
        armorPiercing: 0,
        rerollArmorSaves: "none",
        specialSave: input.specialSave === "none" ? "none" : input.specialSave,
        rerollSpecialSaves: "none",
        poison: false,
        lethalStrike: false,
        fury: false,
        multipleWounds: 1,
        targetMaxWounds: Number.MAX_SAFE_INTEGER,
        iterations,
      };

      return runSimulation(params);
    });

    // Combine distributions by summing wounds for each iteration
    const combinedDistribution: number[] = [];
    for (let i = 0; i < iterations; i++) {
      let totalWounds = 0;
      for (const dist of distributions) {
        totalWounds += dist[i];
      }
      combinedDistribution.push(totalWounds);
    }

    const endTime = performance.now();
    const executionTimeMs = endTime - startTime;

    // Calculate statistics on combined distribution
    const simulationResults = calculateStatistics(
      combinedDistribution,
      iterations,
      executionTimeMs
    );

    const output = `
Simulation Results (10,000 iterations)
======================================
Combined ${inputs.length} input${inputs.length > 1 ? "s" : ""}

Mean: ${simulationResults.mean.toFixed(2)} wounds
Median: ${simulationResults.median.toFixed(2)} wounds
Mode: ${simulationResults.mode} wounds

Percentiles:
- 25th: ${simulationResults.percentile25.toFixed(2)} wounds
- 50th: ${simulationResults.percentile50.toFixed(2)} wounds
- 75th: ${simulationResults.percentile75.toFixed(2)} wounds
- 95th: ${simulationResults.percentile95.toFixed(2)} wounds

Range: ${simulationResults.min} - ${simulationResults.max} wounds
Execution time: ${simulationResults.executionTimeMs.toFixed(2)}ms

Top Results:
${simulationResults.probabilityDistribution
  .sort((a, b) => b.probability - a.probability)
  .slice(0, 5)
  .map(
    (p) =>
      `  ${p.wounds} wounds: ${p.probability.toFixed(2)}% (${p.count} times)`
  )
  .join("\n")}
    `.trim();

    setResults(output);
    setSimResults(simulationResults);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <h1
          className="text-6xl font-bold text-center text-brand-green"
          style={{ fontFamily: "var(--font-display)" }}
        >
          UNLUIGI
        </h1>

        {/* Input Cards */}
        <div className="space-y-4">
          {inputs.map((input) => (
            <DiceInput
              key={input.id}
              input={input}
              onUpdate={updateInput}
              onRemove={removeInput}
              showRemove={inputs.length > 1}
            />
          ))}
        </div>

        {/* Add Input Button */}
        <Button
          onClick={addInput}
          className="w-full h-12 text-lg bg-secondary hover:bg-secondary/80 text-foreground border-border"
          variant="outline"
        >
          + Add Another Input
        </Button>

        {/* Simulate Button */}
        <Button
          onClick={runCombinedSimulation}
          disabled={!inputs.every(validateInput)}
          className="w-full h-16 text-2xl bg-brand-green hover:bg-brand-green-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simulate
        </Button>

        {/* Results */}
        {results && (
          <Card className="p-6 bg-card border-border">
            <pre className="text-left text-sm whitespace-pre-wrap text-foreground">
              {results}
            </pre>
          </Card>
        )}

        {/* Chart */}
        {simResults && <ProbabilityChart results={simResults} />}
      </div>
    </div>
  );
}

export default App;
