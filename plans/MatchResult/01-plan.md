# Match Result Feature Plan

## Overview

New page `/matchresult`. Two players paste army lists, mark unit statuses, track objectives. Calculates VP totals and BP result.

---

## URL & Routing

- Route: `/matchresult`
- Nav entry in `Navbar.tsx`
- New folder: `src/matchresult/`
  - `components/MatchResultPage.tsx` — top-level page
  - `components/ArmyListInput.tsx` — paste + parse panel
  - `components/UnitRow.tsx` — single unit with status buttons
  - `components/ScorePanel.tsx` — VP totals + BP result + objectives
  - `utils/parseList.ts` — list parser
  - `utils/scoring.ts` — VP diff → BP table

---

## List Format

```
Julius Castren (Banzgo) - Sylvan Elves          ← optional header line
295 - Forest Prince, Light Troops, Sylvan Bow   ← unit entry
...
4000                                             ← total (ignored, recalculated)
```

### Parse rules

- **Header line**: no leading number → player name + faction. Optional.
- **Unit line**: `^\d+\s*-\s*(.+)` → points + description
  - Description: first token(s) = count+name (up to first comma), rest = options
  - Count+name: if description starts with digit(s) then space then word(s) until comma → `"5 Thicket Beasts"`; otherwise just name
- **Total line**: solo number at end → discard (recalculate from units)
- Lines that don't match either pattern → skip silently

### Parsed unit shape

```ts
interface ParsedUnit {
  id: string           // uuid or index-based
  points: number
  countName: string    // "5 Thicket Beasts" or "Forest Prince"
  options: string      // "Standard Bearer, Wizard Conclave..."
  status: 'alive' | 'half' | 'dead'
}
```

---

## UI Layout

### Desktop (side-by-side, ≥768px)

```
┌─────────────────────────────────────────────────────────────────┐
│                      MATCH RESULT                               │
├────────────────────────────┬────────────────────────────────────┤
│  Player 1 VP: 1 450        │  Player 2 VP: 850                  │
│  ──────────────────────    │  ──────────────────────────────    │
│  Battle Points: 13         │  Battle Points: 7                  │
├────────────────────────────┴────────────────────────────────────┤
│  VP Difference: 600                                             │
│                                                                 │
│  PRIMARY OBJECTIVE                                              │
│  ○ Player 1   ● Neither   ○ Player 2                           │
│                                                                 │
│  SECONDARY OBJECTIVES        [+ Add Secondary]                  │
│  Secondary 1:  ☐ Player 1   ☐ Player 2     [× Remove]         │
│  Secondary 2:  ☐ Player 1   ☐ Player 2     [× Remove]         │
├────────────────────────────┬────────────────────────────────────┤
│  [PLAYER 1 LIST]            │  [PLAYER 2 LIST]                  │
│                             │                                   │
│  ▼ Sylvan Elves  [Edit]     │  ▼ Dwarven Holds  [Edit]         │
│  ─────────────────────────  │  ──────────────────────────────  │
│  295  Forest Prince         │  320  Runic Smith                 │
│       Light Troops, ...     │       BSB, ...                    │
│                    ●ALIVE   │                    ●ALIVE         │
│  ─────────────────────────  │  ──────────────────────────────  │
│  395  5 Thicket Beasts      │  450  20 Greybeards               │
│       Standard Bearer       │       FC, ...                     │
│                    ○HALF    │                    ●ALIVE         │
│  ─────────────────────────  │  ──────────────────────────────  │
│  ...                        │  ...                             │
└────────────────────────────┴────────────────────────────────────┘
```

### Mobile (stacked)

Score panel full-width on top. Player 1 list full-width. Player 2 list full-width below.

### Initial state (no list pasted)

```
┌───────────────────────────────┐
│  Paste your army list below:  │
│  ┌─────────────────────────┐  │
│  │ [textarea]              │  │
│  └─────────────────────────┘  │
│       [Parse List]            │
└───────────────────────────────┘
```

After parse: textarea collapses, unit rows appear, small `[Edit]` button to re-expand.

---

## Unit Row

```
┌────────────────────────────────────────────────────────┐
│ 395  5 Thicket Beasts                [ALIVE][HALF][DEAD]│
│      Standard Bearer                                    │
└────────────────────────────────────────────────────────┘
```

- Points + count+name on first line
- Options on second line (smaller/muted text), hidden if empty
- Status buttons right-aligned
  - `ALIVE` = green (default active)
  - `HALF` = orange
  - `DEAD` = red
- Active button = filled/solid, inactive = outline
- VP contribution shown next to points when not ALIVE: `395 → 197.5`

---

## Scoring

### VP contribution per unit

| Status | VP scored by opponent |
|--------|----------------------|
| ALIVE  | 0                    |
| HALF   | points × 0.5        |
| DEAD   | points               |

No rounding — keep decimals.

### BP table (VP difference)

| VP diff   | Winner BP | Loser BP |
|-----------|-----------|----------|
| 0–200     | 10        | 10       |
| 201–400   | 11        | 9        |
| 401–800   | 12        | 8        |
| 801–1200  | 13        | 7        |
| 1201–1600 | 14        | 6        |
| 1601–2000 | 15        | 5        |
| 2001+     | 16        | 4        |

Winner = player with higher VP. Tie (0–200) = 10/10.

### Primary objective

3-way toggle: P1 wins / Neither / P2 wins.

- P1 wins → P1 +3 BP, P2 −3 BP
- P2 wins → P2 +3 BP, P1 −3 BP
- Neither → no change

### Secondary objectives

Each player has exactly 1 secondary objective. Simple checkbox per player — did they complete it or not.
Per checked box: that player +1 BP, opponent −1 BP.

### Final BP display

Show both players' final BP. Highlight the higher one.

---

## Component Structure

```
src/matchresult/
├── components/
│   ├── MatchResultPage.tsx    ← route component, holds all state
│   ├── ScorePanel.tsx         ← VP totals, BP result, objectives
│   ├── ArmyPanel.tsx          ← one player's paste area + unit list
│   ├── UnitRow.tsx            ← single unit row with status buttons
│   └── ObjectiveControls.tsx  ← primary 3-way + secondary checkboxes
├── utils/
│   ├── parseList.ts           ← string → ParsedUnit[]
│   └── scoring.ts             ← vpDiff → BP, objective BP modifiers
└── types.ts                   ← ParsedUnit, PlayerState, MatchState
```

State lives entirely in `MatchResultPage` (no persistence, no URL encoding). Props flow down, callbacks flow up.

---

## Open Questions / Edge Cases

- **Negative BP**: mathematically possible if many secondaries and VP near 4/16 split. Display as-is or clamp at 0? → TBD
- **List with no units parsed**: show error message in panel
- **Unit at exactly half HP**: both HALF and DEAD are valid statuses to select, user decides

---

## Implementation Phases

1. `parseList.ts` + unit tests covering header, normal units, bare total line
2. Types + `scoring.ts` + unit tests
3. `UnitRow.tsx` + `ArmyPanel.tsx` (paste → parse → rows)
4. `ObjectiveControls.tsx`
5. `ScorePanel.tsx`
6. `MatchResultPage.tsx` wiring everything together
7. Route registration + navbar link
8. Responsive layout polish
