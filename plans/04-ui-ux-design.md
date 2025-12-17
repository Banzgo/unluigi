# UI/UX Design

## Design Philosophy

- **Simplicity First**: Clear, uncluttered interface focused on core functionality
- **Mobile-First**: Design for small screens, scale up to desktop
- **Immediate Feedback**: Results update as parameters change
- **Accessible**: Keyboard navigation, screen reader support, good contrast
- **Component Library**: Built on shadcn/ui for consistent, accessible components

## Color Scheme

### Primary Palette (shadcn/ui default theme)

shadcn/ui uses CSS variables for theming, providing built-in support for light/dark modes:

- **Primary**: `hsl(var(--primary))` - Actions, links, primary buttons
- **Secondary**: `hsl(var(--secondary))` - Highlights, special features
- **Destructive**: `hsl(var(--destructive))` - Errors, dangerous actions
- **Muted**: `hsl(var(--muted))` - Backgrounds, subtle elements
- **Accent**: `hsl(var(--accent))` - Highlights, hover states

### Theme

Start with light theme (shadcn/ui provides dark mode support out of the box for future enhancement)

## Layout Structure

### Mobile Layout (< 768px)

```
┌─────────────────────────┐
│       Header            │
│  "T9A Dice Calculator"  │
├─────────────────────────┤
│                         │
│   Parameter Inputs      │
│   (Stacked vertically)  │
│                         │
│   - Attacks             │
│   - To Hit              │
│   - To Wound            │
│   - Armor Save          │
│   - Special Rules       │
│   - [Calculate Button]  │
│                         │
├─────────────────────────┤
│                         │
│   Results Summary       │
│   (Expected wounds, etc)│
│                         │
├─────────────────────────┤
│                         │
│   Distribution Chart    │
│   (Scrollable)          │
│                         │
└─────────────────────────┘
```

### Desktop Layout (> 1024px)

```
┌──────────────────────────────────────────────────────┐
│                    Header                            │
│              "T9A Dice Calculator"                   │
├──────────────────────┬───────────────────────────────┤
│                      │                               │
│  Parameter Inputs    │     Results Display           │
│  (Left Sidebar)      │                               │
│                      │   ┌─────────────────────┐     │
│  ┌────────────────┐  │   │  Expected Wounds    │     │
│  │ Attack Phase   │  │   │  Mean: 3.2          │     │
│  │ - Attacks: 10  │  │   │  Median: 3          │     │
│  │ - To Hit: 4+   │  │   └─────────────────────┘     │
│  └────────────────┘  │                               │
│                      │   ┌─────────────────────┐     │
│  ┌────────────────┐  │   │                     │     │
│  │ Wound Phase    │  │   │  Distribution Chart │     │
│  │ - To Wound: 4+ │  │   │                     │     │
│  └────────────────┘  │   │    [Bar Chart]      │     │
│                      │   │                     │     │
│  ┌────────────────┐  │   └─────────────────────┘     │
│  │ Save Phase     │  │                               │
│  │ - Armor: 4+    │  │   ┌─────────────────────┐     │
│  │ - AP: 1        │  │   │  Probability Table  │     │
│  └────────────────┘  │   └─────────────────────┘     │
│                      │                               │
│  [Calculate]         │                               │
│                      │                               │
└──────────────────────┴───────────────────────────────┘
```

## Component Specifications

### Header

- App title: "The Ninth Age Dice Calculator"
- Subtitle: "Combat Outcome Simulator"
- (Optional) Link to GitHub or info modal

### Parameter Input Form

#### Section 1: Attack Phase

```
┌─────────────────────────────────┐
│ ⚔️  Attack Phase                │
├─────────────────────────────────┤
│ Number of Attacks               │
│ [        10        ] [+] [-]    │
│                                 │
│ To Hit                          │
│ [2+][3+][4+][5+][6+]           │
│ Selected: 4+                    │
│                                 │
│ Hit Modifier                    │
│ [-2][-1][ 0 ][+1][+2]          │
│                                 │
│ Reroll Hits                     │
│ [None][Failed][Ones][All]      │
│                                 │
│ ☑️ Exploding 6s to Hit          │
│ ☐ Lethal Strike (6s improve    │
│    wound roll)                  │
└─────────────────────────────────┘
```

#### Section 2: Wound Phase

```
┌─────────────────────────────────┐
│ 🗡️  Wound Phase                 │
├─────────────────────────────────┤
│ To Wound                        │
│ [2+][3+][4+][5+][6+]           │
│                                 │
│ Wound Modifier                  │
│ [-2][-1][ 0 ][+1][+2]          │
│                                 │
│ Reroll Wounds                   │
│ [None][Failed][Ones][All]      │
│                                 │
│ ☐ Auto-Wound on 6s              │
│ ☐ Mortal Wounds on 6s           │
└─────────────────────────────────┘
```

#### Section 3: Save Phase

