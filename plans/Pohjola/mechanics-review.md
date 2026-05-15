# Pohjola Combat Simulator — Mechanics Review

*Please confirm or correct any of the rules below. Notes on specific interpretations and edge cases are marked* **[CONFIRM]**.

---

## Attack Resolution — Step by Step

### 1. Attack Pool
The attacker rolls a pool of d6s (supports fixed numbers like `6` or dice expressions like `2d6+3`).

### 2. Divine Truth [X]
Before rolling, the first X dice in the pool automatically count as **normal hits** (not crits). The remaining dice are rolled normally. **[CONFIRM]** *We treat auto-hits as normal hits, never crits, regardless of the crit threshold.*

### 3. Hit Roll
Each rolled die is compared to the Attack Skill (AS). Die ≥ AS = hit.

### 4. Crit Determination
A hit is a **critical hit** if the die result is at or above the crit threshold:

| Critical Strike | Crit threshold | Crits on |
|---|---|---|
| -1 | impossible | never |
| 0 (default) | 6 | 6 only |
| 1 | 5 | 5 or 6 |
| 2 | 4 | 4, 5, or 6 |
| 3 | 3 | 3, 4, 5, or 6 |

Hits below the crit threshold but ≥ AS are **normal hits**. Divine Truth auto-hits are always normal hits regardless of this threshold.

### 5. Attacker Rerolls
Applied to the rolled dice (not Divine Truth auto-hits). Each die is rerolled at most once.

- **Good Rerolls [N]**: reroll up to N dice that missed (die < AS). `all` = reroll every miss.
- **Bad Tokens [N]**: force-reroll up to N dice that succeeded (any hit). `all` = reroll every success.

Good rerolls are applied first, then bad tokens apply to the (updated) pool of successes.

### 6. Titanic Strikes [X]
Every hit (crit or normal) becomes **X+1 hits**, preserving crit status. Applied **before** the defence phase.

- Example: 2 crits + 1 normal hit, Titanic [1] → 4 crits + 2 normal hits.
- **[CONFIRM]** *Duplication happens before defence, so the expanded pool of normal hits all trigger defence rolls.*

### 7. Defence Phase *(normal hits only — crits skip this entirely)*
For each normal hit, the defender rolls one die vs their Defence Skill (DS). Die ≥ DS = hit negated (saved).

**Resilient [X]**: instead of rolling one die per hit, the defender rolls `hitCount + X` dice, sorts them descending, and assigns the top `hitCount` rolls to the hits. This gives a pool advantage — the extra dice are discarded.

- Example: 3 normal hits, Resilient [1] → roll 4 dice, assign the 3 highest rolls to the 3 hits.
- **[CONFIRM]** *This is a pool model (roll extra, keep best N), not a per-hit model (each hit rolls extra dice independently).*

**Defender Rerolls** (same logic as attacker rerolls, applied to the defence dice):
- **Good Rerolls [N]**: reroll up to N dice that failed to save (die < DS).
- **Bad Tokens [N]**: force-reroll up to N dice that succeeded as saves (die ≥ DS).

### 8. Block / Crush
`Effective Block = max(0, Block - Crush)`

The defender cancels up to `Effective Block` crit hits.

- Block [2], Crush [0] → 2 crits cancelled.
- Block [2], Crush [1] → 1 crit cancelled.
- Block [2], Crush [3] → 0 crits cancelled (Crush cannot go below 0).
- **[CONFIRM]** *Crush reduces the Block value itself, not individual cancellations.*

### 9. Damage
`Total hits = remaining crits (post-Block) + survived normal hits`

Each hit = 1 HP damage.

### 10. Lethality [X]
Adds X extra hits to the pool (flat bonus). No effect if no hits were scored.

- Example: 3 hits, Lethality [1] → 3 + 1 = 4 damage.
- Example: 2 hits, Lethality [3] → 2 + 3 = 5 damage.
- Example: 0 hits, Lethality [3] → 0 damage (lethality does not trigger without hits).

### 11. Reverberating Strikes
Each hit that contributes to final damage (step 9, before Lethality) spawns one sub-attack with identical stats. Sub-attacks do **not** themselves reverberate (no chain).

- Example: 3 total hits → 3 sub-attacks, each resolved with the same AS/DS/rules.
- **[CONFIRM]** *Sub-attacks use the same full rule set (including Titanic, Lethality, etc.) but cannot generate further Reverberating sub-attacks.*

---

## Tracked Stats (shown in chart)

| Stat | What it counts |
|------|---------------|
| **Crits** | Total crit hits scored post-Titanic (before Block cancellation) |
| **Saves** | Normal hits negated by successful defence rolls (die ≥ DS) |
| **Damage** | Final HP lost (base hits + Lethality), including sub-attack damage |

The chart shows the distribution of damage outcomes across 50 000 simulated attacks, plus expected damage, variance, and average crits/saves globally and per damage value.

---

## Edge Cases — Please Confirm

1. **Divine Truth + Titanic**: auto-hits become normal hits first, then Titanic duplicates them as normal hits. Is that correct?

2. **Crits + Critical Strike [-1]**: with CS [-1], no attack die can ever be a crit. Divine Truth auto-hits are also normal (not crits). Is it correct that CS [-1] makes crits entirely impossible including for auto-hits?

3. **Block > crits**: if Block [3] and only 1 crit exists, only 1 is cancelled (can't cancel more crits than exist).

4. **Reverberating + Lethality**: Lethality applies to sub-attacks independently (each sub-attack's own hits get the Lethality bonus). Is that the intended interaction?

5. **Reverberating + Titanic**: sub-attacks include Titanic, so a reverberating attack with Titanic [1] will double its sub-attack hits too. Intended?

6. **Resilient vs. individual rolls**: we use the pool model (best N of N+X), not per-hit extra dice. If the intended rule is "each hit individually rolls 1+X dice and a hit is negated if any die succeeds," the implementation needs changing.

7. **Attacker Bad Tokens + Good Rerolls together**: we apply good rerolls first (re-rolling misses), then bad tokens apply to all successes in the updated pool. Is the order intentional?

---

## Out of Scope (Stage 2)

- Will tests
- Fear
- Versus / profile comparison mode
