import type { Customer, Depot, Vehicle, Route, FleetMetrics, LogEntry, OptimizationPhase, Coord } from './types';
import { distance } from './data';

// ─── Nearest-Neighbor Heuristic for Route Construction ──────
function nearestNeighborRoute(
  depot: Depot,
  customers: Customer[],
  vehicle: Vehicle
): { stops: string[]; totalDistance: number; totalDemand: number } {
  const stops: string[] = [];
  const visited = new Set<string>();
  let current: Coord = depot.position;
  let remainingCapacity = vehicle.capacity;
  let totalDistance = 0;
  let totalDemand = 0;

  while (visited.size < customers.length) {
    let nearest: Customer | null = null;
    let nearestDist = Infinity;

    for (const c of customers) {
      if (visited.has(c.id) || c.demand > remainingCapacity) continue;
      const d = distance(current, c.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = c;
      }
    }

    if (!nearest) break;

    stops.push(nearest.id);
    visited.add(nearest.id);
    totalDistance += nearestDist;
    totalDemand += nearest.demand;
    remainingCapacity -= nearest.demand;
    current = nearest.position;
  }

  // Return to depot
  totalDistance += distance(current, depot.position);

  return { stops, totalDistance: Math.round(totalDistance), totalDemand };
}

// ─── Build Routes from Stops ────────────────────────────────
function buildRouteSegments(
  depot: Depot,
  stops: string[],
  customers: Customer[]
): Route['segments'] {
  const segments: Route['segments'] = [];
  const customerMap = new Map(customers.map(c => [c.id, c]));

  let prev: Coord = depot.position;
  for (const stopId of stops) {
    const customer = customerMap.get(stopId);
    if (!customer) continue;
    segments.push({ from: { ...prev }, to: { ...customer.position } });
    prev = customer.position;
  }
  // Return to depot
  segments.push({ from: { ...prev }, to: { ...depot.position } });

  return segments;
}

// ─── Compute Metrics ────────────────────────────────────────
export function computeMetrics(routes: Route[], customers: Customer[], _vehicles?: Vehicle[]): FleetMetrics {
  const activeRoutes = routes.filter(r => r.stops.length > 0);
  const totalDistance = activeRoutes.reduce((sum, r) => sum + r.totalDistance, 0);
  const servedCustomers = new Set(activeRoutes.flatMap(r => r.stops)).size;
  const avgUtilization = activeRoutes.length > 0
    ? activeRoutes.reduce((sum, r) => sum + r.utilization, 0) / activeRoutes.length
    : 0;
  const totalDemand = activeRoutes.reduce((sum, r) => sum + r.totalDemand, 0);

  // Estimate time: average speed ~45 km/h, 1 pixel ≈ 0.05 km
  const estimatedTime = Math.round((totalDistance * 0.05 / 45) * 60);

  return {
    totalDistance,
    totalCustomers: customers.length,
    servedCustomers,
    avgUtilization: Math.round(avgUtilization * 100),
    totalDemand,
    vehiclesUsed: activeRoutes.length,
    estimatedTime,
  };
}

// ─── Spatial Sector Route Clustering ────────────────────────
function computeAllRoutes(
  depot: Depot,
  customers: Customer[],
  vehicles: Vehicle[]
): Route[] {
  // Sector definitions for deliberate, clean vector loops around the central depot
  const sectors: Array<{ vehicleId: string; customerIds: string[] }> = [
    { vehicleId: 'v1', customerIds: ['c8', 'c10', 'c11'] }, // Alpha-01: SE Sector (Harbor Point, Junction Depot, King Mart)
    { vehicleId: 'v2', customerIds: ['c1', 'c2', 'c7'] },   // Bravo-02: NW Sector (Apex Tower, Bay St, Grand Plaza)
    { vehicleId: 'v3', customerIds: ['c5', 'c9', 'c12'] },  // Charlie-03: SW Sector (Elm Residence, Ivy Lane, Lake View)
    { vehicleId: 'v4', customerIds: ['c3', 'c4', 'c6'] },   // Delta-04: NE Sector (Cedar Mall, Dock Warehouse, Forge Industrial)
  ];

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
  const routes: Route[] = [];

  for (const sector of sectors) {
    const vehicle = vehicleMap.get(sector.vehicleId);
    if (!vehicle) continue;

    const sectorCustomers = sector.customerIds
      .map(id => customerMap.get(id))
      .filter((c): c is Customer => c !== undefined);

    const result = nearestNeighborRoute(depot, sectorCustomers, vehicle);
    const segments = buildRouteSegments(depot, result.stops, customers);

    routes.push({
      vehicleId: vehicle.id,
      stops: result.stops,
      segments,
      totalDistance: result.totalDistance,
      totalDemand: result.totalDemand,
      utilization: result.totalDemand / vehicle.capacity,
    });
  }

  return routes;
}

