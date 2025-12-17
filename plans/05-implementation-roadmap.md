# Implementation Roadmap

## Development Phases

### Phase 0: Project Setup (Day 1)

**Goal**: Initialize project with all tooling configured

#### Tasks

- [ ] Create Vite + React + TypeScript project (`npm create vite@latest unluigi -- --template react-ts`)
- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui (`npx shadcn-ui@latest init`)
- [ ] Install shadcn/ui components:
  - Button, Input, Card, Label
  - Chart components
  - Toggle, Select, Checkbox
- [ ] Install and configure Biome (`npm install -D @biomejs/biome && npx @biomejs/biome init`)
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Configure `biome.json` for TypeScript linting and formatting
- [ ] Initialize Git repository
- [ ] Create project structure (folders: components, engine, utils, hooks, lib)
- [ ] Set up basic README.md

#### Deliverable

- Clean project structure with dev server running
- Tailwind working with basic styling
- Git repository initialized

---

### Phase 1: Core Dice Engine (Days 2-3)

**Goal**: Build and test the simulation engine

#### Tasks

- [ ] Create `types.ts` with TypeScript interfaces for parameters and results
- [ ] Create `dice.ts` with basic D6 rolling
- [ ] Implement `simulator.ts` with single attack sequence logic:
  - To-hit phase
  - To-wound phase
  - Armor save phase
  - Special save phase
- [ ] Add reroll logic to each phase
- [ ] Implement `probability.ts` for statistical calculations
- [ ] Create `modifiers.ts` for special rules:
  - Exploding hits
  - Auto-wounds
  - Mortal wounds
  - Lethal strike
- [ ] Write unit tests for engine (Vitest with TypeScript)
- [ ] Validate with known probability scenarios

#### Deliverable

- Working dice engine that can be called with parameters
- Returns accurate statistical distribution
- Test suite with >80% coverage
- Performance: 10k iterations in <500ms

#### Validation Tests

```javascript
// Test case 1: Basic scenario
const params1 = {
  numAttacks: 10,
  toHit: 4,
  toWound: 4,
  armorSave: 4,
  // ... all other defaults
};
// Expected: ~1.25 wounds average

// Test case 2: Perfect offense, no saves
const params2 = {
  numAttacks: 10,
  toHit: 2,
  toWound: 2,
  armorSave: 7,
  // ...
};
// Expected: ~6.94 wounds average
```

---

### Phase 2: shadcn/ui Setup (Days 4-5)

**Goal**: Install and configure shadcn/ui components

#### Tasks

- [ ] Install required shadcn/ui components:
  - `npx shadcn-ui@latest add button`
  - `npx shadcn-ui@latest add input`
  - `npx shadcn-ui@latest add card`
  - `npx shadcn-ui@latest add label`
  - `npx shadcn-ui@latest add toggle`
  - `npx shadcn-ui@latest add toggle-group`
  - `npx shadcn-ui@latest add checkbox`
  - `npx shadcn-ui@latest add select`
  - `npx shadcn-ui@latest add chart`
- [ ] Customize theme in `tailwind.config.ts` if needed
- [ ] Test components with TypeScript
- [ ] Create any custom wrapper components if needed

#### Deliverable

- All shadcn/ui components installed and working
- TypeScript types properly configured
- Components render correctly on mobile and desktop

---

### Phase 3: Parameter Form (Days 6-7)

**Goal**: Build the input form for simulation parameters

#### Tasks

- [ ] Create `ParameterForm.tsx` component
- [ ] Define TypeScript interfaces for form state
- [ ] Implement three sections using shadcn/ui Card:
  - Attack Phase section
  - Wound Phase section
  - Save Phase section
- [ ] Use shadcn/ui components (Input, Label, ToggleGroup, Checkbox, Select)
- [ ] Add form state management (useReducer with TypeScript)
- [ ] Implement input validation with type safety
- [ ] Add error states and messages
- [ ] Create "Calculate" button using shadcn/ui Button
- [ ] Style for mobile and desktop layouts

#### Deliverable

- Complete parameter input form
- All parameters configurable
- Validation working correctly
- Responsive layout (stacked on mobile, sidebar on desktop)

---

### Phase 4: Results Display (Days 8-9)

**Goal**: Visualize simulation results with shadcn/ui charts

#### Tasks

- [ ] Create `ResultsDisplay.tsx` component with TypeScript interfaces
- [ ] Implement statistics summary card using shadcn/ui Card
- [ ] Integrate shadcn/ui Chart components:
  - Bar chart for distribution
  - Configure responsive sizing
  - Apply theme colors and styling
- [ ] Create probability table with TypeScript types
- [ ] Add loading states (skeleton components)
- [ ] Add empty states
- [ ] Style for mobile and desktop with proper TypeScript props

#### Deliverable

- Results display with shadcn/ui charts
- Statistics clearly presented
- Smooth transitions and loading states
- Full TypeScript type coverage

---

### Phase 5: Integration & State Management (Day 10)

**Goal**: Connect UI to dice engine with full TypeScript support

#### Tasks

