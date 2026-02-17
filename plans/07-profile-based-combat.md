# Profile-Based Combat Feature

## Overview

Add a new "Profile Mode" that allows users to input full unit profiles (stats like Strength, Resilience, Offensive/Defensive Skill, etc.) instead of manually calculating to-hit and to-wound values. The system will automatically calculate the combat mechanics and feed them into the existing simulator.

## Motivation

**Current Workflow:**
- User manually calculates: "My S4 vs T3 = 3+ to wound"
- User inputs the final values (3+, 4+, etc.)

**New Workflow:**
- User inputs: Attacker Profile (S4, Off 4) and Defender Profile (Def 3, Res 3)
- System automatically calculates: Hit 4+, Wound 3+
- Quick experimentation: Change one stat and see new results instantly
- Matches how players think: "What happens when my unit fights their unit?"

## Unit Profile Structure

### Profile Stats

```typescript
interface UnitProfile {
  // Combat stats
  offensiveSkill: number;    // Off - used for to-hit
  defensiveSkill: number;    // Def - used for to-hit (defender)
  strength: number;          // Str - used for to-wound
  resilience: number;        // Res - used for to-wound (defender)
  armorPenetration: number;  // AP - reduces defender's armor
  attacks: string;           // Att - number or dice expression (e.g., "10", "2d6")
  
  // Defensive stats
  wounds: number;            // HP - maximum wounds the model has
  armor: number;             // Arm - raw armor value (converted to save)
  aegisSave?: number;        // Optional: 2-6 (e.g., 5 means "5+ Aegis")
  regenerationSave?: number; // Optional: 2-6 (e.g., 6 means "6+ Regen")
  
  // Special rules (existing simulator rules)
  poison?: boolean;
  poisonOn5Plus?: boolean;
  lethalStrike?: boolean;
  fury?: boolean;
  redFury?: boolean;
  multipleWounds?: string;
  
  // Special rules - structured format
  specialRules?: SpecialRule[];  // Array of active special rules
  
  // Future-proofing (excluded from UI in v1)
  discipline?: number;       // Dis - not used in combat yet
  agility?: number;          // Agi - not used in combat yet
  
  // Optional label
  name?: string;             // User-friendly name (e.g., "Knight Champion")
}
```

### Special Rules Format

Special rules are defined with a structured format that can express various effects:

```typescript
type RollPhase = 'hit' | 'wound' | 'armorSave' | 'specialSave';
type RerollType = 'failed' | '1s' | 'successful' | 'all';
type ModifierType = 'add' | 'multiply' | 'divide' | 'set';

interface SpecialRule {
  name: string;                    // Display name (e.g., "Hatred", "Press the Ranks")
  
  // What phase(s) this rule affects
  targetPhases: RollPhase[];       // Can affect multiple phases
  
  // Effect type
  effect: {
    type: 'reroll' | 'modifier' | 'special';
    
    // For reroll effects
    reroll?: RerollType;           // 'failed', '1s', 'successful', 'all'
    
    // For modifier effects
    modifier?: {
      operation: ModifierType;     // 'add', 'multiply', 'divide', 'set'
      value: number;               // Amount to modify
      restriction?: {              // Optional limit
        type: 'min' | 'max';
        value: number;             // e.g., "max 3+" means value: 3
      };
    };
    
    // For special abilities (map to existing simulator features)
    special?: {
      ability: 'poison' | 'poisonOn5Plus' | 'lethalStrike' | 'fury' | 'redFury';
    };
  };
  
  // Optional conditions
  condition?: string;              // Free text for complex conditions (future use)
}
```

### Special Rule Examples

**Hatred** - Reroll failed to-hit rolls:
```typescript
{
  name: "Hatred",
  targetPhases: ['hit'],
  effect: {
    type: 'reroll',
    reroll: 'failed'
  }
}
```

**Press the Ranks** - +1 to wound (max 3+):
```typescript
{
  name: "Press the Ranks",
  targetPhases: ['wound'],
  effect: {
    type: 'modifier',
    modifier: {
      operation: 'add',
      value: -1,  // Negative because lower roll = better
      restriction: {
        type: 'max',
        value: 3  // Cannot be better than 3+
      }
    }
  }
}
```

**Poison** - Grants poison ability:
```typescript
{
  name: "Poison Attacks",
  targetPhases: ['hit', 'wound'],
  effect: {
    type: 'special',
    special: {
      ability: 'poison'
    }
  }
}
```

**Forest Embrace** - Reroll 1s to hit and wound:
```typescript
{
  name: "Forest Embrace",
  targetPhases: ['hit', 'wound'],
  effect: {
    type: 'reroll',
    reroll: '1s'
  }
}
```

**Divine Attacks** - Prevents Aegis saves from being taken:
```typescript
{
  name: "Divine Attacks",
  targetPhases: ['specialSave'],
  effect: {
    type: 'modifier',
    modifier: {
      operation: 'set',
      value: 0  // Disables Aegis saves specifically
    }
  },
  condition: "Prevents Aegis saves only, Regeneration still allowed"
}
```

