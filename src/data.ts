import type { Customer, Depot, Vehicle, CityBlock, Road, Coord } from './types';

// ─── Color Palette for Vehicles ─────────────────────────────
// Carefully chosen for accessibility + visual differentiation on dark bg
export const VEHICLE_COLORS = [
  '#4FC3F7', // Sky blue
  '#FF8A65', // Warm coral  
  '#AED581', // Soft green
  '#CE93D8', // Lavender
  '#FFD54F', // Amber gold
] as const;

// ─── Depot ──────────────────────────────────────────────────
export const depot: Depot = {
  id: 'depot-0',
  label: 'Central Depot',
  position: { x: 400, y: 350 },
};

// ─── Customers ──────────────────────────────────────────────
export const customers: Customer[] = [
  { id: 'c1',  label: 'Apex Tower',       position: { x: 150, y: 100 }, demand: 4, timeWindow: [8, 10],  priority: 'high' },
  { id: 'c2',  label: 'Bay Street Hub',   position: { x: 280, y: 80 },  demand: 2, timeWindow: [8, 12],  priority: 'medium' },
  { id: 'c3',  label: 'Cedar Mall',       position: { x: 550, y: 120 }, demand: 6, timeWindow: [9, 11],  priority: 'high' },
  { id: 'c4',  label: 'Dock Warehouse',   position: { x: 680, y: 200 }, demand: 3, timeWindow: [8, 14],  priority: 'low' },
  { id: 'c5',  label: 'Elm Residence',    position: { x: 120, y: 300 }, demand: 1, timeWindow: [10, 14], priority: 'low' },
  { id: 'c6',  label: 'Forge Industrial', position: { x: 650, y: 350 }, demand: 5, timeWindow: [7, 11],  priority: 'high' },
  { id: 'c7',  label: 'Grand Plaza',      position: { x: 300, y: 250 }, demand: 2, timeWindow: [9, 13],  priority: 'medium' },
  { id: 'c8',  label: 'Harbor Point',     position: { x: 500, y: 500 }, demand: 4, timeWindow: [8, 12],  priority: 'high' },
  { id: 'c9',  label: 'Ivy Lane',         position: { x: 180, y: 480 }, demand: 3, timeWindow: [11, 15], priority: 'medium' },
  { id: 'c10', label: 'Junction Depot',   position: { x: 600, y: 550 }, demand: 2, timeWindow: [9, 13],  priority: 'low' },
  { id: 'c11', label: 'King Mart',        position: { x: 350, y: 520 }, demand: 5, timeWindow: [8, 10],  priority: 'high' },
  { id: 'c12', label: 'Lake View',        position: { x: 100, y: 550 }, demand: 1, timeWindow: [10, 16], priority: 'low' },
];

// ─── Vehicles ───────────────────────────────────────────────
export const vehicles: Vehicle[] = [
  { id: 'v1', label: 'Alpha-01',  capacity: 12, speed: 45, color: VEHICLE_COLORS[0], icon: 'truck' },
  { id: 'v2', label: 'Bravo-02',  capacity: 10, speed: 50, color: VEHICLE_COLORS[1], icon: 'truck' },
  { id: 'v3', label: 'Charlie-03', capacity: 10, speed: 55, color: VEHICLE_COLORS[2], icon: 'van' },
  { id: 'v4', label: 'Delta-04',  capacity: 15, speed: 40, color: VEHICLE_COLORS[3], icon: 'truck' },
  { id: 'v5', label: 'Echo-05',   capacity: 6,  speed: 60, color: VEHICLE_COLORS[4], icon: 'bike' },
];

// ─── City Grid: Blocks ──────────────────────────────────────
export const cityBlocks: CityBlock[] = [
  // Row 1
  { x: 60,  y: 50,  w: 120, h: 80,  type: 'commercial' },
  { x: 220, y: 50,  w: 100, h: 60,  type: 'residential' },
  { x: 360, y: 40,  w: 140, h: 90,  type: 'commercial' },
  { x: 540, y: 50,  w: 130, h: 100, type: 'industrial' },
  // Row 2
  { x: 60,  y: 180, w: 100, h: 120, type: 'residential' },
  { x: 200, y: 170, w: 160, h: 100, type: 'park' },
  { x: 400, y: 180, w: 110, h: 130, type: 'commercial' },
  { x: 560, y: 180, w: 140, h: 110, type: 'industrial' },
  // Row 3
  { x: 60,  y: 350, w: 140, h: 100, type: 'residential' },
  { x: 240, y: 340, w: 120, h: 120, type: 'commercial' },
  { x: 420, y: 350, w: 100, h: 100, type: 'park' },
  { x: 560, y: 340, w: 150, h: 130, type: 'industrial' },
  // Row 4
  { x: 60,  y: 490, w: 130, h: 90,  type: 'residential' },
  { x: 230, y: 480, w: 160, h: 100, type: 'commercial' },
  { x: 440, y: 470, w: 120, h: 110, type: 'residential' },
  { x: 580, y: 490, w: 130, h: 90,  type: 'industrial' },
];

// ─── City Grid: Roads ───────────────────────────────────────
function road(x1: number, y1: number, x2: number, y2: number, type: 'major' | 'minor' = 'minor'): Road {
  return { from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, type };
}

export const roads: Road[] = [
  // Major horizontal arteries
  road(30, 150, 750, 150, 'major'),
  road(30, 320, 750, 320, 'major'),
  road(30, 470, 750, 470, 'major'),
  // Major vertical arteries
  road(200, 20, 200, 620, 'major'),
  road(400, 20, 400, 620, 'major'),
  road(550, 20, 550, 620, 'major'),
  // Minor roads horizontal
  road(50, 50, 730, 50, 'minor'),
  road(50, 230, 730, 230, 'minor'),
  road(50, 390, 730, 390, 'minor'),
  road(50, 570, 730, 570, 'minor'),
  // Minor roads vertical
  road(100, 30, 100, 600, 'minor'),
  road(310, 30, 310, 600, 'minor'),
  road(480, 30, 480, 600, 'minor'),
  road(660, 30, 660, 600, 'minor'),
];

// ─── Utility ────────────────────────────────────────────────
export function distance(a: Coord, b: Coord): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Generate a path that follows roads (simplified: route via nearest road intersection) */
export function routeThrough(from: Coord, to: Coord): Coord[] {
  // Simple L-shaped routing via the road grid for a clean vector look
  const midX = to.x;
  const midY = from.y;
  return [from, { x: midX, y: midY }, to];
}