```
┌─────────────────────────────────┐
│ 🛡️  Save Phase                  │
├─────────────────────────────────┤
│ Armor Save                      │
│ [2+][3+][4+][5+][6+][None]     │
│                                 │
│ Armor Piercing                  │
│ [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ]      │
│                                 │
│ Special Save (Ward/Regen)       │
│ [2+][3+][4+][5+][6+][None]     │
│                                 │
│ Defender Rerolls Saves          │
│ [None][Failed][Ones][All]      │
└─────────────────────────────────┘
```

#### Calculate Button

```
┌─────────────────────────────────┐
│    [  Run Simulation (10k)  ]   │
│         ⚡ Calculate            │
└─────────────────────────────────┘
```

### Results Display

#### Summary Statistics Card

```
┌─────────────────────────────────┐
│ 📊 Expected Outcomes            │
├─────────────────────────────────┤
│ Mean Wounds:      3.24          │
│ Median:           3             │
│ Most Common:      3 (28.4%)     │
│ Std Deviation:    1.67          │
├─────────────────────────────────┤
│ Percentiles:                    │
│ 25th:  2 wounds                 │
│ 50th:  3 wounds                 │
│ 75th:  4 wounds                 │
│ 95th:  6 wounds                 │
└─────────────────────────────────┘
```

#### Distribution Chart

- **Type**: Vertical bar chart
- **X-axis**: Number of wounds (0, 1, 2, 3, ...)
- **Y-axis**: Probability (0-100%)
- **Colors**: Gradient based on probability (green for high, yellow for medium, red for low)
- **Interaction**: Hover to see exact percentages
- **Mobile**: Horizontal scroll if needed

#### Probability Table (Optional, below chart)

```
┌─────┬────────────┬────────────────┐
│Wounds│Probability│ Cumulative     │
├─────┼────────────┼────────────────┤
│  0  │   5.2%     │    5.2%        │
│  1  │  12.8%     │   18.0%        │
│  2  │  23.4%     │   41.4%        │
│  3  │  28.4%     │   69.8%        │
│  4  │  18.9%     │   88.7%        │
│  5  │   8.1%     │   96.8%        │
│  6+ │   3.2%     │  100.0%        │
└─────┴────────────┴────────────────┘
```

## Input Controls (shadcn/ui Components)

### Number Inputs

- **Component**: shadcn/ui `<Input type="number" />` with custom increment/decrement buttons
- **Validation**: Use destructive variant for error states
- **Styling**: Built-in touch-friendly targets

### Toggle Buttons (Hit value, save value)

- **Component**: shadcn/ui `<ToggleGroup>`
- **Selected State**: Built-in active styling
- **Accessibility**: Full keyboard navigation and ARIA support

### Checkboxes

- **Component**: shadcn/ui `<Checkbox>`
- **Styling**: Accessible, animated checkmark
- **Label**: Integrated with `<Label>` component

### Dropdown Selects

- **Component**: shadcn/ui `<Select>`
- **Styling**: Consistent with design system
- **Mobile**: Optimized for touch interaction

### Charts

- **Component**: shadcn/ui `<ChartContainer>` with Recharts
- **Features**: Responsive, themed, accessible tooltips
- **Types**: Bar charts, line charts with built-in legends

## Responsive Breakpoints

```css
/* Mobile first */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 2rem;
  }
  /* Show inputs in 2-column grid */
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
  /* Side-by-side layout: inputs left, results right */
}

/* Large Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

## Interaction Patterns

### Auto-Calculate vs Manual Calculate

**Decision**: Manual calculate button (better for performance)

- User adjusts parameters
- Clicks "Calculate" to run simulation
- Shows loading spinner during calculation
- Alternative: Debounced auto-calculate (300ms delay)

### Loading States

- Show spinner or skeleton loader during calculation
- Disable inputs during calculation
- Progress bar for very long calculations

### Error States

- Red border on invalid inputs
- Error message below input: "Must be between 2-6"
- Disable calculate button if any errors

### Empty States

- Show placeholder text: "Adjust parameters and click Calculate"
- Gray out results area until first calculation

## Accessibility

### Keyboard Navigation

- Tab through all inputs in logical order
- Enter key submits form
- Arrow keys for number inputs
- Space for checkboxes

### ARIA Labels

```html
<input
  aria-label="Number of attacks"
  aria-describedby="attacks-help"
  aria-invalid="false"
/>
```

### Focus Indicators

- Clear focus outline (blue ring)
- Skip to content link
- Focus trap in modals

### Screen Readers

- Announce calculation results
- Label all form controls
- Provide text alternatives for charts

## Animation & Feedback

### Micro-interactions

- Button hover: slight scale (1.02x)
- Button click: press effect
- Toggle: smooth transition (200ms)
- Chart bars: animate on load (stagger)

### Success Feedback

- Brief green flash on calculate button
- Fade in results
- Confetti for perfect scenarios? (optional, fun)

## Future UI Enhancements (Post-V1)

- Dark mode toggle
- Preset scenarios dropdown ("Knight vs Knight", etc.)
- Compare mode (2 scenarios side-by-side)
- Export results as image
- Tooltips explaining game terms
- Animated combat sequence visualization
- Color-blind friendly mode