**Blessed Inscriptions** - Reroll 1s to hit and wound:
```typescript
{
  name: "Blessed Inscriptions",
  targetPhases: ['hit', 'wound'],
  effect: {
    type: 'reroll',
    reroll: '1s'
  }
}
```

**Strength Bonus** - +2 Strength:
```typescript
{
  name: "Strength of the Ancestors",
  targetPhases: ['wound'],
  effect: {
    type: 'modifier',
    modifier: {
      operation: 'add',
      value: 2  // +2 to Strength stat (applied before to-wound calculation)
    }
  }
}
```

**Double Strength** - Multiply Strength by 2:
```typescript
{
  name: "Devastating Charge",
  targetPhases: ['wound'],
  effect: {
    type: 'modifier',
    modifier: {
      operation: 'multiply',
      value: 2
    }
  }
}
```

### Applying Special Rules to Simulation

When converting profile to simulation parameters, process special rules:

```typescript
function profileToSimulationParams(
  attacker: UnitProfile,
  defender: UnitProfile
): SimulationParameters {
  // Calculate base values
  let toHit = calculateToHit(attacker.offensiveSkill, defender.defensiveSkill);
  let toWound = calculateToWound(attacker.strength, defender.resilience);
  let armorSave = calculateArmorSave(defender.armor, attacker.armorPenetration);
  let specialSave = determineSpecialSave(defender);
  
  // Initialize reroll tracking
  let rerollHitFailures: FailureRerollType = 'none';
  let rerollWoundFailures: FailureRerollType = 'none';
  let rerollArmorSaveFailures: FailureRerollType = 'none';
  
  // Apply attacker special rules
  attacker.specialRules?.forEach(rule => {
    if (rule.effect.type === 'reroll') {
      if (rule.targetPhases.includes('hit') && rule.effect.reroll === 'failed') {
        rerollHitFailures = 'all';
      }
      if (rule.targetPhases.includes('hit') && rule.effect.reroll === '1s') {
        rerollHitFailures = '1s';
      }
      if (rule.targetPhases.includes('wound') && rule.effect.reroll === 'failed') {
        rerollWoundFailures = 'all';
      }
      if (rule.targetPhases.includes('wound') && rule.effect.reroll === '1s') {
        rerollWoundFailures = '1s';
      }
    }
    
    if (rule.effect.type === 'modifier') {
      // Apply modifiers to calculated values
      if (rule.targetPhases.includes('hit')) {
        toHit = applyModifier(toHit, rule.effect.modifier);
      }
      if (rule.targetPhases.includes('wound')) {
        toWound = applyModifier(toWound, rule.effect.modifier);
      }
      // Special handling for Divine Attacks (prevents Aegis saves)
      if (rule.targetPhases.includes('specialSave') && rule.name === 'Divine Attacks') {
        // Re-determine special save, prefer Regeneration over Aegis
        specialSave = determineSpecialSave(defender, false); // false = prefer Regen
      }
    }
    
    if (rule.effect.type === 'special') {
      // Set special abilities based on rule
      // (poison, lethalStrike, etc. are already on profile)
    }
  });
  
  // Apply defender special rules (for saves)
  defender.specialRules?.forEach(rule => {
    if (rule.effect.type === 'reroll') {
      if (rule.targetPhases.includes('armorSave') && rule.effect.reroll === '1s') {
        rerollArmorSaveFailures = '1s';
      }
    }
  });
  
  return {
    numAttacks: attacker.attacks,
    toHit,
    toWound,
    armorSave,
    specialSave,
    
    // Attacker special rules (direct from profile)
    poison: attacker.poison,
    poisonOn5Plus: attacker.poisonOn5Plus,
    lethalStrike: attacker.lethalStrike,
    fury: attacker.fury,
    redFury: attacker.redFury,
    multipleWounds: attacker.multipleWounds,
    targetMaxWounds: defender.wounds,
    
    // Mapped from special rules
    rerollHitFailures,
    rerollWoundFailures,
    rerollArmorSaveFailures,
    // ... etc
  };
}

function applyModifier(currentValue: number, modifier: ModifierConfig): number {
  let result = currentValue;
  
  switch (modifier.operation) {
    case 'add':
      result = currentValue + modifier.value;
      break;
    case 'multiply':
      result = Math.ceil(currentValue * modifier.value);
      break;
    case 'divide':
      result = Math.ceil(currentValue / modifier.value);
      break;
    case 'set':
      result = modifier.value;
      break;
  }
  
  // Apply restrictions
  if (modifier.restriction) {
    if (modifier.restriction.type === 'max') {
      result = Math.max(result, modifier.restriction.value);
    }
    if (modifier.restriction.type === 'min') {
      result = Math.min(result, modifier.restriction.value);
    }
  }
  
  return result;
}
```

### Benefits of Structured Format