- [ ] Create `useSimulation.ts` custom hook with proper typing
- [ ] Define TypeScript interfaces for all hook parameters and return values
- [ ] Connect form submit to simulation runner
- [ ] Handle async simulation execution with type-safe promises
- [ ] Add debouncing for parameter changes (if auto-calc)
- [ ] Implement error handling with TypeScript error types
- [ ] Add loading indicators
- [ ] Test full flow: input → simulate → display
- [ ] Ensure all types are properly inferred throughout the app

#### Deliverable

- Fully working application with TypeScript
- Input changes trigger calculations
- Results update correctly
- No TypeScript errors or warnings

---

### Phase 6: Polish & UX Improvements (Days 11-12)

**Goal**: Enhance user experience

#### Tasks

- [ ] Add animations and transitions
- [ ] Improve mobile touch interactions
- [ ] Add keyboard navigation
- [ ] Implement accessibility features (ARIA labels)
- [ ] Add helpful tooltips or info icons
- [ ] Optimize performance (memoization, debouncing)
- [ ] Test on multiple devices
- [ ] Fix any bugs or edge cases

#### Deliverable

- Polished, production-ready UI
- Smooth interactions
- Accessible
- Mobile-friendly

---

### Phase 7: Deployment (Day 13)

**Goal**: Deploy to Vercel

#### Tasks

- [ ] Create Vercel account (if needed)
- [ ] Connect GitHub repository to Vercel
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Output directory: `dist`
- [ ] Set up custom domain (optional)
- [ ] Test deployed version
- [ ] Set up automatic deployments on push
- [ ] Add deployment status badge to README

#### Deliverable

- Live website on Vercel
- Public URL accessible
- Automatic deployments configured

---

### Phase 8: Testing & Validation (Day 14)

**Goal**: Comprehensive testing before launch

#### Tasks

- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance testing (Lighthouse)
- [ ] Accessibility audit (WAVE, axe DevTools)
- [ ] Validate calculations with manual probability calculations
- [ ] User testing (if possible - ask T9A players)
- [ ] Fix any discovered issues

#### Deliverable

- Tested application
- Performance score >90
- Accessibility score >90
- Bug-free (known issues documented)

---

## Timeline Summary

| Phase            | Duration    | Focus Area                |
| ---------------- | ----------- | ------------------------- |
| 0. Setup         | 1 day       | Project initialization    |
| 1. Engine        | 2 days      | Core logic and algorithms |
| 2. UI Components | 2 days      | Reusable components       |
| 3. Form          | 2 days      | Parameter inputs          |
| 4. Results       | 2 days      | Data visualization        |
| 5. Integration   | 1 day       | Connect everything        |
| 6. Polish        | 2 days      | UX improvements           |
| 7. Deployment    | 1 day       | Ship to Vercel            |
| 8. Testing       | 1 day       | Validation                |
| **Total**        | **14 days** | **~2-3 weeks**            |

## Post-Launch Roadmap (Phase 9+)

### Version 1.1 Features

- [ ] URL parameter encoding (shareable links)
- [ ] Preset scenarios dropdown
- [ ] Local storage for last used settings
- [ ] Dark mode
- [ ] Print/export results

### Version 1.2 Features

- [ ] Comparison mode (two scenarios side-by-side)
- [ ] More special rules (Divine Attacks, Impact Hits, etc.)
- [ ] Advanced modifiers
- [ ] Multiple wound allocation

### Version 2.0 Features

- [ ] Unit vs Unit calculator (multiple models)
- [ ] Full combat phase simulation
- [ ] Army builder integration
- [ ] Backend API for sharing (optional)

## Risk Mitigation

### Potential Blockers

1. **Performance Issues**: If simulations are too slow
   - Solution: Optimize algorithm, reduce iterations, use Web Workers
2. **Chart Library Issues**: Recharts not meeting needs
   - Solution: Switch to Chart.js or custom D3 implementation
3. **Mobile UX Problems**: Form too complex on small screens
   - Solution: Wizard-style stepped form, accordion sections
4. **Calculation Accuracy**: Results don't match expected probabilities
   - Solution: Add extensive unit tests, validate with math formulas

## Success Metrics

### MVP Launch Criteria

- ✅ All core parameters working
- ✅ Accurate simulations (validated)
- ✅ Responsive on mobile and desktop
- ✅ Deployed to Vercel
- ✅ Lighthouse score >80
- ✅ No critical bugs

### Post-Launch Goals (3 months)

- 100+ unique visitors
- <2s page load time
- <5% bounce rate
- Positive feedback from T9A community
- Feature requests collected for v1.1

## Development Best Practices

### Git Workflow

- Feature branches: `feature/dice-engine`, `feature/ui-form`
- Main branch: Always deployable
- Commit messages: Conventional commits format
- PR reviews (if team project)

### Code Quality

- ESLint rules enforced
- Prettier for formatting
- PropTypes or TypeScript for type checking
- Unit tests for engine logic
- Component tests for UI (optional)

### Documentation

- README with setup instructions
- Inline code comments for complex logic
- JSDoc for public functions
- Architecture decision records (ADRs) if needed
