# Pohjola — Attack Resolution Reference

Canonical rules spec. Implementation in `src/pohjola/engine/`.

---

## Glossary

| Term | Meaning |
|------|---------|
| **AS** | Attack Skill — minimum die value to hit (2–6) |
| **DS** | Defence Skill — minimum die value to negate a normal hit (2–6) |
| **Crit** | Hit from an attack die at or above the crit threshold (skips defence) |
| **Normal hit** | Hit below crit threshold — defender may roll to negate |
| **Crit threshold** | `max(2, 6 - criticalStrike)`; if `criticalStrike = -1`, threshold = 7 (impossible) |

---

## Step-by-step Resolution

### Step 1 — Divine Truth [X]

The first X attack dice auto-succeed as **crits** without rolling.  
Roll the remaining `attackPool - X` dice normally (step 2).  
If X ≥ attackPool, all dice auto-succeed as crits; skip step 2.

### Step 2 — Hit Roll

Roll remaining dice vs AS.  
- die ≥ AS → hit (proceed to step 3)  
- die < AS → miss (discard)

### Step 3 — Crit Determination

`critThreshold = max(2, 6 - criticalStrike)`

| criticalStrike | critThreshold | Crits on |
|---|---|---|
| -1 | 7 (impossible) | never |
| 0 | 6 | 6 |
| 1 | 5 | 5, 6 |
| 2 | 4 | 4, 5, 6 |
| 3 | 3 | 3, 4, 5, 6 |

- die ≥ critThreshold → **crit**
- AS ≤ die < critThreshold → **normal hit**

Divine Truth auto-hits are always **crits** regardless of critThreshold.

### Step 4 — Attacker Rerolls

Applied to attack dice that were **rolled** (not Divine Truth auto-hits).

- **Attacker Good Rerolls [N]**: pick up to N failed dice (die < AS); reroll each once.
- **Attacker Bad Tokens [N]**: pick up to N successful dice; force-reroll each once. Re-evaluate hit/crit status after reroll.
- "all" = apply to every eligible die.
- Each die may be rerolled at most once (good and bad tokens cannot both apply to same die).

After rerolls, re-classify hits as crit / normal using critThreshold.

### Step 5 — Titanic Strikes [X]

Add X flat **normal** hits to the pool (no effect on a complete miss, and crits are unaffected).  
Example: 2 crits + 1 normal hit, Titanic[1] → 2 crits + 2 normal hits.  
Applied **before** Block and defence.

### Step 6 — Reverberating Strikes

For each hit currently in the pool (post-Titanic), roll one additional d6 attack die.  
Classify it vs AS / critThreshold, then apply the **remaining** attacker-reroll budget (the shared budget is decremented by the main attack's usage, then decremented again by each sub-die).  
All extra hits join the combined pool **before** Block and defence.  
Sub-attacks do not themselves spawn further Reverberating dice.

### Step 7 — Block / Crush

`effectiveBlock = max(0, block - crush)`  
**Convert** up to `effectiveBlock` crits into normal hits (converted hits still face the defence roll in step 8).  
Example: 4 crits, Block[2], Crush[1] → effectiveBlock = 1 → 1 crit converted, 3 crits remain + 1 extra normal.

### Step 8 — Defence Phase (all normal hits)

Normal hits include both original normal hits and Block-converted crits. Crits that were **not** converted skip this step.

**Defender Divine Truth [N]:**  
The first N normal hits auto-save (no roll required). The remaining hits proceed to the pool roll.

**Resilient pool:**  
`defenceDice = normalHitsNeedingRoll + resilient`  
Roll `defenceDice` d6, sort descending, assign the top `normalHitsNeedingRoll` rolls (one per hit).

**Defender rerolls** (applied to the rolled defence dice before assignment):  
- **Defender Good Rerolls [N]**: reroll up to N dice that show < DS.  
- **Defender Bad Tokens [N]**: reroll targets determined from the **original** rolls; force-reroll up to N dice that show ≥ DS.  
- "all" = apply to every eligible die.  
- Each die rerolled at most once.

After rerolls, sort descending again, assign top `normalHitsNeedingRoll` to hits.

**Outcome per assigned die:**  
- die ≥ DS → hit negated (counted as a **Block**)  
- die < DS → normal hit survives

### Step 9 — Damage

`totalHits = remainingCrits + survivedNormalHits`  
Each hit = 1 HP damage.

### Step 10 — Lethality [X]

Adds X extra hits to the pool (flat bonus). No effect if totalHits = 0.  
`damage = totalHits + X` (when totalHits > 0)

---

## Tracked Metrics

| Metric | Definition |
|--------|------------|
| **Crits** | Total crit hits scored post-Titanic (before Block conversion) |
| **Blocks** | Normal hits negated by successful defence rolls (die ≥ DS, step 8), including Defender Divine Truth auto-saves |
| **Damage** | Final HP lost (step 9 base hits + Lethality bonus) |

Crits and Blocks are surfaced in the chart header (global averages) and per-bar tooltips (conditional averages given that damage value).

---

## Rule Parameters Summary

| Parameter | Values | Effect |
|-----------|--------|--------|
| `as` | 2–6 | Hit threshold |
| `ds` | 2–6 | Defence threshold |
| `criticalStrike` | -1, 0, 1, 2, 3 | Adjusts crit threshold |
| `titanicStrikes` | 0–3 | Extra hits per hit (X+1 total) |
| `resilient` | 0–3 | Extra defence dice (pool model) |
| `attackerGoodRerolls` | 0, 1, 2, "all" | Reroll failed attack dice |
| `attackerBadTokens` | 0, 1, 2, "all" | Force-reroll successful attack dice |
| `defenderGoodRerolls` | 0, 1, 2, "all" | Reroll failed defence dice |
| `defenderBadTokens` | 0, 1, 2, "all" | Force-reroll successful defence dice |
| `divineTruth` | 0–N | Auto-crit hits (first N attack dice bypass roll) |
| `defenderDivineTruth` | 0–N | Auto-save defence hits (first N normal hits negated without rolling) |
| `block` | 0–3 | Max crits converted to normal hits |
| `crush` | 0–3 | Reduces block by X (min 0) |
| `lethality` | 0–3 | Flat extra hits added to pool (if any hits scored) |
| `reverberating` | bool | Each post-Titanic hit spawns one sub-attack die (same AS/crits/reroll budget) |

---

## Out of Scope (Stage 2)

Will tests, Fear, Versus mode, profile import.
