# Technology Stack Summary

## Core Technologies

### Language & Framework

- **TypeScript** - Full type safety throughout the application
- **React** (latest version) - UI framework
- **Vite** (latest version) - Build tool and dev server
- **Node.js** (latest LTS: 20.x or 22.x) - Runtime environment

### UI & Styling

- **shadcn/ui** - Component library (accessible, customizable)
  - Built on Radix UI primitives
  - Styled with Tailwind CSS
  - Components copied into project (full control)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library (included with shadcn/ui)

### Charting

- **shadcn/ui Charts** - Chart components built on Recharts
  - Fully themed with design system
  - Accessible tooltips and legends
  - Responsive by default

### Development Tools

- **Biome** - Fast linter and formatter (replaces ESLint + Prettier)
- **Vitest** - Unit testing framework (Vite-native)
- **TypeScript Compiler** - Type checking

### Deployment

- **Vercel** - Hosting and continuous deployment
- **Git** - Version control

## Why These Choices?

### TypeScript

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete, refactoring, inline docs
- **Self-Documenting**: Interfaces serve as documentation
- **Refactoring Confidence**: Rename symbols safely across codebase

### shadcn/ui

- **Accessible**: Built on Radix UI, WCAG compliant
- **Customizable**: Components are copied into your project
- **Beautiful**: Modern, professional design out of the box
- **TypeScript-First**: Excellent type definitions
- **No Runtime Overhead**: Unlike component libraries that bundle everything

### Biome

- **Unified Toolchain**: Single tool for linting and formatting
- **Blazingly Fast**: Written in Rust, 25x faster than ESLint
- **Zero Config**: Works out of the box with sensible defaults
- **TypeScript Native**: First-class TypeScript support
- **Compatible**: Can migrate from ESLint/Prettier configs

### Vite

- **Fast HMR**: Instant feedback during development
- **Modern**: Native ES modules, optimized builds
- **Simple Config**: Works with TypeScript out of the box
- **Great DX**: Best-in-class developer experience

### Vercel

- **Zero Config**: Deploy with one command
- **Fast CDN**: Global edge network
- **Preview Deployments**: Every PR gets a preview URL
- **Perfect for Vite**: Official Vite deployment support

## File Extensions

- **TypeScript**: `.ts` for logic, `.tsx` for React components
- **Config Files**: `.js` or `.ts` depending on tool support
- **Styles**: `.css` for global styles (Tailwind)

## Project Initialization Command

```bash
# Create Vite + React + TypeScript project
npm create vite@latest unluigi -- --template react-ts

# Navigate to project
cd unluigi

# Install dependencies
npm install

# Install and configure Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install and initialize Biome
npm install -D @biomejs/biome
npx @biomejs/biome init

# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install required shadcn components
npx shadcn-ui@latest add button input card label toggle toggle-group checkbox select chart

# Start dev server
npm run dev
```

## TypeScript Configuration

The project will use strict TypeScript settings:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

## Package.json Scripts (Expected)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "vitest"
  }
}
```

## Dependencies Overview

### Production Dependencies

- `react` - UI library
- `react-dom` - React rendering
- `recharts` - Charting library (via shadcn/ui)
- `class-variance-authority` - shadcn/ui utility
- `clsx` - className utility
- `tailwind-merge` - Tailwind class merging
- `lucide-react` - Icons

### Development Dependencies

- `typescript` - Type system
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM types
- `vite` - Build tool
- `@vitejs/plugin-react` - Vite React plugin
- `tailwindcss` - CSS framework
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixes
- `@biomejs/biome` - Linting and formatting
- `vitest` - Testing framework

## Version Targets (as of Dec 2024)

- Node.js: 20.x LTS or 22.x
- React: 18.x
- TypeScript: 5.x
- Vite: 5.x
- Tailwind CSS: 3.x

All packages should be installed with `@latest` to get the most recent stable versions.