1. **Flexibility**: Can express wide variety of rules without hardcoding booleans
2. **Extensibility**: Easy to add new rule types without changing interface
3. **Composability**: Multiple rules can affect same phase
4. **Clear Intent**: Rule structure shows exactly what it does
5. **UI Friendly**: Can generate checkboxes/toggles from rule definitions
6. **Testing**: Each rule can be tested independently

### V1 Implementation Approach

For V1, can still use boolean flags for common rules and gradually migrate:

```typescript
interface UnitProfile {
  // ... other fields ...
  
  // V1: Simple boolean flags for most common rules
  poison?: boolean;
  lethalStrike?: boolean;
  fury?: boolean;
  hatred?: boolean;  // Mapped to rerollHitFailures: 'all'
  
  // V2: Full special rules system
  specialRules?: SpecialRule[];
}
```

This allows incremental adoption while maintaining backward compatibility.

## Modifier Application Rules

Before calculating combat values, it's important to understand how modifiers are applied when combining stats and special rules. These rules ensure consistent resolution when multiple effects interact.

### Modifier Priority Order

When multiple modifiers affect a roll or stat, apply them in this order:

1. **Set to Fixed Number** - Effects that override the value entirely
   - Example: "This attack hits on 3+" (ignores skill difference)
   
2. **Multiplication and Division** - Scale the value
   - Example: "Double Strength for this attack"
   - Always round up after division
   
3. **Addition and Subtraction** - Modify the value
   - Apply unrestricted modifiers first
   - Then apply modifiers with restrictions/limits
   - Example: "+1 to hit (max 3+)" applied after "+1 to hit"
   
4. **Always and Never** - Override success/failure conditions
   - Example: "Always wounds on 6s"
   - Example: "Cannot wound on better than 4+"

### Rounding and Limits

- **Rounding**: Always round **up** to the nearest whole number
  - Example: S3 ÷ 2 = 1.5 → rounds to 2

- **Stat Minimums**: Stats cannot be lower than 0
  - Example: Armor 2 - AP 3 = -1 → treated as 0 (no armor)

- **Armor Maximum**: Armor value cannot be higher than 6
  - Example: Armor 7 is treated as Armor 6

- **Roll Limits**:
  - Always fail on natural 1s (even with modifiers)
  - Always succeed on natural 6s (even with modifiers)
  - Roll results are capped 2+ (best) to 6+ (worst) for target numbers

### Multiple Modifiers in Same Step

When multiple modifiers exist at the same priority level, apply them in the order that results in the **lowest value** or **lowest chance of success** (worst for the player).

**Example - Multiple Addition Modifiers:**
```
Base to-hit: 4+
Modifier A: +1 to hit (makes it easier: 3+)
Modifier B: -1 to hit (makes it harder: 5+)

Apply in order that gives lowest success chance:
Step 1: Apply -1 penalty first: 4+ → 5+
Step 2: Apply +1 bonus: 5+ → 4+
Result: 4+ (net effect cancels out)
```

**Example - Armor with Multiple AP Sources:**
```
Defender Armor: 4
AP Source 1: 1
AP Source 2: 2

Apply in order that reduces armor most:
Step 1: 4 - 2 = 2
Step 2: 2 - 1 = 1
Result: Armor 1 → 6+ save
```

### Restricted vs Unrestricted Modifiers

Some modifiers have restrictions (e.g., "max 3+", "cannot be better than 4+"). Apply these **after** unrestricted modifiers.

**Example:**
```
Base to-hit: 5+
Unrestricted: +2 to hit
Restricted: +1 to hit (max 3+)

Step 1: Apply unrestricted: 5+ → 3+
Step 2: Apply restricted: 3+ → 2+ (but capped at 3+)
Final: 3+ to hit
```

### Examples in Combat Calculation

These rules apply throughout the profile calculation:

- **To-Hit**: Base from skill difference, then apply modifiers from special rules
- **To-Wound**: Base from S vs R, then apply special rules (Poison, etc.)
- **Armor**: Base armor - AP, then apply modifiers, then cap at 2-6 range
- **Special Rules**: Many grant conditional modifiers that follow these priorities

## Combat Calculation Logic

### To-Hit Calculation

Based on attacker's Offensive Skill vs defender's Defensive Skill:

```typescript
function calculateToHit(attackerOff: number, defenderDef: number): number {
  const difference = attackerOff - defenderDef;
  
  if (difference > 4) return 2;  // Attacker 5+ higher
  if (difference > 0) return 3;  // Attacker 1-4 higher
  // Both tied (difference === 0) AND defender 1-4 higher
  if (difference >= -4) return 4;
  // Defender 5+ higher
  return 5;
}
```

**Important Notes:**
- From skill difference alone, maximum is 5+ (worst from stats)
- However, overall hit rolls can range from 2+ to 6+
- Special rules or modifiers applied later may make it 6+ or better than 2+
- No hard caps in this function - let modifiers handle final capping
- This function only calculates the base to-hit from skill difference

