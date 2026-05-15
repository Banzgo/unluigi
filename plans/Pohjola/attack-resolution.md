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

The first X attack dice auto-succeed as **normal hits** (not crits) without rolling.  
Roll the remaining `attackPool - X` dice normally (step 2).  
If X ≥ attackPool, all dice auto-succeed; skip step 2.

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

Divine Truth auto-hits are always normal hits regardless of critThreshold.

### Step 4 — Attacker Rerolls

Applied to attack dice that were **rolled** (not Divine Truth auto-hits).

- **Attacker Good Rerolls [N]**: pick up to N failed dice (die < AS); reroll each once.
- **Attacker Bad Tokens [N]**: pick up to N successful dice; force-reroll each once. Re-evaluate hit/crit status after reroll.
- "all" = apply to every eligible die.
- Each die may be rerolled at most once (good and bad tokens cannot both apply to same die).

After rerolls, re-classify hits as crit / normal using critThreshold.

### Step 5 — Titanic Strikes [X]

Each hit (crit or normal) becomes **X + 1 hits**, preserving crit status.  
Example: 2 crits + 1 normal hit, Titanic[1] → 4 crits + 2 normal hits.  
Applied **before** defence.

### Step 6 — Defence Phase (normal hits only)

Crits skip this step entirely.

**Resilient pool:**  
`defenceDice = normalHitCount + resilient`  
Roll `defenceDice` d6, sort descending, assign the top `normalHitCount` rolls (one per hit).

**Defender rerolls** (applied to the rolled defence dice before assignment):
- **Defender Good Rerolls [N]**: reroll up to N dice that show < DS.
- **Defender Bad Tokens [N]**: force-reroll up to N dice that show ≥ DS.
- "all" = apply to every eligible die.
- Each die rerolled at most once.

After rerolls, sort descending again, assign top `normalHitCount` to hits.

**Outcome per assigned die:**  
- die ≥ DS → hit negated (discarded)  
- die < DS → normal hit survives

### Step 7 — Block / Crush

`effectiveBlock = max(0, block - crush)`  
Cancel up to `effectiveBlock` crits (implementation cancels greedily).

### Step 8 — Damage

`totalHits = remainingCrits + survivingNormalHits`  
Each hit = 1 HP damage.

### Step 9 — Lethality [X]

`lethalityBonus = totalHits * X`  
`lethalityBonus = min(lethalityBonus, totalHits)` — bonus capped at base damage.  
`damage = totalHits + lethalityBonus`

### Step 10 — Reverberating Strikes

For each hit that contributed to `totalHits` (step 8, pre-Lethality count), spawn one sub-attack:
- Same `PohjolaAttackParams` except `reverberating = false` (no further chaining).
- Sum sub-attack `{ damage, crits, blocks }` into parent outcome.

---

## Tracked Metrics

| Metric | Definition |
|--------|------------|
| **Crits** | Total crit hits scored post-Titanic (before Block rule cancellation) |
| **Blocks** | Normal hits negated by successful defence rolls (die ≥ DS, step 6) |
| **Damage** | Final HP lost (step 8 base hits + Lethality bonus), includes Reverberating sub-attacks |

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
| `divineTruth` | 0–N | Auto-hit normal hits (first N dice) |
| `block` | 0–3 | Max crits defender can cancel |
| `crush` | 0–3 | Reduces block by X (min 0) |
| `lethality` | 0–3 | Extra HP per hit (capped at base damage) |
| `reverberating` | bool | Each damage-hit spawns sub-attack |

---

## Out of Scope (Stage 2)

Will tests, Fear, Versus mode, profile import.
