import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { runSimulation, type SimulationParameters } from "./engine";

type ToggleValue = 2 | 3 | 4 | 5 | 6 | "auto" | "none";

function App() {
  const [numAttacks, setNumAttacks] = useState<string>("10");
  const [hit, setHit] = useState<ToggleValue>("auto");
  const [wound, setWound] = useState<ToggleValue>("auto");
  const [armorSave, setArmorSave] = useState<ToggleValue>("none");
  const [specialSave, setSpecialSave] = useState<ToggleValue>("none");
  const [results, setResults] = useState<string>("");

  const hitOptions: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
  const woundOptions: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
  const saveOptions: ToggleValue[] = [2, 3, 4, 5, 6, "none"];

  const cycleValue = (current: ToggleValue, options: ToggleValue[]) => {
    const currentIndex = options.indexOf(current);
    return options[(currentIndex + 1) % options.length];
  };

  const runTestSimulation = () => {
    // Test case: 10 attacks, 4+ to hit, 4+ to wound, 4+ armor save
    const params: SimulationParameters = {
      numAttacks: Number.parseInt(numAttacks) || 10,
      toHit: hit === "auto" ? "auto" : hit,
      rerollHits: "none",
      toWound: wound === "auto" ? "auto" : wound,
      rerollWounds: "none",
      armorSave: armorSave === "none" ? "none" : armorSave,
      armorPiercing: 0,
      rerollArmorSaves: "none",
      specialSave: specialSave === "none" ? "none" : specialSave,
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <h1
          className="text-6xl font-bold text-center text-brand-green"
          style={{ fontFamily: "var(--font-display)" }}
        >
          UNLUIGI
        </h1>

        {/* Input Card */}
        <Card className="p-6 space-y-6 bg-card border-border">
          {/* Number of Attacks */}
          <div className="space-y-2">
            <Label htmlFor="attacks" className="text-foreground">
              Number of Attacks
            </Label>
            <Input
              id="attacks"
              type="text"
              value={numAttacks}
              onChange={(e) => setNumAttacks(e.target.value)}
              className="text-lg bg-input border-border text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., 10 or 2d6"
            />
          </div>

          {/* Dice Buttons Grid */}
          <div className="grid grid-cols-4 gap-4">
            {/* Hit Button */}
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs text-muted-foreground">Hit</Label>
              <Button
                onClick={() => setHit(cycleValue(hit, hitOptions))}
                className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
                variant="outline"
              >
                {hit === "auto" ? "AUTO" : `${hit}+`}
              </Button>
            </div>

            {/* Wound Button */}
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs text-muted-foreground">Wound</Label>
              <Button
                onClick={() => setWound(cycleValue(wound, woundOptions))}
                className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
                variant="outline"
              >
                {wound === "auto" ? "AUTO" : `${wound}+`}
              </Button>
            </div>

            {/* Armor Save Button */}
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs text-muted-foreground">Armor</Label>
              <Button
                onClick={() => setArmorSave(cycleValue(armorSave, saveOptions))}
                className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
                variant="outline"
              >
                {armorSave === "none" ? "NONE" : `${armorSave}+`}
              </Button>
            </div>

            {/* Special Save Button */}
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs text-muted-foreground">Special</Label>
              <Button
                onClick={() =>
                  setSpecialSave(cycleValue(specialSave, saveOptions))
                }
                className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
                variant="outline"
              >
                {specialSave === "none" ? "NONE" : `${specialSave}+`}
              </Button>
            </div>
          </div>

          {/* Simulate Button */}
          <Button
            onClick={runTestSimulation}
            className="w-full h-16 text-2xl bg-brand-green hover:bg-brand-green-dark text-white"
          >
            Simulate
          </Button>
        </Card>

        {/* Results */}
        {results && (
          <Card className="p-6 bg-card border-border">
            <pre className="text-left text-sm whitespace-pre-wrap text-foreground">
              {results}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