### To-Wound Calculation

Based on attacker's Strength vs defender's Resilience:

```typescript
function calculateToWound(attackerStr: number, defenderRes: number): HitValue {
  if (attackerStr === defenderRes) return 4;
  
  const difference = attackerStr - defenderRes;
  
  // Strength higher: easier to wound (+1 per point, max 2+)
  if (difference > 0) {
    return Math.max(2, 4 - difference) as HitValue;
  }
  
  // Resilience higher: harder to wound (-1 per point, max 6+)
  return Math.min(6, 4 - difference) as HitValue;
}

// Examples:
// S4 vs R3: difference = 1 → 4 - 1 = 3+
// S5 vs R3: difference = 2 → 4 - 2 = 2+ (max)
// S6 vs R3: difference = 3 → 2+ (capped)
// S3 vs R4: difference = -1 → 4 - (-1) = 5+
// S3 vs R5: difference = -2 → 4 - (-2) = 6+ (max)
// S3 vs R7: difference = -4 → 6+ (capped)
```

**Edge Cases:**
- Minimum: 2+ (when Str ≥ Res + 2)
- Maximum: 6+ (when Res ≥ Str + 2)

### Armor Save Calculation

Based on defender's Armor stat minus attacker's Armor Penetration:

```typescript
function calculateArmorSave(defenderArm: number, attackerAP: number): HitValue | 'none' {
  const effectiveArmor = defenderArm - attackerAP;
  
  // No armor left after AP
  if (effectiveArmor <= 0) return 'none';
  
  // Armor save formula: 7 - effectiveArmor
  const armorSave = 7 - effectiveArmor;
  
  // Cap at 6+ (worst possible save)
  if (armorSave > 6) return 'none';
  
  // Cap at 2+ (best possible save)
  return Math.max(2, armorSave) as HitValue;
}

// Examples:
// Arm 3, AP 0: effective = 3 → 7 - 3 = 4+ save
// Arm 4, AP 1: effective = 3 → 7 - 3 = 4+ save
// Arm 5, AP 0: effective = 5 → 7 - 5 = 2+ save
// Arm 2, AP 3: effective = -1 → 'none' (no save)
// Arm 6, AP 0: effective = 6 → 7 - 6 = 1+ → capped to 2+
```

**Edge Cases:**
- Minimum: 2+ (when Arm ≥ 5)
- Maximum: 6+ (when Arm = 1)
- `'none'`: when effective armor ≤ 0

### Special Saves

Aegis and Regeneration saves are optional profile fields. A model can have BOTH:

```typescript
function determineSpecialSave(
  profile: UnitProfile,
  preferAegis?: boolean
): HitValue | 'none' {
  const hasAegis = profile.aegisSave !== undefined;
  const hasRegen = profile.regenerationSave !== undefined;
  
  // No special saves
  if (!hasAegis && !hasRegen) return 'none';
  
  // Only one available
  if (hasAegis && !hasRegen) return profile.aegisSave;
  if (hasRegen && !hasAegis) return profile.regenerationSave;
  
  // Both available - choose based on strategy or special rules
  // Default: use the better save (lower number)
  if (preferAegis !== undefined) {
    return preferAegis ? profile.aegisSave : profile.regenerationSave;
  }
  
  // Auto-select better save
  return Math.min(profile.aegisSave, profile.regenerationSave);
}
```

**Notes:**
- A model can have both Aegis AND Regeneration
- Only one special save can be used per wound
- Which one to use may depend on special rules:
  - Divine Attacks prevent Aegis saves (must use Regeneration if available)
  - Flaming/Magical weapons prevent Regeneration saves (must use Aegis if available)
  - Some effects interact with Aegis vs Regeneration differently
- For V1: automatically choose the better save (lower number)
- For V2: special rules can override save selection (e.g., Divine Attacks forces Regeneration)

### Profile to Simulation Parameters (Legacy Approach)

For V1 with boolean flags, main conversion function:

```typescript
function profileToSimulationParams(
  attacker: UnitProfile,
  defender: UnitProfile
): SimulationParameters {
  return {
    // Basic attack sequence
    numAttacks: attacker.attacks,
    toHit: calculateToHit(attacker.offensiveSkill, defender.defensiveSkill),
    toWound: calculateToWound(attacker.strength, defender.resilience),
    armorSave: calculateArmorSave(defender.armor, attacker.armorPenetration),
    specialSave: determineSpecialSave(defender),
    
    // Attacker special rules (direct mapping)
    poison: attacker.poison,
    poisonOn5Plus: attacker.poisonOn5Plus,
    lethalStrike: attacker.lethalStrike,
    fury: attacker.fury,
    redFury: attacker.redFury,
    multipleWounds: attacker.multipleWounds,
    targetMaxWounds: defender.wounds,
    
    // Map boolean special rules to reroll mechanics
    rerollHitFailures: attacker.hatred ? 'all' : 'none',
    rerollWoundFailures: 'none', // TODO: map from special rules
    rerollArmorSaveFailures: 'none', // TODO: map from defender special rules
    // ... more mappings as special rules are added
  };
}
```

