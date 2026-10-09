// ─── Geometry ───────────────────────────────────────────────
export interface Coord {
  x: number;
  y: number;
}

// ─── Domain Models ──────────────────────────────────────────
export interface Customer {
  id: string;
  label: string;
  position: Coord;
  demand: number;
  timeWindow: [number, number]; // earliest, latest
  priority: 'low' | 'medium' | 'high';
}

export interface Depot {
  id: string;
  label: string;
  position: Coord;
}

export interface Vehicle {
  id: string;
  label: string;
  capacity: number;
  speed: number; // km/h
  color: string;
  icon: 'truck' | 'van' | 'bike';
}

export interface RouteSegment {
  from: Coord;
  to: Coord;
}

export interface Route {
  vehicleId: string;
  stops: string[]; // customer IDs in order
  segments: RouteSegment[];
  totalDistance: number;
  totalDemand: number;
  utilization: number; // 0-1
}

// ─── City Grid ──────────────────────────────────────────────
export interface CityBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'residential' | 'commercial' | 'industrial' | 'park';
}

export interface Road {
  from: Coord;
  to: Coord;
  type: 'major' | 'minor';
}

// ─── Optimization ───────────────────────────────────────────
export type OptimizationPhase =
  | 'idle'
  | 'initializing'
  | 'parsing-demand'
  | 'building-graph'
  | 'computing-routes'
  | 'optimizing'
  | 'assigning-vehicles'
  | 'finalizing'
  | 'complete'
  | 'error';

export interface LogEntry {
  timestamp: number;
  phase: OptimizationPhase;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface OptimizationState {
  phase: OptimizationPhase;
  progress: number; // 0-100
  logs: LogEntry[];
  startTime: number | null;
  endTime: number | null;
}

// ─── Fleet Metrics ──────────────────────────────────────────
export interface FleetMetrics {
  totalDistance: number;
  totalCustomers: number;
  servedCustomers: number;
  avgUtilization: number;
  totalDemand: number;
  vehiclesUsed: number;
  estimatedTime: number; // minutes
}

// ─── App State ──────────────────────────────────────────────
export interface AppState {
  customers: Customer[];
  depot: Depot;
  vehicles: Vehicle[];
  routes: Route[];
  metrics: FleetMetrics;
  optimization: OptimizationState;
  selectedCustomerId: string | null;
  selectedVehicleId: string | null;
  hoveredRouteVehicleId: string | null;
}
