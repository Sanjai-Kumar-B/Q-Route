# Q-Route — Vehicle Route Optimization Dashboard

An aerospace-grade fleet telemetry and vehicle route optimization control dashboard for urban logistics networks.

![Q-Route Dashboard](public/favicon.svg)

## Features

- **Aerospace Telemetry UI**: Dark-mode mission control interface with high-contrast vector visuals and JetBrains Mono monospace telemetry.
- **Dynamic City Grid & Vector Routing**: Multi-layer SVG map featuring zoning parcels (commercial, residential, industrial, parks) and arterial road networks.
- **Spatial Sector Sweep Optimization**: Multi-vehicle heuristics (nearest-neighbor sweep + 2-opt local search) that balance fleet capacity and prevent route intersections.
- **Simulated 7-Phase Solver Workflow**: Real-time solver progression (`Initializing` → `Parsing Demand` → `Building Graph` → `Computing Routes` → `Optimizing` → `Assigning Vehicles` → `Finalizing`) with live telemetry logs and auto-scrolling console.
- **Bi-Directional Interactive Selection**: Cross-highlighting between vehicle manifests, customer waypoints, and active vector trajectories.
- **Responsive Architecture**: Fluid layouts for desktop command centers, laptops, tablets, and mobile devices.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS with custom properties & glassmorphism
- **Linting & Type Checking**: Oxlint & TypeScript strict mode

## Getting Started

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Deploy to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build` (`tsc -b && vite build`).
4. Output Directory: `dist`.
