import { useState, useCallback, useRef, useEffect } from 'react';
import type { Route, OptimizationState, FleetMetrics, LogEntry, OptimizationPhase } from './types';
import { customers, depot, vehicles, cityBlocks, roads } from './data';
import { runOptimization, computeMetrics } from './engine';
import CityMap from './CityMap';

// ─── Initial State ──────────────────────────────────────────
const INITIAL_OPTIMIZATION: OptimizationState = {
  phase: 'idle',
  progress: 0,
  logs: [],
  startTime: null,
  endTime: null,
};

const INITIAL_METRICS: FleetMetrics = {
  totalDistance: 0,
  totalCustomers: customers.length,
  servedCustomers: 0,
  avgUtilization: 0,
  totalDemand: 0,
  vehiclesUsed: 0,
  estimatedTime: 0,
};

// ─── Utility: format time ───────────────────────────────────
function formatLogTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatPhase(phase: OptimizationPhase): string {
  const map: Record<OptimizationPhase, string> = {
    idle: 'Idle',
    initializing: 'Initializing',
    'parsing-demand': 'Parsing Demand',
    'building-graph': 'Building Graph',
    'computing-routes': 'Computing Routes',
    optimizing: 'Optimizing',
    'assigning-vehicles': 'Assigning Vehicles',
    finalizing: 'Finalizing',
    complete: 'Complete',
    error: 'Error',
  };
  return map[phase] || phase;
}

// ─── Clock Hook ─────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-US', { hour12: false });
}