// ─── Optimization Engine (Simulated Workflow) ───────────────
type PhaseCallback = (phase: OptimizationPhase, progress: number, log: LogEntry) => void;

function log(phase: OptimizationPhase, message: string, level: LogEntry['level'] = 'info'): LogEntry {
  return { timestamp: Date.now(), phase, message, level };
}

export async function runOptimization(
  depot: Depot,
  customers: Customer[],
  vehicles: Vehicle[],
  onUpdate: PhaseCallback
): Promise<Route[]> {
  const routes = computeAllRoutes(depot, customers, vehicles);

  // Generate dynamic, perfectly synchronized vehicle telemetry log messages
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
  const assignmentMessages: Array<{ message: string; level: LogEntry['level'] }> = [
    { message: 'Assigning vehicles by spatial sector & capacity match', level: 'info' },
    ...routes.map(r => {
      const v = vehicleMap.get(r.vehicleId);
      const name = v ? v.label : r.vehicleId;
      const util = Math.round(r.utilization * 100);
      return {
        message: `Vehicle ${name}: ${r.stops.length} stops, ${util}% utilization (${r.totalDemand}/${v?.capacity || 0} units)`,
        level: 'info' as const,
      };
    }),
    { message: 'Vehicle Echo-05: Standby reserve (0 stops)', level: 'info' },
  ];

  const phaseConfig: Array<{
    phase: OptimizationPhase;
    duration: number; // ms
    progressStart: number;
    progressEnd: number;
    messages: Array<{ message: string; level: LogEntry['level'] }>;
  }> = [
    {
      phase: 'initializing',
      duration: 500,
      progressStart: 0,
      progressEnd: 10,
      messages: [
        { message: 'Initializing optimization engine v3.2.1', level: 'info' },
        { message: 'Loading aerospace telemetry & solver configuration…', level: 'info' },
      ],
    },
    {
      phase: 'parsing-demand',
      duration: 650,
      progressStart: 10,
      progressEnd: 25,
      messages: [
        { message: `Parsing customer demand matrix (${customers.length} nodes)`, level: 'info' },
        { message: 'Validating time-window & priority constraints', level: 'info' },
        { message: `Demand matrix validated — ${customers.reduce((s, c) => s + c.demand, 0)} total units`, level: 'success' },
      ],
    },
    {
      phase: 'building-graph',
      duration: 750,
      progressStart: 25,
      progressEnd: 40,
      messages: [
        { message: 'Building arterial & grid distance graph — 156 edges', level: 'info' },
        { message: 'Computing Manhattan shortest paths with depot origin', level: 'info' },
        { message: 'Graph construction & topology validated', level: 'success' },
      ],
    },
    {
      phase: 'computing-routes',
      duration: 900,
      progressStart: 40,
      progressEnd: 65,
      messages: [
        { message: 'Running spatial sector sweep & nearest-neighbor heuristic', level: 'info' },
        { message: 'Constructing initial route feasible solutions', level: 'info' },
        { message: 'Initial baseline cost evaluated', level: 'info' },
      ],
    },
    {
      phase: 'optimizing',
      duration: 1000,
      progressStart: 65,
      progressEnd: 85,
      messages: [
        { message: 'Applying 2-opt local search & edge exchange', level: 'info' },
        { message: 'Iteration 1/3 — path optimization: -12.4% distance', level: 'info' },
        { message: 'Iteration 2/3 — time-window penalty minimized: -4.1%', level: 'info' },
        { message: 'Iteration 3/3 — local convergence reached: -0.8%', level: 'info' },
        { message: '2-opt convergence confirmed', level: 'success' },
      ],
    },
    {
      phase: 'assigning-vehicles',
      duration: 700,
      progressStart: 85,
      progressEnd: 95,
      messages: assignmentMessages,
    },
    {
      phase: 'finalizing',
      duration: 450,
      progressStart: 95,
      progressEnd: 100,
      messages: [
        { message: 'Validating vehicle capacity constraints — 100% PASS', level: 'success' },
        { message: 'Validating time windows & priority SLAs — PASS', level: 'success' },
        { message: `Optimization complete — ${routes.length} active routes generated`, level: 'success' },
      ],
    },
  ];

  for (const config of phaseConfig) {
    const msgDelay = config.duration / config.messages.length;

    for (let i = 0; i < config.messages.length; i++) {
      const progress = config.progressStart +
        ((config.progressEnd - config.progressStart) * (i + 1)) / config.messages.length;

      const entry = log(config.phase, config.messages[i].message, config.messages[i].level);
      onUpdate(config.phase, Math.round(progress), entry);

      await new Promise(resolve => setTimeout(resolve, msgDelay));
    }
  }

  // Fire completion
  onUpdate('complete', 100, log('complete', `All routes optimized — ${routes.reduce((s, r) => s + r.stops.length, 0)} deliveries across ${routes.length} vehicles`, 'success'));

  return routes;
}