**Simple Boolean Special Rules Mapping:**

For initial implementation with boolean flags:
- `hatred: true` → `rerollHitFailures: 'all'`
- `divineAttacks: true` → Prevents Aegis saves (special handling)
- `blessedInscriptions: true` → `rerollHitFailures: '1s'` and `rerollWoundFailures: '1s'`

See "Applying Special Rules to Simulation" section above for full structured approach.

## UI Implementation

### Route Structure

Use query parameter on index page (similar to `?mode=versus`):

```typescript
// Route: /?mode=profiles
// Existing: / (default combat) and /?mode=versus

const indexSearchSchema = z.object({
  mode: z.enum(['versus', 'profiles']).optional(),
});
```

### Component Structure

Create new `ProfileView.tsx` component:

```
src/components/
  ├── ProfileView.tsx         # New: Profile-based combat UI
  ├── ProfileInput.tsx        # New: Single profile input form
  ├── CombatView.tsx          # Existing: Manual dice input
  ├── VersusView.tsx          # Existing: Manual versus mode
  └── DiceInput.tsx           # Existing: Manual dice configuration
```

### ProfileInput Component

Input form for a single unit profile:

**Layout:**
```
┌─────────────────────────────────────┐
│ [Optional Name Input Field]         │
├─────────────────────────────────────┤
│ ┌─────────────────────┐             │
│ │  Offensive Stats    │             │
│ │  Off: [4] Str: [4]  │             │
│ │  AP:  [1] Att: [10] │             │
│ │  [Special Rules...] │             │
│ └─────────────────────┘             │
│                                     │
│ ┌─────────────────────┐             │
│ │  Defensive Stats    │             │
│ │  Def: [3] Res: [3]  │             │
│ │  Arm: [3] HP:  [1]  │             │
│ │  Aegis: [5+▼] □     │             │
│ │  Regen: [--▼] □     │             │
│ └─────────────────────┘             │
│                                     │
│ [Reroll Options...]                 │
└─────────────────────────────────────┘
```

**Key Features:**
- Numeric inputs for all stats
- Checkboxes + dropdowns for optional special saves
- Collapsible sections for special rules and rerolls
- Optional name field at top
- Clear visual separation between offensive and defensive stats

### ProfileView Component

Main view component combining two profiles:

```tsx
function ProfileView() {
  const [attackerProfile, setAttackerProfile] = useState<UnitProfile>(defaultAttacker);
  const [defenderProfile, setDefenderProfile] = useState<UnitProfile>(defaultDefender);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [showCalculations, setShowCalculations] = useState(true);

  const handleSimulate = () => {
    const params = profileToSimulationParams(attackerProfile, defenderProfile);
    const simResults = runSimulation(params);
    setResults(simResults);
  };

  return (
    <>
      <h1>Profile Simulator</h1>
      
      {/* Attacker Profile */}
      <ProfileInput
        label="Attacker"
        profile={attackerProfile}
        onChange={setAttackerProfile}
      />
      
      {/* Defender Profile */}
      <ProfileInput
        label="Defender"
        profile={defenderProfile}
        onChange={setDefenderProfile}
      />
      
      {/* Calculated Values Display (optional, toggleable) */}
      {showCalculations && (
        <CalculatedValuesCard
          attacker={attackerProfile}
          defender={defenderProfile}
        />
      )}
      
      {/* Simulate Button */}
      <Button onClick={handleSimulate}>Simulate</Button>
      
      {/* Results */}
      {results && <ProbabilityChart results={results} />}
    </>
  );
}
```

### Calculated Values Display

Show intermediate calculations for transparency:

```
┌──────────────────────────────┐
│ Calculated Combat Values     │
├──────────────────────────────┤
│ To Hit:     4+               │
│ To Wound:   3+               │
│ Armor Save: 4+               │
│ Aegis Save: 5+               │
├──────────────────────────────┤
│ [Toggle: Show/Hide]          │
└──────────────────────────────┘
```

**Benefits:**
- Users can verify calculations are correct
- Educational: teaches game mechanics
- Debugging: spot input errors
- Optional toggle to hide for cleaner UI

## File Structure

### New Files

```
src/
  engine/
    profile.ts              # Profile calculation logic
    profile.test.ts         # Unit tests for calculations
  
  components/
    ProfileView.tsx         # Main profile mode view
    ProfileInput.tsx        # Single profile input form
    CalculatedValuesCard.tsx # Shows calculated hit/wound/save values
  
  utils/
    profile-helpers.ts      # Default profiles, validation
```

### Modified Files

```
src/
  routes/
    index.tsx              # Add 'profiles' to mode enum
  
  components/
    Navbar.tsx             # Add link to profile mode (optional)
```

## Implementation Plan

### Phase 1: Core Logic (Engine Layer)