// ─── App ────────────────────────────────────────────────────
export default function App() {
  const [routeState, setRouteState] = useState<Route[]>([]);
  const [optimization, setOptimization] = useState<OptimizationState>(INITIAL_OPTIMIZATION);
  const [metrics, setMetrics] = useState<FleetMetrics>(INITIAL_METRICS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const clock = useClock();

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [optimization.logs]);

  // ─── Optimization Handler ───────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (optimization.phase !== 'idle' && optimization.phase !== 'complete') return;

    // Reset state
    setRouteState([]);
    setSelectedCustomerId(null);
    setSelectedVehicleId(null);
    setMetrics(INITIAL_METRICS);
    setOptimization({
      phase: 'initializing',
      progress: 0,
      logs: [],
      startTime: Date.now(),
      endTime: null,
    });

    try {
      const result = await runOptimization(
        depot,
        customers,
        vehicles,
        (phase: OptimizationPhase, progress: number, log: LogEntry) => {
          setOptimization(prev => ({
            ...prev,
            phase,
            progress,
            logs: [...prev.logs, log],
          }));
        }
      );

      setRouteState(result);
      setMetrics(computeMetrics(result, customers, vehicles));
      setOptimization(prev => ({
        ...prev,
        phase: 'complete',
        progress: 100,
        endTime: Date.now(),
      }));
    } catch {
      setOptimization(prev => ({
        ...prev,
        phase: 'error',
        logs: [
          ...prev.logs,
          { timestamp: Date.now(), phase: 'error', message: 'Optimization failed', level: 'error' },
        ],
      }));
    }
  }, [optimization.phase]);

  // ─── Selection Handlers ─────────────────────────────────
  const handleSelectCustomer = useCallback((id: string | null) => {
    setSelectedCustomerId(id);
    // If selecting a customer, find and highlight its vehicle
    if (id) {
      const route = routeState.find(r => r.stops.includes(id));
      if (route) {
        setSelectedVehicleId(route.vehicleId);
      } else {
        setSelectedVehicleId(null);
      }
    } else {
      setSelectedVehicleId(null);
    }
  }, [routeState]);

  const handleSelectVehicle = useCallback((id: string | null) => {
    setSelectedVehicleId(id);
    setSelectedCustomerId(null);
  }, []);

  // ─── Derived Data ───────────────────────────────────────
  const customerAssignments = new Map<string, { vehicleId: string; color: string; label: string }>();
  for (const route of routeState) {
    const vehicle = vehicles.find(v => v.id === route.vehicleId);
    if (!vehicle) continue;
    for (const stopId of route.stops) {
      customerAssignments.set(stopId, {
        vehicleId: vehicle.id,
        color: vehicle.color,
        label: vehicle.label,
      });
    }
  }

  const isRunning = optimization.phase !== 'idle' && optimization.phase !== 'complete' && optimization.phase !== 'error';
  const isComplete = optimization.phase === 'complete';
  const elapsed = optimization.startTime
    ? ((optimization.endTime || Date.now()) - optimization.startTime) / 1000
    : 0;

  return (
    <div className="app-layout">
      {/* ─── Header ──────────────────────────────────────── */}
      <header className="header-bar">
        <div className="header-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h1>
            <span>Q</span>-Route
          </h1>
        </div>
        <div className="header-status">
          <div className="header-badge">
            <div className="dot" />
            System Online
          </div>
          <div className="header-badge">
            {customers.length} Nodes · {vehicles.length} Vehicles
          </div>
          <div className="header-time">{clock}</div>
        </div>
      </header>

      {/* ─── Left Panel: Fleet Metrics ───────────────────── */}
      <aside className="panel-left">
        <div className="panel-section">
          <div className="panel-title">Fleet Overview</div>
          <div className="metric-grid">
            <div className="metric-card">
              <span className="metric-label">Distance</span>
              <span className="metric-value accent">
                {metrics.totalDistance}<span className="metric-unit">px</span>
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Served</span>
              <span className="metric-value success">
                {metrics.servedCustomers}<span className="metric-unit">/ {metrics.totalCustomers}</span>
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Utilization</span>
              <span className="metric-value">
                {metrics.avgUtilization}<span className="metric-unit">%</span>
              </span>
              <div className="utilization-bar">
                <div
                  className="utilization-fill"
                  style={{
                    width: `${metrics.avgUtilization}%`,
                    background: metrics.avgUtilization > 70
                      ? 'var(--success)'
                      : metrics.avgUtilization > 40
                        ? 'var(--warning)'
                        : 'var(--accent)',
                  }}
                />
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-label">Vehicles</span>
              <span className="metric-value">
                {metrics.vehiclesUsed}<span className="metric-unit">/ {vehicles.length}</span>
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Demand</span>
              <span className="metric-value warning">
                {metrics.totalDemand}<span className="metric-unit">units</span>
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Est. Time</span>
              <span className="metric-value">
                {metrics.estimatedTime}<span className="metric-unit">min</span>
              </span>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-title">Fleet Vehicles</div>
          <div className="vehicle-list">
            {vehicles.map(vehicle => {
              const route = routeState.find(r => r.vehicleId === vehicle.id);
              const stopCount = route ? route.stops.length : 0;
              const isSelected = selectedVehicleId === vehicle.id;

              return (
                <div
                  key={vehicle.id}
                  id={`vehicle-item-${vehicle.id}`}
                  className={`vehicle-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectVehicle(isSelected ? null : vehicle.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectVehicle(isSelected ? null : vehicle.id);
                    }
                  }}
                  aria-pressed={isSelected}
                >
                  <div className="vehicle-color-dot" style={{ background: vehicle.color }} />
                  <div className="vehicle-info">
                    <div className="vehicle-label">{vehicle.label}</div>
                    <div className="vehicle-meta">
                      Cap: {vehicle.capacity} · {vehicle.speed} km/h
                    </div>
                  </div>
                  <div className="vehicle-stops">
                    {stopCount > 0 ? `${stopCount} stops` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ─── Center: City Map ────────────────────────────── */}
      <main className="panel-center">
        <CityMap
          blocks={cityBlocks}
          roads={roads}
          depot={depot}
          customers={customers}
          vehicles={vehicles}
          routes={routeState}
          selectedCustomerId={selectedCustomerId}
          selectedVehicleId={selectedVehicleId}
          onSelectCustomer={handleSelectCustomer}
          onSelectVehicle={handleSelectVehicle}
        />
      </main>

      {/* ─── Right Panel: Customers ──────────────────────── */}
      <aside className="panel-right">
        <div className="panel-section">
          <div className="panel-title">Customer Nodes</div>
          <div className="customer-list">
            {customers.map(customer => {
              const assignment = customerAssignments.get(customer.id);
              const isSelected = selectedCustomerId === customer.id;

              return (
                <div
                  key={customer.id}
                  id={`customer-item-${customer.id}`}
                  className={`customer-item ${isSelected ? 'selected' : ''} ${assignment ? 'assigned' : ''}`}
                  style={assignment ? { borderLeftColor: assignment.color } : undefined}
                  onClick={() => handleSelectCustomer(isSelected ? null : customer.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectCustomer(isSelected ? null : customer.id);
                    }
                  }}
                  aria-pressed={isSelected}
                >
                  <div className={`customer-icon priority-${customer.priority}`}>
                    {customer.priority === 'high' ? '!' : customer.priority === 'medium' ? '◆' : '○'}
                  </div>
                  <div className="customer-details">
                    <div className="customer-name">{customer.label}</div>
                    <div className="customer-demand">
                      Demand: {customer.demand} · TW: {customer.timeWindow[0]}:00–{customer.timeWindow[1]}:00
                    </div>
                  </div>
                  {assignment && (
                    <span
                      className="customer-vehicle-tag"
                      style={{
                        background: `${assignment.color}15`,
                        color: assignment.color,
                        border: `1px solid ${assignment.color}30`,
                      }}
                    >
                      {assignment.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ─── Bottom Panel: Optimization Console ──────────── */}
      <div className="panel-bottom">
        <div className="opt-controls">
          <button
            id="opt-run-button"
            className={`opt-button ${isRunning ? 'running' : ''} ${isComplete ? 'complete' : ''}`}
            onClick={handleOptimize}
            disabled={isRunning}
            aria-label={isRunning ? 'Optimizing routes' : isComplete ? 'Re-optimize routes' : 'Run route optimization'}
          >
            {isRunning ? (
              <>
                <div className="spinner" />
                Optimizing…
              </>
            ) : isComplete ? (
              <>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Re-Optimize
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run Optimization
              </>
            )}
          </button>

          <div className="progress-container">
            <div className="progress-bar-wrap">
              <div
                className={`progress-bar-fill ${isComplete ? 'complete' : ''}`}
                style={{ width: `${optimization.progress}%` }}
              />
            </div>
            <div className="progress-meta">
              <span className="progress-phase">{formatPhase(optimization.phase)}</span>
              <span className={`progress-percent ${isComplete ? 'complete' : ''}`}>
                {optimization.progress}%
              </span>
            </div>
          </div>

          <div className="opt-status">
            <div className="opt-stat-row">
              <span className="opt-stat-label">Phase</span>
              <span className="opt-stat-value">{formatPhase(optimization.phase)}</span>
            </div>
            <div className="opt-stat-row">
              <span className="opt-stat-label">Elapsed</span>
              <span className="opt-stat-value">{elapsed.toFixed(1)}s</span>
            </div>
            <div className="opt-stat-row">
              <span className="opt-stat-label">Routes</span>
              <span className="opt-stat-value">{routeState.length}</span>
            </div>
          </div>
        </div>

        <div className="opt-console">
          <div className="console-header">
            <span className="console-title">Optimization Log</span>
            <span className="console-count">{optimization.logs.length} entries</span>
          </div>
          <div className="console-body" ref={consoleRef}>
            {optimization.logs.length === 0 ? (
              <div className="console-empty">
                Press "Run Optimization" to begin route computation
              </div>
            ) : (
              optimization.logs.map((entry, i) => (
                <div key={i} className="log-entry">
                  <span className="log-time">{formatLogTime(entry.timestamp)}</span>
                  <span className={`log-indicator ${entry.level}`} />
                  <span className={`log-message ${entry.level}`}>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
