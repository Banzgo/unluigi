# Pohjola Combat Simulator — Mechanics Review

*Please confirm or correct any of the rules below. Notes on specific interpretations and edge cases are marked* **[CONFIRM]**.

---

## Attack Resolution — Step by Step

### 1. Attack Pool
The attacker rolls a pool of d6s (supports fixed numbers like `6` or dice expressions like `2d6+3`).

### 2. Divine Truth [X]
Before rolling, the first X dice in the pool automatically count as **crit hits** (not normal hits). The remaining dice are rolled normally. *Auto-hits are always crits, even with criticalStrike = -1.*

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
Add X flat **normal** hits to the pool (no effect on a complete miss; crits are unaffected). Applied **before** Reverberating, Block, and defence.

- Example: 2 crits + 1 normal hit, Titanic [1] → 2 crits + 2 normal hits.
- The bonus normal hits are also spawn sources for Reverberating and face the defence roll.

### 7. Reverberating Strikes
For each hit currently in the post-Titanic pool, one additional d6 attack die is rolled with the same AS and crit threshold. Attacker rerolls use the **remaining budget** after the main attack consumed its share (budget is shared and decremented). The extra hits join the combined pool **before** Block and defence. Sub-attacks do not themselves spawn further Reverberating dice.

- Example: post-Titanic pool has 3 hits → roll 3 additional d6s; their results are classified and added to the pool, which then proceeds through Block → defence → damage.

### 8. Block / Crush
`Effective Block = max(0, Block - Crush)`

The defender **converts** up to `Effective Block` crit hits into normal hits (the converted hits still face the defence roll). Block/Crush is resolved **before** the defence phase.

- Block [2], Crush [0] → up to 2 crits converted to normal hits.
- Block [2], Crush [1] → up to 1 crit converted.
- Block [2], Crush [3] → 0 converted (Crush cannot go below 0).
- Crush reduces the Block value itself, not individual conversions.

### 9. Defence Phase *(all normal hits — unconverted crits skip this entirely)*
For each normal hit, the defender rolls one die vs their Defence Skill (DS). Die ≥ DS = hit negated (saved).

**Resilient [X]**: instead of rolling one die per hit, the defender rolls `hitCount + X` dice, sorts them descending, and assigns the top `hitCount` rolls to the hits. This gives a pool advantage — the extra dice are discarded. *This is a pool model (roll extra, keep best N), not a per-hit model.*

**Defender Divine Truth [N]**: the first N normal hits auto-save without rolling. Only the remaining hits go to the pool roll.

**Defender Rerolls** (same logic as attacker rerolls, applied to the defence dice):
- **Good Rerolls [N]**: reroll up to N dice that failed to save (die < DS).
- **Bad Tokens [N]**: reroll targets determined from the *original* rolls (before good rerolls). Force-reroll up to N dice that succeeded (die ≥ DS).

### 10. Damage
`Total hits = remaining crits (post-Block) + survived normal hits`

Each hit = 1 HP damage.

### 11. Lethality [X]
Adds X extra hits to the pool (flat bonus). No effect if no hits were scored.

- Example: 3 hits, Lethality [1] → 3 + 1 = 4 damage.
- Example: 2 hits, Lethality [3] → 2 + 3 = 5 damage.
- Example: 0 hits, Lethality [3] → 0 damage (lethality does not trigger without hits).

---

## Tracked Stats (shown in chart)

| Stat | What it counts |
|------|---------------|
| **Crits** | Total crit hits scored post-Titanic (before Block conversion) |
| **Saves** | Normal hits negated by successful defence rolls (die ≥ DS), including Defender Divine Truth auto-saves |
| **Damage** | Final HP lost (base hits + Lethality) |

The chart shows the distribution of damage outcomes across 50 000 simulated attacks, plus expected damage, variance, and average crits/saves globally and per damage value.

---

## Edge Cases

1. **Divine Truth + Titanic**: auto-crits first, then Titanic adds flat normal hits to the pool. Correct.

2. **Crits + Critical Strike [-1]**: with CS [-1], no rolled die can ever be a crit. However, Divine Truth auto-hits *are* crits even with CS [-1]. Confirmed by tests (`divineTruth=3, pool=3, criticalStrike=-1` → 3 crits).

3. **Block > crits**: if Block [3] and only 1 crit exists, only 1 is converted (can’t convert more crits than exist).

4. **Reverberating + Lethality**: Lethality applies once, after all hits (main + reverberating) are combined and Block/defence resolved. Sub-attack hits join the main pool before those steps.

5. **Reverberating + Titanic**: Titanic adds flat normal hits to the main pool *before* Reverberating, so reverberating hits include the Titanic bonus hits as spawn sources.

6. **Resilient vs. individual rolls**: pool model confirmed (best N of N+X).

7. **Attacker Bad Tokens + Good Rerolls together**: both budgets are determined from the **initial** roll (pre-good-reroll), so a die cannot be targeted by both. Good rerolls apply first in the loop, then bad tokens.

---

## Out of Scope (Stage 2)

- Will tests
- Fear
- Versus / profile comparison mode