**Files:** `src/engine/profile.ts`, `src/engine/profile.test.ts`

1. Define `UnitProfile` interface
   - Start with boolean flags for common special rules (hatred, poison, etc.)
   - Add `specialRules?: SpecialRule[]` field for future structured approach
2. Implement calculation functions:
   - `calculateToHit()`
   - `calculateToWound()`
   - `calculateArmorSave()`
   - `determineSpecialSave()`
3. Implement `profileToSimulationParams()`
   - Map boolean special rules to reroll mechanics
   - (Optional: add `processSpecialRules()` for structured format)
4. Write comprehensive unit tests for all calculations
5. Test edge cases (max/min values, boundary conditions)

**Success Criteria:**
- All calculation functions covered by tests
- Edge cases handled (min 2+, max 6+, 'none' values)
- Boolean special rules mapped correctly
- 100% test coverage on calculation logic

**V1 Simplification:**
- Use boolean flags: `hatred?: boolean`, `divineAttacks?: boolean`, etc.
- Keep structured `SpecialRule[]` format documented but not required for V1
- Can add structured format in Phase 7 (V2 enhancements)

### Phase 2: Helper Utilities

**Files:** `src/utils/profile-helpers.ts`

1. Create default profile templates:
   - `createDefaultAttacker()`
   - `createDefaultDefender()`
2. Add validation functions:
   - `validateProfile()`
3. Add helper functions:
   - `cloneProfile()`

### Phase 3: UI Components

**Files:** `src/components/ProfileInput.tsx`, `src/components/CalculatedValuesCard.tsx`

1. Build `ProfileInput` component:
   - Input fields for all stats
   - Dropdown selectors for special saves
   - Reroll toggles (reuse existing patterns from DiceInput)
   - Special rules checkboxes
   - Optional name field
2. Build `CalculatedValuesCard` component:
   - Display calculated to-hit, to-wound, saves
   - Toggle to show/hide
   - Clear, readable layout

### Phase 4: Main View Component

**Files:** `src/components/ProfileView.tsx`

1. Create `ProfileView` component:
   - Two `ProfileInput` instances (attacker, defender)
   - Simulate button
   - Results display (reuse `ProbabilityChart`)
   - Calculated values card
2. State management
3. Integration with existing simulator

### Phase 5: Route Integration

**Files:** `src/routes/index.tsx`

1. Update route search schema:
   - Add `'profiles'` to mode enum
2. Conditional rendering:
   - `mode === 'profiles'` → `<ProfileView />`
   - `mode === 'versus'` → `<VersusView />`
   - Default → `<CombatView />`

### Phase 6: Testing & Polish

1. Manual testing:
   - Test all stat combinations
   - Verify calculations match expected results
   - Test special saves (Aegis, Regen)
   - Test special rules integration
2. Edge case testing:
   - Very high/low stats
   - 'none' armor saves
   - Multiple special rules combined
3. UI polish:
   - Responsive design
   - Loading states
   - Error handling
   - Accessibility

## Testing Strategy

### Unit Tests

**Calculation Logic (`profile.test.ts`):**

