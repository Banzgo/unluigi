# Dice Engine Updates Summary

## Key Changes to Dice Engine Specifications

### 1. Dice Expression Support

**Number of Attacks** now supports both numeric values and dice expressions:

```typescript
numAttacks: string | number

Examples:
- 10         → Fixed 10 attacks
- "d6"       → Roll 1d6 (1-6 attacks)
- "2d6"      → Roll 2d6 (2-12 attacks)
- "d6+3"     → Roll 1d6+3 (4-9 attacks)
- "d3"       → Roll d3 (1-3 attacks, special d6/2 handling)
```

**Multiple Wounds** also supports dice expressions:

```typescript
multipleWounds: string | number

Examples:
- 1          → Standard 1 wound per unsaved wound
- "d3"       → Roll d3 (1-3) wounds per unsaved wound
- "d6+1"     → Roll d6+1 (2-7) wounds per unsaved wound
```

### 2. Updated Hit Values

All phases (to hit, to wound, armor save, special save) now use:

```typescript
type HitValue = 2 | 3 | 4 | 5 | 6 | 'auto' | 'none';

- 2-6:   Standard target number (roll >= value to succeed)
- 'auto': Automatic success (always succeeds)
- 'none': No roll possible (always fails / no save available)
```

### 3. Refined Reroll System

Rerolls are now more granular:

```typescript
type RerollType = 'none' | '1s' | 'successes' | 'fails';

- 'none':      No rerolls
- '1s':        Reroll natural 1s only
- 'successes': Reroll successful rolls (typically for opponent)
- 'fails':     Reroll failed rolls
```

Each phase has its own reroll setting:

- `rerollHits` - For attack rolls
- `rerollWounds` - For wound rolls
- `rerollArmorSaves` - For defender's armor saves
- `rerollSpecialSaves` - For defender's special saves

### 4. Special Rules

#### Poison

- **Trigger**: Unmodified 6 to hit
- **Effect**: Automatically wounds (skips wound roll entirely)
- **Interaction**: Still subject to armor and special saves (unless Lethal Strike also applies)

#### Lethal Strike

- **Trigger**: Unmodified 6 to wound
- **Effect**: Bypasses armor save AND regeneration saves (but NOT aegis saves)
- **Interaction**: Aegis saves can still stop lethal strikes, regeneration cannot
- **Special Save Type**: When lethal strike is active, the special save type (aegis or regeneration) determines if it's bypassed

#### Fury

- **Trigger**: Unmodified 6 to hit
- **Effect**: Generates 2 hits instead of 1
- **Interaction**: The extra hit still needs to wound normally

#### Multiple Wounds

- **When**: Applied after all saves
- **How**: Each unsaved wound causes X wounds (static or dice expression)
- **Cap**: Limited by `targetMaxWounds` parameter
- **Example**: If multiple wounds is "d3" and target has 2 wounds max:
  - Roll d3 for each unsaved wound
  - If d3 rolls 4+, cap at 2
  - Final wounds = unsaved wounds × min(rolled_value, target_max_wounds)

### 5. Simulation Results

Results now include three types of distributions:

```typescript
interface SimulationResults {
  // Individual probabilities: P(X = n)
  distribution: Record<number, number>;

  // Cumulative >= n: P(X >= n) - "At least N wounds"
  cumulativeGreaterOrEqual: Record<number, number>;

  // Cumulative <= n: P(X <= n) - "At most N wounds"
  cumulativeLessOrEqual: Record<number, number>;

  // Statistics
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  percentiles: { 25; 50; 75; 95 };
  min: number;
  max: number;
}
```

### 6. Attack Sequence Flow

```
1. Parse Attack Expression (e.g., "2d6+3" → 5-15 attacks)
   ↓
2. To-Hit Rolls
   - Check for 'auto', 'none', or 2-6 target
   - Apply rerolls (1s, fails, successes)
   - Apply Poison: 6s skip to unsaved wounds
   - Apply Fury: 6s generate 2 hits
   ↓
3. To-Wound Rolls (skip if Poison)
   - Check for 'auto', 'none', or 2-6 target
   - Apply rerolls (1s, fails, successes)
   - Apply Lethal Strike: 6s bypass all saves
   ↓
4. Armor Save Rolls (skip if Lethal Strike)
   - Apply Armor Piercing modifier
   - Check for 'auto', 'none', or 2-6 target
   - Apply defender rerolls (1s, fails, successes)
   ↓
5. Special Save Rolls (skip if Lethal Strike)
   - Check for 'auto', 'none', or 2-6 target
   - Apply defender rerolls (1s, fails, successes)
   ↓
6. Apply Multiple Wounds
   - Parse expression (e.g., "d3")
   - Roll for each unsaved wound
   - Cap at targetMaxWounds
   ↓
7. Return total wounds dealt
```

### 7. Implementation Priorities

**Phase 1: Core Engine (MVP)**

- Basic dice rolling and expressions parser
- Hit/Wound/Save sequence
- Simple rerolls (1s, fails)
- Distribution calculation

**Phase 2: Special Rules**

- Poison, Lethal Strike, Fury
- Multiple wounds with capping
- Auto/None value handling

**Phase 3: Advanced Features**

- Cumulative distributions
- Full reroll options (successes)
- Complex dice expressions (3d3, 2d6+5)

**Phase 4: Polish**

- Performance optimization
- Comprehensive test suite
- Edge case handling

### 8. UI Implications

Form should now include:

**Attack Phase:**

- Text input for attacks (accepts "10", "d6", "2d6+3", etc.)
- Toggle group for to hit (2+, 3+, 4+, 5+, 6+, Auto, None)
- Reroll select (None, 1s, Fails, Successes)
- Checkboxes: Poison, Fury

**Wound Phase:**

- Toggle group for to wound (2+, 3+, 4+, 5+, 6+, Auto, None)
- Reroll select (None, 1s, Fails, Successes)
- Checkbox: Lethal Strike

**Save Phase:**

- Toggle group for armor save (2+, 3+, 4+, 5+, 6+, Auto, None)
- Number input for armor piercing (0-6)
- Reroll select for armor (None, 1s, Fails, Successes)
- Toggle group for special save (2+, 3+, 4+, 5+, 6+, Auto, None)
- Reroll select for special save (None, 1s, Fails, Successes)

**Target & Wounds:**

- Text input for multiple wounds (accepts "1", "d3", "d6+1", etc.)
- Number input for target max wounds (1-10+)

**Results Display:**

- Bar chart for distribution (P(X = n))
- Line chart for cumulative distributions (P(X >= n) and P(X <= n))
- Statistics table (mean, median, mode, percentiles)

### 9. Validation Rules

```typescript
// Input validation
- numAttacks: Must parse to positive integer
- toHit/toWound/saves: Must be 2-6, 'auto', or 'none'
- armorPiercing: 0-6
- multipleWounds: Must parse to positive integer
- targetMaxWounds: Must be positive integer >= 1
- iterations: Reasonable range (100-100000)

// Dice expression validation
- Valid formats: "d6", "2d6", "d3", "d6+2", "2d6+5"
- Invalid: "d7", "d0", "d6-20" (results in negative)
```

### 10. Performance Considerations

With dice expressions and multiple special rules:

- Each simulation iteration may be slower
- Consider reducing default iterations if performance suffers
- Optimize dice expression parsing (memoize if same expression used repeatedly)
- Consider Web Workers for 100k+ iterations
