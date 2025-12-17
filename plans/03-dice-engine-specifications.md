# Dice Engine Specifications

## Core Dice Mechanics

### Basic D6 Roll

```typescript
function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1; // Returns 1-6
}
```

### Dice Expression Parser

```typescript
function parseDiceExpression(expr: string | number): number {
  // If it's a number, return it
  if (typeof expr === "number") return expr;

  // Parse expressions like "d6", "2d6", "d3+2", "2d6+3"
  // Examples:
  // "d6" → roll 1d6
  // "2d6" → roll 2d6, sum results
  // "d3" → roll d6/2 (rounded up)
  // "d6+2" → roll 1d6, add 2
  // "2d6+3" → roll 2d6, add 3
}
```

## Attack Sequence Flow

```
Attacks (parse dice expression)
    ↓
To-Hit Rolls (target: X+ or auto)
    ↓ [hits] with rerolls (1s, fails, successes)
    ↓ [apply Fury: 6s generate 2 hits]
    ↓ [apply Poison: 6s skip wound phase]
To-Wound Rolls (target: Y+ or auto)
    ↓ [wounds] with rerolls (1s, fails, successes)
    ↓ [apply Lethal Strike: 6s bypass saves]
    ↓ [apply Multiple Wounds: X wounds per unsaved wound]
Armor Save Rolls (target: Z+ or none/auto)
    ↓ [failed saves] with rerolls (1s, fails, successes)
Special Save Rolls (target: W+ or none/auto)
    ↓ [failed saves] with rerolls (1s, fails, successes)
    ↓ [apply Multiple Wounds if not already applied]
RESULT: Total Wounds Distribution
```

## Parameter Definitions

### Input Parameters (TypeScript Interface)

```typescript
interface SimulationParameters {
  // Attack Phase
  numAttacks: string | number; // Number or dice expression: 10, "d6", "2d6+3", "d3"
  toHit: HitValue; // 2-6, 'auto', or 'none' (auto-hit or impossible)
  rerollHits: RerollType; // 'none' | '1s' | 'successes' | 'fails'

  // Wound Phase
  toWound: HitValue; // 2-6, 'auto', or 'none'
  rerollWounds: RerollType; // 'none' | '1s' | 'successes' | 'fails'

  // Save Phase
  armorSave: HitValue; // 2-6, 'auto' (no wound gets through), or 'none' (no save)
  armorPiercing: number; // AP value (reduces armor, 0-6)
  rerollArmorSaves: RerollType; // 'none' | '1s' | 'successes' | 'fails' (for defender)

  specialSave: HitValue; // Ward/regen save: 2-6, 'auto', or 'none'
  rerollSpecialSaves: RerollType; // 'none' | '1s' | 'successes' | 'fails' (for defender)

  // Special Rules
  poison: boolean; // 6s to hit auto-wound (skip wound roll)
  lethalStrike: boolean; // 6s to wound ignore armor AND special saves
  fury: boolean; // 6s to hit generate 2 hits instead of 1
  multipleWounds: string | number; // Wounds per unsaved wound: 1, "d3", "d6+1", etc.
  targetMaxWounds: number; // Maximum wounds target model has (caps multiple wounds)

  // Simulation Settings
  iterations: number; // Number of simulations to run (default 10000)
}

type HitValue = 2 | 3 | 4 | 5 | 6 | "auto" | "none";
type RerollType = "none" | "1s" | "successes" | "fails";
```

### Dice Expression Examples

```typescript
// Valid attack expressions:
"10"       → 10 attacks
"d6"       → Roll 1d6 attacks (1-6)
"2d6"      → Roll 2d6 attacks (2-12)
"d6+3"     → Roll 1d6+3 attacks (4-9)
"2d6+5"    → Roll 2d6+5 attacks (7-17)
"d3"       → Roll d3 attacks (1-3, implemented as (d6+1)/2 rounded down)
"3d3"      → Roll 3d3 attacks

// Multiple wounds expressions:
"1"        → 1 wound per unsaved wound (standard)
"d3"       → Roll d3 wounds (1-3)
"d6"       → Roll d6 wounds (1-6)
"d3+1"     → Roll d3+1 wounds (2-4)
```

## Simulation Algorithm

### Single Iteration Pseudocode