```typescript
describe('calculateToHit', () => {
  it('should return 2+ when Off > Def by 5+', () => {
    expect(calculateToHit(7, 2)).toBe(2);
    expect(calculateToHit(10, 4)).toBe(2);
  });

  it('should return 3+ when Off > Def by 1-4', () => {
    expect(calculateToHit(5, 4)).toBe(3);
    expect(calculateToHit(6, 3)).toBe(3);
  });

  it('should return 4+ when Off equals Def', () => {
    expect(calculateToHit(4, 4)).toBe(4);
  });

  it('should return 4+ when Def > Off by 1-4', () => {
    expect(calculateToHit(4, 5)).toBe(4);
    expect(calculateToHit(3, 6)).toBe(4);
  });

  it('should return 5+ when Def > Off by 5+', () => {
    expect(calculateToHit(2, 7)).toBe(5);
    expect(calculateToHit(4, 10)).toBe(5);
  });
  
  it('should not apply hard caps (modifiers can change later)', () => {
    // These are base values from skill difference
    // Special rules or modifiers may later make them 6+ or better than 2+
    expect(calculateToHit(10, 1)).toBe(2); // Base 2+, could be modified
    expect(calculateToHit(1, 10)).toBe(5); // Base 5+, could become 6+ with penalties
  });
});

describe('calculateToWound', () => {
  it('should return 4+ when Str equals Res', () => {
    expect(calculateToWound(4, 4)).toBe(4);
  });

  it('should improve by 1 per point of Str advantage', () => {
    expect(calculateToWound(4, 3)).toBe(3);
    expect(calculateToWound(5, 3)).toBe(2);
    expect(calculateToWound(6, 3)).toBe(2); // Capped
  });

  it('should worsen by 1 per point of Res advantage', () => {
    expect(calculateToWound(3, 4)).toBe(5);
    expect(calculateToWound(3, 5)).toBe(6);
    expect(calculateToWound(3, 7)).toBe(6); // Capped
  });
});

describe('calculateArmorSave', () => {
  it('should calculate save as 7 - effectiveArmor', () => {
    expect(calculateArmorSave(3, 0)).toBe(4); // 7 - 3 = 4+
    expect(calculateArmorSave(4, 1)).toBe(4); // 7 - 3 = 4+
    expect(calculateArmorSave(5, 0)).toBe(2); // 7 - 5 = 2+
  });

  it('should return none when armor is negated', () => {
    expect(calculateArmorSave(2, 3)).toBe('none');
    expect(calculateArmorSave(1, 1)).toBe('none');
  });

  it('should cap at 2+ minimum', () => {
    expect(calculateArmorSave(6, 0)).toBe(2);
    expect(calculateArmorSave(7, 0)).toBe(2);
  });
});

describe('determineSpecialSave', () => {
  it('should return none when no special saves', () => {
    expect(determineSpecialSave({ /* no saves */ })).toBe('none');
  });
  
  it('should return Aegis when only Aegis present', () => {
    expect(determineSpecialSave({ aegisSave: 5 })).toBe(5);
  });
  
  it('should return Regen when only Regen present', () => {
    expect(determineSpecialSave({ regenerationSave: 6 })).toBe(6);
  });
  
  it('should choose better save when both present', () => {
    expect(determineSpecialSave({ 
      aegisSave: 5, 
      regenerationSave: 6 
    })).toBe(5); // Better save
  });
  
  it('should respect preference when specified', () => {
    const profile = { aegisSave: 5, regenerationSave: 4 };
    expect(determineSpecialSave(profile, true)).toBe(5); // Prefer Aegis
    expect(determineSpecialSave(profile, false)).toBe(4); // Prefer Regen
  });
});

describe('profileToSimulationParams', () => {
  it('should correctly convert profiles to simulation params', () => {
    const attacker: UnitProfile = {
      offensiveSkill: 4,
      strength: 4,
      armorPenetration: 1,
      attacks: '10',
      wounds: 1,
      hatred: true,  // V1: boolean flag
      // ... other fields
    };

    const defender: UnitProfile = {
      defensiveSkill: 3,
      resilience: 3,
      armor: 3,
      wounds: 1,
      aegisSave: 5,
      // ... other fields
    };

    const params = profileToSimulationParams(attacker, defender);

    expect(params.toHit).toBe(3); // Off 4 vs Def 3
    expect(params.toWound).toBe(3); // Str 4 vs Res 3
    expect(params.armorSave).toBe(5); // 7 - (3 - 1) = 5+
    expect(params.specialSave).toBe(5); // Aegis 5+
    expect(params.rerollHitFailures).toBe('all'); // From Hatred
  });
  
  it('should process structured special rules (V2)', () => {
    const attacker: UnitProfile = {
      offensiveSkill: 4,
      strength: 4,
      armorPenetration: 1,
      attacks: '10',
      wounds: 1,
      specialRules: [
        {
          name: "Forest Embrace",
          targetPhases: ['hit', 'wound'],
          effect: { type: 'reroll', reroll: '1s' }
        },
        {
          name: "Press the Ranks",
          targetPhases: ['wound'],
          effect: {
            type: 'modifier',
            modifier: {
              operation: 'add',
              value: -1,
              restriction: { type: 'max', value: 3 }
            }
          }
        }
      ],
      // ... other fields
    };

    const defender: UnitProfile = {
      defensiveSkill: 3,
      resilience: 3,
      armor: 3,
      wounds: 1,
      // ... other fields
    };

    const params = profileToSimulationParams(attacker, defender);

    expect(params.toHit).toBe(3); // Off 4 vs Def 3
    expect(params.toWound).toBe(3); // Str 4 vs Res 3, then +1 bonus (4-1=3), within max 3+ limit
    expect(params.rerollHitFailures).toBe('1s'); // From Forest Embrace
    expect(params.rerollWoundFailures).toBe('1s'); // From Forest Embrace
  });
});
```

### Special Rule Processing Tests

```typescript
describe('applyModifier', () => {
  it('should apply addition modifier', () => {
    const modifier = { operation: 'add', value: -1 };
    expect(applyModifier(4, modifier)).toBe(3); // 4+ → 3+
  });
  
  it('should apply restriction', () => {
    const modifier = {
      operation: 'add',
      value: -2,
      restriction: { type: 'max', value: 3 }
    };
    expect(applyModifier(4, modifier)).toBe(3); // 4+ → 2+, capped at 3+
  });
  
  it('should apply multiplication and round up', () => {
    const modifier = { operation: 'multiply', value: 2 };
    expect(applyModifier(3, modifier)).toBe(6); // 3 * 2 = 6
  });
  
  it('should apply division and round up', () => {
    const modifier = { operation: 'divide', value: 2 };
    expect(applyModifier(3, modifier)).toBe(2); // 3 / 2 = 1.5 → 2
  });
});
```

