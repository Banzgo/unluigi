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
      hit: 4,
      wound: 4,
      armorSave: 5,
      specialSave: "none",
      rerollHits: "none",
      rerollWounds: "none",
      rerollArmorSaves: "none",
      rerollSpecialSaves: "none",
      poison: false,
      lethalStrike: false,
      fury: false,
      multipleWounds: "1",
      targetMaxWounds: 1,
    },
  ]);
  const [results, setResults] = useState<string>("");
  const [simResults, setSimResults] = useState<SimulationResults | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  const addInput = () => {
    setInputs([
      ...inputs,
      {
        id: crypto.randomUUID(),
        numAttacks: "10",
        hit: 4,
        wound: 4,
        armorSave: 5,
        specialSave: "none",
        rerollHits: "none",
        rerollWounds: "none",
        rerollArmorSaves: "none",
        rerollSpecialSaves: "none",
        poison: false,
        lethalStrike: false,
        fury: false,
        multipleWounds: "1",
        targetMaxWounds: 1,
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
        rerollHits: input.rerollHits,
        toWound: input.wound === "auto" ? "auto" : input.wound,
        rerollWounds: input.rerollWounds,
        armorSave: input.armorSave === "none" ? "none" : input.armorSave,
        armorPiercing: 0,
        rerollArmorSaves: input.rerollArmorSaves,
        specialSave: input.specialSave === "none" ? "none" : input.specialSave,
        rerollSpecialSaves: input.rerollSpecialSaves,
        poison: input.poison,
        lethalStrike: input.lethalStrike,
        fury: input.fury,
        multipleWounds: input.multipleWounds,
        targetMaxWounds: input.targetMaxWounds,
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
Variance: ${simulationResults.variance.toFixed(2)}

Percentiles:
- 10th: ${simulationResults.percentile10.toFixed(2)} wounds
- 90th: ${simulationResults.percentile90.toFixed(2)} wounds

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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={addInput}
            className="flex-none w-48 h-14 text-lg bg-secondary hover:bg-secondary/80 text-foreground border-border"
            variant="outline"
          >
            + Add Another Input
          </Button>

          <Button
            onClick={runCombinedSimulation}
            disabled={!inputs.every(validateInput)}
            className="flex-1 h-14 text-xl bg-brand-green hover:bg-brand-green-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simulate
          </Button>
        </div>

        {/* Results */}
        {simResults && (
          <div className="space-y-6">
            {/* Chart with Score */}
            <ProbabilityChart results={simResults} />

            {/* Debug Toggle */}
            <div className="text-center">
              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="outline"
                className="text-sm"
              >
                {showDebug ? "Hide" : "Show"} Debug Info
              </Button>
            </div>

            {/* Debug Info */}
            {showDebug && results && (
              <Card className="p-6 bg-card border-border">
                <pre className="text-left text-sm whitespace-pre-wrap text-foreground">
                  {results}
                </pre>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