```typescript
function simulateSingleAttackSequence(params: SimulationParameters): number {
  // Phase 0: Determine number of attacks
  const numAttacks = parseDiceExpression(params.numAttacks);

  let hits = 0;
  const poisonHits: boolean[] = []; // Track which hits are poison

  // Phase 1: To-Hit Rolls
  for (let i = 0; i < numAttacks; i++) {
    let roll = rollD6();
    let modified = roll + params.toHitModifier;

    // Check for exploding hits BEFORE modification
    if (params.explodingHits && roll === params.explodingValue) {
      hits++;
      // Recursively add extra attack (limited to prevent infinite loops)
      extraAttacks++;
    }

    // Apply rerolls if needed
    if (shouldReroll(roll, params.rerollHits)) {
      roll = rollD6();
      modified = roll + params.toHitModifier;
    }

    // Check if hit succeeded
    if (modified >= params.toHit) {
      hits++;
      if (params.lethalStrike && roll === 6) {
        markAsLethal(hit);
      }
    }
  }

  // Phase 2: To-Wound Rolls
  let wounds = 0;
  for (let i = 0; i < hits; i++) {
    let roll = rollD6();
    let modified = roll + params.toWoundModifier;

    // Check for auto-wound
    if (params.autoWoundOn > 0 && roll === params.autoWoundOn) {
      wounds++;
      continue; // Skip normal wound process
    }

    // Apply rerolls
    if (shouldReroll(roll, params.rerollWounds)) {
      roll = rollD6();
      modified = roll + params.toWoundModifier;
    }

    if (modified >= params.toWound) {
      wounds++;
      // Check for mortal wounds
      if (params.mortalWoundsOn > 0 && roll === params.mortalWoundsOn) {
        markAsMortal(wound);
      }
    }
  }

  // Phase 3: Armor Saves
  let unsavedWounds = 0;
  for (let i = 0; i < wounds; i++) {
    // Mortal wounds skip armor saves
    if (isMortal(wound[i])) {
      unsavedWounds++;
      continue;
    }

    let modifiedArmor = params.armorSave + params.armorPiercing;
    if (modifiedArmor > 6) {
      unsavedWounds++; // No save possible
      continue;
    }

    let roll = rollD6();

    // Defender rerolls (if any)
    if (shouldReroll(roll, params.rerollSaves)) {
      roll = rollD6();
    }

    if (roll < modifiedArmor) {
      unsavedWounds++; // Failed save
    }
  }

  // Phase 4: Special Saves (Ward, etc.)
  let finalWounds = 0;
  for (let i = 0; i < unsavedWounds; i++) {
    if (params.specialSave > 6) {
      finalWounds++; // No special save
      continue;
    }

    let roll = rollD6();
    if (roll < params.specialSave) {
      finalWounds++; // Failed special save
    }
  }

  return finalWounds;
}
```

### Full Simulation

```javascript
function runSimulation(params) {
  const results = [];

  for (let i = 0; i < params.iterations; i++) {
    const wounds = simulateSingleAttackSequence(params);
    results.push(wounds);
  }

  return calculateStatistics(results);
}
```

## Statistical Output

### Distribution Calculation

```typescript
interface SimulationResults {
  distribution: Record<number, number>; // { wounds: probability } - P(X = n)
  cumulativeGreaterOrEqual: Record<number, number>; // P(X >= n)
  cumulativeLessOrEqual: Record<number, number>; // P(X <= n)
  mean: number; // Expected value
  median: number; // 50th percentile
  mode: number; // Most common result
  stdDev: number; // Standard deviation
  percentiles: {
    25: number;
    50: number;
    75: number;
    95: number;
  };
  min: number;
  max: number;
}

function calculateStatistics(results: number[]): SimulationResults {
  // Count frequency of each outcome
  const distribution: Record<number, number> = {};
  results.forEach((wounds) => {
    distribution[wounds] = (distribution[wounds] || 0) + 1;
  });

  // Convert to probabilities
  const probabilities: Record<number, number> = {};
  Object.keys(distribution).forEach((wounds) => {
    probabilities[Number(wounds)] =
      distribution[Number(wounds)] / results.length;
  });

  // Calculate cumulative distributions
  const sortedKeys = Object.keys(probabilities)
    .map(Number)
    .sort((a, b) => a - b);
  const cumulativeGreaterOrEqual: Record<number, number> = {};
  const cumulativeLessOrEqual: Record<number, number> = {};

  // P(X >= n) = sum of all probabilities from n to max
  for (const key of sortedKeys) {
    cumulativeGreaterOrEqual[key] = sortedKeys
      .filter((k) => k >= key)
      .reduce((sum, k) => sum + probabilities[k], 0);
  }

  // P(X <= n) = sum of all probabilities from min to n
  for (const key of sortedKeys) {
    cumulativeLessOrEqual[key] = sortedKeys
      .filter((k) => k <= key)
      .reduce((sum, k) => sum + probabilities[k], 0);
  }

  return {
    distribution: probabilities,
    cumulativeGreaterOrEqual,
    cumulativeLessOrEqual,
    mean: calculateMean(results),
    median: calculateMedian(results),
    mode: calculateMode(results),
    stdDev: calculateStdDev(results),
    percentiles: {
      25: calculatePercentile(results, 0.25),
      50: calculatePercentile(results, 0.5),
      75: calculatePercentile(results, 0.75),
      95: calculatePercentile(results, 0.95),
    },
    min: Math.min(...results),
    max: Math.max(...results),
  };
}
```

### Example Output