### Integration Tests

- Test full simulation flow: profile → params → simulation → results
- Verify results match expected probability distributions
- Test with various profile combinations

## Future Enhancements

### V2 Features (Out of Scope for Initial Implementation)

1. **Structured Special Rules System:**
   - Migrate from boolean flags to full `SpecialRule[]` format
   - UI for adding/removing rules from a library
   - Custom rule builder for advanced users
   - Visual display of active rule effects
   - Tooltip showing exact modifier calculations

2. **Mutual Combat:**
   - Both profiles attack each other
   - Calculate combat resolution score
   - Show net damage and winner

3. **Charge/Impact Hits:**
   - Add charging attacker bonuses
   - Impact hit dice
   - Charging special rules

4. **Profile Presets:**
   - Save frequently used profiles
   - Load from URL
   - Share profiles with others

5. **Multiple Ranks:**
   - Supporting attacks
   - Rank bonuses
   - Combat resolution calculation

6. **Discipline/Agility Usage:**
   - Discipline for break tests
   - Agility for charge distance
   - Other game phase mechanics

7. **Army List Integration:**
   - Import full unit profiles
   - Equipment options
   - Point cost efficiency

8. **Advanced Special Rules:**
   - Divine Attacks
   - Flaming/Magical weapons
   - Breath weapons
   - Stomp attacks

## Questions & Decisions

### Resolved

✅ **Q: Gap in to-hit logic when Def > Off by 1-4?**
- A: Same as tied (4+ to hit)

✅ **Q: How to integrate into UI?**
- A: New query parameter on index page: `/?mode=profiles`

✅ **Q: Special saves format?**
- A: Input field for save value (2-6)

✅ **Q: Include Discipline and Agility in UI?**
- A: Keep in interface for future, exclude from UI in v1

✅ **Q: Reroll mechanics in profile?**
- A: No. Special rules in profile (e.g., Hatred) map to reroll mechanics in simulator

✅ **Q: Hard caps on to-hit from skill difference?**
- A: 5+ max from skill difference alone, but overall can be 2-6+ with modifiers

✅ **Q: Aegis vs Regeneration handling?**
- A: Models can have both. Only one used per wound. Auto-select better save in V1, special rule logic in V2

✅ **Q: How to apply modifiers when multiple effects interact?**
- A: Follow priority order: 1) Fixed numbers, 2) Multiply/Divide, 3) Add/Subtract (unrestricted then restricted), 4) Always/Never. Within same step, apply in order giving lowest value/success chance. Round up, min 0 for stats, max 6 for armor. Always fail on 1s, succeed on 6s.

### Open Questions

❓ **Special rules implementation approach?**
- Option A: Start with boolean flags (hatred, divineAttacks, etc.) - simpler V1
- Option B: Implement full structured format from start - more flexible but more complex
- Option C: Hybrid - common rules as booleans, custom rules field for advanced users
- Recommendation: Start with Option A (booleans) for V1, migrate to structured format in V2

❓ **Should we show step-by-step calculation breakdown?**
- Example: "Off 4 - Def 3 = +1 difference → 3+ to hit"
- Helps users understand the math
- Could be a tooltip or expandable section

❓ **Default values for new profiles?**
- Generic? (Off 4, Def 4, S4, R4, Arm 3, etc.)
- Or empty/zero values requiring input?

❓ **Validation and error handling?**
- Min/max values for stats? (e.g., Off/Def 1-10?)
- Required fields?
- Show warnings for unusual combinations?

❓ **Mobile layout priority?**
- Profile inputs are complex - need careful mobile design
- Consider collapsible sections
- May need different layout than desktop

❓ **Special rule UI/UX?**
- Checkboxes for common rules?
- Dropdown to add rules from library?
- Custom rule builder for advanced users?
- Show applied modifiers clearly ("Hatred: rerolling failed hits")

## Success Metrics

- Users can input two full profiles and get simulation results
- Calculations match game rules exactly
- All edge cases handled correctly
- Tests cover all calculation logic
- UI is intuitive and responsive
- Implementation doesn't break existing combat/versus modes

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Calculation errors | High | Comprehensive unit tests, verify against known scenarios |
| Complex UI overwhelming users | Medium | Clear labels, tooltips, calculated values display for transparency |
| Mobile usability issues | Medium | Test on mobile early, use collapsible sections |
| Breaking existing modes | High | Keep clear separation, add conditional rendering, test all modes |
| Incomplete game rules | Low | Start with core rules, document future enhancements |

## Timeline Estimate

- Phase 1 (Core Logic): 2-3 hours
- Phase 2 (Helpers): 1 hour
- Phase 3 (UI Components): 3-4 hours
- Phase 4 (Main View): 2 hours
- Phase 5 (Route Integration): 1 hour
- Phase 6 (Testing & Polish): 2-3 hours

**Total: 11-14 hours** for full implementation and testing
