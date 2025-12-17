# Technical Architecture

## System Architecture

```
┌─────────────────────────────────────────┐
│         User Interface (React)          │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │  Input Form │    │  Results Display │ │
│  │  Component  │    │    Component     │ │
│  └──────┬──────┘    └────────▲─────────┘ │
│         │                    │           │
│         │   Parameters       │ Results   │
│         ▼                    │           │
│  ┌──────────────────────────┴─────────┐ │
│  │    Dice Engine (TypeScript)        │ │
│  │  - Simulation Runner               │ │
│  │  - Probability Calculator          │ │
│  │  - Statistics Aggregator           │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Project Structure

```
unluigi/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ParameterForm.tsx       # Input controls
│   │   ├── ResultsDisplay.tsx      # Charts & statistics
│   │   ├── PresetSelector.tsx      # Common scenarios
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx          # shadcn button
│   │       ├── input.tsx           # shadcn input
│   │       ├── card.tsx            # shadcn card
│   │       ├── chart.tsx           # shadcn chart
│   │       └── ...                 # other shadcn components
│   ├── engine/
│   │   ├── dice.ts                 # Core dice rolling logic
│   │   ├── simulator.ts            # Simulation runner
│   │   ├── probability.ts          # Statistical calculations
│   │   ├── modifiers.ts            # Special rules handling
│   │   └── types.ts                # TypeScript type definitions
│   ├── utils/
│   │   ├── validators.ts           # Input validation
│   │   └── formatters.ts           # Number/percentage formatting
│   ├── hooks/
│   │   └── useSimulation.ts        # React hook for simulations
│   ├── lib/
│   │   └── utils.ts                # shadcn utility functions
│   ├── App.tsx                     # Main application
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Tailwind imports
├── components.json                 # shadcn/ui config
├── biome.json                      # Biome configuration
├── plans/                          # This directory
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Technology Decisions

### Vite + React

**Why**: Fast development experience, simple configuration, perfect for client-side SPAs

- Hot Module Replacement (HMR) for instant feedback
- Optimized production builds
- Native ES modules support
- No complex configuration needed

### Tailwind CSS + shadcn/ui

**Why**: Utility-first CSS with pre-built accessible components

- Mobile-first responsive design built-in
- shadcn/ui provides beautiful, accessible components
- Components are copied into your project (full customization)
- Built on Radix UI primitives (accessibility-first)
- Consistent design system with CSS variables
- Fast prototyping with ready-to-use components

### Chart Library Options

**Option 1: Recharts**

- ✅ React-first, declarative API
- ✅ Good documentation
- ✅ Responsive by default
- ❌ Slightly larger bundle size

**Option 2: Chart.js + react-chartjs-2**

- ✅ Very performant
- ✅ Widely used, stable
- ✅ Smaller bundle
- ❌ Less React-friendly API

**Recommendation**: Start with Recharts for developer experience

### State Management

**Decision**: Use React hooks only (useState, useReducer)

- No Redux/Zustand needed for this simple app
- All state is ephemeral (no persistence required)
- useReducer for complex parameter state
- useState for UI state

## Performance Considerations

### Simulation Performance

- Run simulations in batches to avoid blocking UI
- Use Web Workers for heavy calculations (future optimization)
- Debounce parameter changes to avoid excessive recalculation
- Cache results for identical parameter sets (optional)

### Bundle Size

- Code splitting not needed (app is small)
- Tree-shaking via Vite
- Lazy load chart library if needed
- Optimize images and assets

### Mobile Responsiveness

- Touch-friendly input controls (larger tap targets)
- Responsive breakpoints: mobile (default), tablet (768px), desktop (1024px)
- Stack inputs vertically on mobile
- Horizontal scrolling for charts on small screens

## Data Flow

1. **User Input** → Parameter Form updates state
2. **State Change** → Triggers simulation via `useSimulation` hook
3. **Simulation** → Dice engine runs N iterations
4. **Results** → Statistics calculated and returned
5. **Display** → Results component renders charts and numbers

## Deployment Architecture

### Vercel Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or 20.x
- **Environment**: Static site (no serverless functions needed)

### Build Optimization

- Minification enabled
- Asset optimization (images, CSS)
- Gzip compression
- CDN distribution via Vercel Edge Network

## Error Handling

### Input Validation

- Validate ranges (e.g., hit value 2-6)
- Ensure positive integers for dice counts
- Prevent divide-by-zero scenarios
- Show user-friendly error messages

### Calculation Errors

- Catch and log any simulation errors
- Provide fallback displays
- Validate output ranges (probabilities 0-1)

## Future Scalability

### Phase 2 Considerations

- URL parameter encoding for sharing
- Local storage for saving presets
- Export results as CSV/JSON
- Comparison mode (multiple scenarios side-by-side)
- Advanced special rules (impact hits, divine attacks, etc.)