```typescript
// Example result from 10 attacks, 4+ hit/wound, 4+ save:
{
  distribution: {
    0: 0.052,  // 5.2% chance of 0 wounds
    1: 0.128,  // 12.8% chance of 1 wound
    2: 0.234,  // 23.4% chance of 2 wounds
    3: 0.284,  // 28.4% chance of 3 wounds
    4: 0.189,  // 18.9% chance of 4 wounds
    5: 0.081,  // 8.1% chance of 5 wounds
    6: 0.032,  // 3.2% chance of 6+ wounds
  },
  cumulativeGreaterOrEqual: {
    0: 1.000,   // 100% chance of >= 0 wounds
    1: 0.948,   // 94.8% chance of >= 1 wound
    2: 0.820,   // 82.0% chance of >= 2 wounds
    3: 0.586,   // 58.6% chance of >= 3 wounds
    4: 0.302,   // 30.2% chance of >= 4 wounds
    5: 0.113,   // 11.3% chance of >= 5 wounds
    6: 0.032,   // 3.2% chance of >= 6 wounds
  },
  cumulativeLessOrEqual: {
    0: 0.052,   // 5.2% chance of <= 0 wounds
    1: 0.180,   // 18.0% chance of <= 1 wound
    2: 0.414,   // 41.4% chance of <= 2 wounds
    3: 0.698,   // 69.8% chance of <= 3 wounds
    4: 0.887,   // 88.7% chance of <= 4 wounds
    5: 0.968,   // 96.8% chance of <= 5 wounds
    6: 1.000,   // 100% chance of <= 6 wounds
  },
  mean: 3.24,
  median: 3,
  mode: 3,
  stdDev: 1.67,
  percentiles: { 25: 2, 50: 3, 75: 4, 95: 6 },
  min: 0,
  max: 8
}
```

## Validation & Testing

### Test Cases

1. **Basic Attack**: 10 attacks, 4+ to hit, 4+ to wound, 4+ armor save, no special save

   - Expected: ~1.25 wounds average

2. **Poison Attacks**: 10 attacks with Poison, 4+ to hit, 4+ to wound, 3+ armor save

   - 6s to hit auto-wound (skip wound roll)
   - Verify: More wounds than without poison

3. **Lethal Strike**: 10 attacks, 4+ hit/wound with Lethal Strike, 2+ armor, 4+ ward

   - 6s to wound bypass all saves
   - Verify: Some wounds get through despite strong saves

4. **Fury**: 10 attacks with Fury, 4+ to hit, 4+ to wound, 4+ save

   - 6s to hit generate 2 hits
   - Verify: More hits than attacks rolled

5. **Multiple Wounds (d3)**: 10 attacks, 4+ hit/wound, no saves, d3 multiple wounds, target has 5 wounds

   - Each unsaved wound causes d3 wounds (1-3)
   - Verify: Total wounds is significantly higher than basic attack

6. **Multiple Wounds Capped**: 10 attacks, 4+ hit/wound, no saves, d6 multiple wounds, target has 2 wounds

   - Multiple wounds capped at target's max wounds (2)
   - Verify: Each unsaved wound causes exactly 2 wounds (capped)

7. **Reroll Fails (Offense)**: 10 attacks, 4+ to hit, reroll failed hits, 4+ wound, 4+ save

   - Verify: Mean wounds increases vs no reroll

8. **Reroll 1s (Defense)**: 10 attacks, 4+ hit/wound, 3+ armor save with reroll 1s

   - Verify: Fewer wounds get through than without reroll

9. **Dice Expression Attacks**: "2d6+3" attacks, 4+ hit/wound, no saves

   - Verify: Attack count varies (5-15) and average wounds scales appropriately

10. **Auto/None Values**: 10 attacks, auto-hit, auto-wound, no armor, auto special save
    - Verify: All attacks hit and wound, but all get saved by special save (0 wounds)

### Edge Cases

- Zero attacks ("0" or dice expression resulting in 0) → 0 wounds
- "none" to hit value → 0 wounds (impossible to hit)
- "auto" armor save → all wounds stopped by armor
- Negative dice modifiers making total < 0 → treat as 0
- Multiple wounds with target having 1 wound → cap at 1
- Reroll "successes" on saves → defender rerolls successful saves (bad for defender)
- Combined special rules (Poison + Fury + Multiple Wounds) → all work together correctly

## Performance Targets

- **10,000 iterations**: < 500ms
- **100,000 iterations**: < 3s
- Memory usage: < 50MB
- Support up to 100 attacks in single sequence

## Future Enhancements (Post-V1)

- Support for multiple attack profiles (mixed weapons)
- Unit vs unit simulation (multiple models)
- Impact hits (auto-hits based on charge distance)
- Divine attacks (special wound mechanics)
- Sunder (damage to armor value)
- Flaming attacks vs regeneration
- Toxic attacks (auto-wound triggers)
- Multiple wound allocation (multi-wound models)
