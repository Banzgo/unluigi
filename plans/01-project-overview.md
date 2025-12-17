# Project Overview: The Ninth Age Dice Simulator

## Project Name

**T9A Dice Calculator** (working title)

## Purpose

A web-based probability calculator for The Ninth Age miniature wargame that simulates combat outcomes by running thousands of dice roll iterations to provide statistical distributions and expected values.

## Target Users

- The Ninth Age players who want to optimize their army lists
- Players analyzing combat matchups before tournaments
- New players learning about probability and game mechanics
- Content creators analyzing unit effectiveness

## Core Functionality

### Dice Engine

Simulate complete attack sequences from The Ninth Age combat system:

1. **To-Hit Rolls** - Rolling attacks against a target number
2. **To-Wound Rolls** - Successful hits rolling to wound
3. **Armor Saves** - Defender rolling to negate wounds
4. **Special Saves** - Ward saves, regeneration, or other special abilities

### Special Rules Support

- **Rerolls**: Failed hits, failed wounds, successful saves
- **Modifiers**: +/- to hit, wound, or save rolls
- **Exploding Hits**: (e.g., 6s to hit generate additional attacks)
- **Auto-wound**: 6s to wound automatically (ignore armor)
- **Mortal Wounds**: Unmodified 6s bypass saves
- **Lethal Strike**: Improved wound characteristics on 6s to hit

### Output

- Probability distribution (0-X wounds dealt)
- Expected value (average wounds)
- Percentile results (50th, 75th, 95th percentiles)
- Visual charts showing distribution curves

## Technology Stack

- **Framework**: Vite + React (latest versions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charting**: shadcn/ui Charts (built on Recharts)
- **Deployment**: Vercel
- **Node Version**: Latest LTS (20.x or 22.x)

## Key Requirements

- ✅ Client-side only (no backend, no database)
- ✅ Mobile responsive design
- ✅ Fast calculations (handle 10,000+ simulations)
- ✅ Intuitive parameter input
- ✅ Clear visual representation of results
- ✅ Shareable URLs for configurations (optional stretch goal)

## Non-Goals (V1)

- ❌ User accounts or saved configurations
- ❌ Backend API
- ❌ Database storage
- ❌ Multi-language support
- ❌ Full army calculator (focus on single unit interactions)

## Success Criteria

1. Can accurately simulate basic attack sequence (hit → wound → save)
2. Runs 10,000 simulations in under 1 second
3. Works smoothly on mobile devices
4. Matches known probability calculations (validation testing)
5. Successfully deployed to Vercel with public URL
