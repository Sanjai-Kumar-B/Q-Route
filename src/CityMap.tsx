import { useMemo } from 'react';
import type { Customer, Depot, Vehicle, Route, CityBlock, Road, Coord } from './types';

interface CityMapProps {
  blocks: CityBlock[];
  roads: Road[];
  depot: Depot;
  customers: Customer[];
  vehicles: Vehicle[];
  routes: Route[];
  selectedCustomerId: string | null;
  selectedVehicleId: string | null;
  onSelectCustomer: (id: string | null) => void;
  onSelectVehicle: (id: string | null) => void;
}

// ─── SVG Viewbox Config ─────────────────────────────────────
const VB_X = 0;
const VB_Y = 0;
const VB_W = 780;
const VB_H = 640;

// ─── Route Path Builder ─────────────────────────────────────
function buildRoutePath(segments: Route['segments']): string {
  if (segments.length === 0) return '';
  
  const points: Coord[] = [];
  points.push(segments[0].from);
  
  for (const seg of segments) {
    // L-shaped routing through the grid for a vector-art feel
    const midX = seg.to.x;
    const midY = seg.from.y;
    // Only add intermediate point if it creates an actual turn
    if (Math.abs(seg.from.x - seg.to.x) > 5 && Math.abs(seg.from.y - seg.to.y) > 5) {
      points.push({ x: midX, y: midY });
    }
    points.push(seg.to);
  }

  // Build SVG path with rounded corners
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

// ─── Determine Highlight State ──────────────────────────────
function getRouteState(
  route: Route,
  selectedCustomerId: string | null,
  selectedVehicleId: string | null
): 'normal' | 'highlighted' | 'dimmed' {
  const hasSelection = selectedCustomerId !== null || selectedVehicleId !== null;
  if (!hasSelection) return 'normal';

  if (selectedVehicleId && route.vehicleId === selectedVehicleId) return 'highlighted';
  if (selectedCustomerId && route.stops.includes(selectedCustomerId)) return 'highlighted';
  
  return 'dimmed';
}

function getNodeState(
  customerId: string,
  routes: Route[],
  selectedCustomerId: string | null,
  selectedVehicleId: string | null
): 'normal' | 'highlighted' | 'dimmed' {
  const hasSelection = selectedCustomerId !== null || selectedVehicleId !== null;
  if (!hasSelection) return 'normal';
  if (selectedCustomerId === customerId) return 'highlighted';

  if (selectedVehicleId) {
    const vehicleRoute = routes.find(r => r.vehicleId === selectedVehicleId);
    if (vehicleRoute && vehicleRoute.stops.includes(customerId)) return 'highlighted';
    return 'dimmed';
  }

  // If a customer is selected, dim others
  if (selectedCustomerId && selectedCustomerId !== customerId) {
    // But keep same-route customers normal
    const sameRoute = routes.find(r => r.stops.includes(selectedCustomerId!));
    if (sameRoute && sameRoute.stops.includes(customerId)) return 'highlighted';
    return 'dimmed';
  }

  return 'normal';
}

// ─── Component ──────────────────────────────────────────────
export default function CityMap({
  blocks,
  roads,
  depot,
  customers,
  vehicles,
  routes,
  selectedCustomerId,
  selectedVehicleId,
  onSelectCustomer,
  onSelectVehicle,
}: CityMapProps) {
  const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
  
  // Map customer to their assigned vehicle color
  const customerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const route of routes) {
      const vehicle = vehicleMap.get(route.vehicleId);
      if (!vehicle) continue;
      for (const stopId of route.stops) {
        map.set(stopId, vehicle.color);
      }
    }
    return map;
  }, [routes, vehicleMap]);

  return (
    <div className="map-container">
      {/* Overlay: Title */}
      <div className="map-title-overlay">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>City Grid — Vector View</span>
      </div>

      {/* Overlay: Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#fff', opacity: 0.5 }} />
          <span>Customer</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#FFA726', border: '1px solid #FFA726' }} />
          <span>Depot</span>
        </div>
        {routes.length > 0 && vehicles.slice(0, 4).map(v => (
          <div key={v.id} className="legend-item">
            <div className="legend-line" style={{ background: v.color }} />
            <span>{v.label}</span>
          </div>
        ))}
      </div>

      <svg
        className="map-svg"
        viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="rgba(255,255,255,0.04)" />
          </pattern>

          {/* Depot radial glow */}
          <radialGradient id="depot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFA726" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFA726" stopOpacity="0" />
          </radialGradient>

          {/* Route glow filters - one per vehicle color */}
          {vehicles.map(v => (
            <filter key={`glow-${v.id}`} id={`route-glow-${v.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          ))}

          {/* Node highlight glow */}
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>

        {/* Layer 0: Background dot grid */}
        <rect width={VB_W} height={VB_H} fill="url(#grid-dots)" />

        {/* Layer 1: City blocks */}
        <g className="city-blocks">
          {blocks.map((block, i) => (
            <rect
              key={`block-${i}`}
              x={block.x}
              y={block.y}
              width={block.w}
              height={block.h}
              rx="3"
              className={`block-${block.type}`}
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Layer 2: Roads */}
        <g className="roads">
          {roads.map((road, i) => (
            <line
              key={`road-${i}`}
              x1={road.from.x}
              y1={road.from.y}
              x2={road.to.x}
              y2={road.to.y}
              className={`road-${road.type}`}
            />
          ))}
        </g>

        {/* Layer 3: Route glows (subtle under-layer) */}
        <g className="route-glows">
          {routes.map(route => {
            const vehicle = vehicleMap.get(route.vehicleId);
            if (!vehicle || route.segments.length === 0) return null;
            const state = getRouteState(route, selectedCustomerId, selectedVehicleId);
            const path = buildRoutePath(route.segments);
            return (
              <path
                key={`glow-${route.vehicleId}`}
                d={path}
                className={`route-glow ${state}`}
                stroke={vehicle.color}
                filter={`url(#route-glow-${vehicle.id})`}
              />
            );
          })}
        </g>

        {/* Layer 4: Route paths */}
        <g className="route-paths">
          {routes.map(route => {
            const vehicle = vehicleMap.get(route.vehicleId);
            if (!vehicle || route.segments.length === 0) return null;
            const state = getRouteState(route, selectedCustomerId, selectedVehicleId);
            const path = buildRoutePath(route.segments);
            return (
              <path
                key={`route-${route.vehicleId}`}
                d={path}
                className={`route-path ${state}`}
                stroke={vehicle.color}
                style={{ cursor: 'pointer', color: vehicle.color }}
                onClick={() => onSelectVehicle(
                  selectedVehicleId === route.vehicleId ? null : route.vehicleId
                )}
              />
            );
          })}
        </g>

        {/* Layer 5: Depot */}
        <g className="depot-node" transform={`translate(${depot.position.x}, ${depot.position.y})`}>
          {/* Ambient glow */}
          <circle r="40" fill="url(#depot-glow)" />
          
          {/* Diamond shape */}
          <g className="depot-diamond">
            <polygon
              points="0,-12 12,0 0,12 -12,0"
              fill="rgba(255, 167, 38, 0.15)"
              stroke="#FFA726"
              strokeWidth="1.5"
            />
            <polygon
              points="0,-6 6,0 0,6 -6,0"
              fill="#FFA726"
              opacity="0.7"
            />
          </g>
          
          {/* Labels */}
          <text className="depot-label" x="18" y="1" textAnchor="start">
            {depot.label}
          </text>
          <text className="depot-sublabel" x="18" y="12" textAnchor="start">
            HQ
          </text>
        </g>

        {/* Layer 6: Customer nodes */}
        <g className="customer-nodes">
          {customers.map(customer => {
            const nodeState = getNodeState(customer.id, routes, selectedCustomerId, selectedVehicleId);
            const assignedColor = customerColorMap.get(customer.id);
            const isSelected = selectedCustomerId === customer.id;
            const baseColor = assignedColor || 'rgba(255,255,255,0.5)';

            return (
              <g
                key={customer.id}
                className={`customer-node ${isSelected ? 'selected' : ''}`}
                transform={`translate(${customer.position.x}, ${customer.position.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCustomer(isSelected ? null : customer.id);
                }}
                opacity={nodeState === 'dimmed' ? 0.25 : 1}
              >
                {/* Highlight glow for selected */}
                {isSelected && (
                  <circle
                    r="12"
                    fill={baseColor}
                    filter="url(#node-glow)"
                    opacity="0.4"
                  />
                )}

                {/* Outer ring */}
                <circle
                  className="node-ring"
                  r="8"
                  fill="none"
                  stroke={baseColor}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />

                {/* Inner dot */}
                <circle
                  className="node-dot"
                  r={isSelected ? 7 : 4.5}
                  fill={baseColor}
                  opacity={nodeState === 'highlighted' ? 1 : 0.8}
                />

                {/* Priority indicator */}
                {customer.priority === 'high' && (
                  <circle
                    r="2"
                    cx="6"
                    cy="-6"
                    fill="#EF5350"
                    opacity="0.9"
                  />
                )}

                {/* Label */}
                <text
                  className="node-label"
                  x="0"
                  y="-14"
                  textAnchor="middle"
                  opacity={nodeState === 'dimmed' ? 0.4 : 1}
                >
                  {customer.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
