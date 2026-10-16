import React, { useState } from 'react';
import { HUBS, LINES, ALL_LINES, ROAD_EDGES } from '../data/network.js';

const BLOCK_REASONS = [
  { key: 'heavy_rain', label: 'Heavy Rain / Waterlogging', icon: '🌧️' },
  { key: 'road_block', label: 'Road Block', icon: '🚧' },
  { key: 'construction', label: 'Construction', icon: '🏗️' },
  { key: 'protest', label: 'Protest / Rally', icon: '🪧' },
];

const DELAY_REASONS = [
  { key: 'heavy_traffic', label: 'Heavy Traffic', icon: '🚗' },
  { key: 'vip_protocol', label: 'VIP Protocol', icon: '🚔' },
  { key: 'light_rain', label: 'Light Rain', icon: '🌦️' },
];

export default function AdminPortal({
  isLoggedIn,
  onLogin,
  onLogout,
  onResetData,
  landmarks,
  onSaveLandmark,
  fareConfig,
  onUpdateFareConfig,
  scenario,
  onUpdateScenario,
  auditLog,
}) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' | 'landmarks' | 'fares' | 'audit'

  // Dispatcher filters (MUST be declared before any conditional return!)
  const [lineFilter, setLineFilter] = useState('all'); // 'all' | 'metro_bus' | 'leguna_walk' | 'rickshaw_cng' | 'disrupted'
  const [lineSearch, setLineSearch] = useState('');

  // Landmark editor state
  const [selectedHub, setSelectedHub] = useState('dhanmondi');
  const [hubEn, setHubEn] = useState(landmarks['dhanmondi']?.en || '');
  const [hubBn, setHubBn] = useState(landmarks['dhanmondi']?.bn || '');
  const [landmarkSavedToast, setLandmarkSavedToast] = useState(false);

  // Fare editor state
  const [fares, setFares] = useState(fareConfig);
  const [fareSavedToast, setFareSavedToast] = useState(false);

  // Sync landmark inputs when selectedHub changes
  const handleHubSelect = (hubId) => {
    setSelectedHub(hubId);
    setHubEn(landmarks[hubId]?.en || '');
    setHubBn(landmarks[hubId]?.bn || '');
  };

  const handleSaveLandmark = (e) => {
    e.preventDefault();
    onSaveLandmark(selectedHub, hubEn, hubBn);
    setLandmarkSavedToast(true);
    setTimeout(() => setLandmarkSavedToast(false), 3000);
  };

  const handleSaveFares = (e) => {
    e.preventDefault();
    onUpdateFareConfig(fares);
    setFareSavedToast(true);
    setTimeout(() => setFareSavedToast(false), 3000);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (
      username.trim().toLowerCase() === 'admin' &&
      (password === 'admin123' || password === 'demo' || password === 'admin')
    ) {
      onLogin();
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Demo: admin / admin123');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-wrapper">
        <div className="card-elevated login-card">
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text"
                className="styled-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                className="styled-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {loginError && <div className="error-banner">{loginError}</div>}

            <button type="submit" className="btn-primary full-width" style={{ marginTop: '8px' }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handlers for Road Dispatcher
  const handleApplyBlock = (pairKey, reasonKey, reasonLabel) => {
    const nextEdgeStatuses = {
      ...(scenario.edgeStatuses || {}),
      [pairKey]: {
        status: 'blocked',
        reason: reasonKey,
        reasonLabel,
        updatedAt: Date.now(),
      },
    };
    const nextBlockedEdges = [...new Set([...(scenario.blockedEdges || []), pairKey])];
    const nextDisabledEdges = [...new Set([...(scenario.disabledEdges || []), pairKey])];
    onUpdateScenario({
      ...scenario,
      blockedHubs: scenario.blockedHubs || [],
      edgeStatuses: nextEdgeStatuses,
      blockedEdges: nextBlockedEdges,
      disabledEdges: nextDisabledEdges,
    });
  };

  const handleApplyDelay = (pairKey, delayReasonKey, delayReasonLabel, delayMin, priceSurge) => {
    const nextEdgeStatuses = {
      ...(scenario.edgeStatuses || {}),
      [pairKey]: {
        status: 'delayed',
        reason: delayReasonKey,
        reasonLabel: delayReasonLabel,
        delayMin: Number(delayMin),
        priceSurge: Number(priceSurge) || 0,
        updatedAt: Date.now(),
      },
    };
    const nextBlockedEdges = (scenario.blockedEdges || []).filter((k) => k !== pairKey);
    const nextDisabledEdges = (scenario.disabledEdges || []).filter((k) => k !== pairKey);
    onUpdateScenario({
      ...scenario,
      edgeStatuses: nextEdgeStatuses,
      blockedEdges: nextBlockedEdges,
      disabledEdges: nextDisabledEdges,
    });
  };

  const handleClearRoad = (pairKey) => {
    const nextEdgeStatuses = { ...(scenario.edgeStatuses || {}) };
    delete nextEdgeStatuses[pairKey];
    const nextBlockedEdges = (scenario.blockedEdges || []).filter((k) => k !== pairKey);
    const nextDisabledEdges = (scenario.disabledEdges || []).filter((k) => k !== pairKey);
    onUpdateScenario({
      ...scenario,
      edgeStatuses: nextEdgeStatuses,
      blockedEdges: nextBlockedEdges,
      disabledEdges: nextDisabledEdges,
    });
  };

  const handleClearAllDisruptions = () => {
    onUpdateScenario({
      ...scenario,
      edgeStatuses: {},
      blockedEdges: [],
      disabledEdges: [],
      lineStatuses: {},
      disabledLines: [],
      blockedHubs: [],
      trafficSegments: [],
    });
  };

  // Compute status counts for 17 direct road edges
  const edgeStatusMap = scenario?.edgeStatuses || {};
  const blockedCount = ROAD_EDGES.filter((r) => edgeStatusMap[r.pairKey]?.status === 'blocked').length;
  const delayedCount = ROAD_EDGES.filter((r) => edgeStatusMap[r.pairKey]?.status === 'delayed').length;
  const normalCount = ROAD_EDGES.length - blockedCount - delayedCount;

  // Filtered roads list
  const filteredRoads = ROAD_EDGES.filter((road) => {
    const st = edgeStatusMap[road.pairKey]?.status || 'normal';
    if (lineFilter === 'metro_bus' && !road.modes.some((m) => ['metro', 'bus'].includes(m))) return false;
    if (lineFilter === 'rickshaw_cng' && !road.modes.some((m) => ['rickshaw', 'cng'].includes(m))) return false;
    if (lineFilter === 'leguna_walk' && !road.modes.some((m) => ['leguna', 'walking'].includes(m))) return false;
    if (lineFilter === 'disrupted' && st === 'normal') return false;

    if (lineSearch.trim()) {
      const q = lineSearch.toLowerCase();
      const matchText = `${road.id} ${road.name} ${road.fromName} ${road.toName} ${road.modes.join(' ')}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="admin-portal-container">
      {/* ADMIN HEADER */}
      <div className="admin-top-bar">
        <div>
          <h2>🛡️ Transit Authority Admin Console</h2>
          <span className="muted small">Direct Network Status, Fare Control & Roadblock Dispatcher</span>
        </div>
        <div className="admin-top-actions">
          <button
            type="button"
            className="btn-danger-ghost small"
            onClick={onResetData}
            title="Reset alerts, fares and landmarks to factory default seed data"
          >
            🔄 Reset Demo Data
          </button>
          <button
            type="button"
            className="btn-secondary small"
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* ADMIN NAV TABS */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🚦 17 Road Connections Dispatcher
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'landmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('landmarks')}
        >
          📍 Landmark Notes CMS
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'fares' ? 'active' : ''}`}
          onClick={() => setActiveTab('fares')}
        >
          💰 Fares & Fuel Slider
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Trail ({auditLog.length})
        </button>
      </div>

      {/* TAB 1: 17 DIRECT ROAD CONNECTIONS BLOCK & DELAY DISPATCHER */}
      {activeTab === 'routes' && (
        <div className="admin-section">
          <div className="section-intro">
            <h3>Live Road Network Dispatcher (All 17 Direct Connections)</h3>
            <p className="muted small">
              Manage road status directly on all 17 direct connections. Mark any road as <b>Block</b> (completely cuts the road and triggers automatic commuter detours) or <b>Delay</b> (adds travel time delays and allowable fare surges for Rickshaws & CNGs, strictly locked for Metro & Buses).
            </p>
          </div>

          {/* NETWORK STATUS BAR */}
          <div className="dispatcher-metrics-card">
            <div className="metrics-summary">
              <span className="metric-chip total">Total Roads: <b>17</b></span>
              <span className="metric-chip normal">🟢 Normal Flow: <b>{normalCount}</b></span>
              <span className="metric-chip blocked">⛔ Blocked: <b>{blockedCount}</b></span>
              <span className="metric-chip delayed">⏱️ Delayed: <b>{delayedCount}</b></span>
            </div>

            {(blockedCount > 0 || delayedCount > 0) && (
              <button
                type="button"
                className="btn-reset-disruptions"
                onClick={handleClearAllDisruptions}
              >
                🔄 Clear All Network Disruptions
              </button>
            )}
          </div>

          {/* FILTER & SEARCH CONTROLS */}
          <div className="dispatcher-toolbar">
            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${lineFilter === 'all' ? 'active' : ''}`}
                onClick={() => setLineFilter('all')}
              >
                All 17 Roads (17)
              </button>
              <button
                type="button"
                className={`filter-pill ${lineFilter === 'metro_bus' ? 'active' : ''}`}
                onClick={() => setLineFilter('metro_bus')}
              >
                Metro & Bus
              </button>
              <button
                type="button"
                className={`filter-pill ${lineFilter === 'rickshaw_cng' ? 'active' : ''}`}
                onClick={() => setLineFilter('rickshaw_cng')}
              >
                Rickshaw & CNG
              </button>
              <button
                type="button"
                className={`filter-pill ${lineFilter === 'leguna_walk' ? 'active' : ''}`}
                onClick={() => setLineFilter('leguna_walk')}
              >
                Leguna & Walking
              </button>
              <button
                type="button"
                className={`filter-pill ${lineFilter === 'disrupted' ? 'active alert' : ''}`}
                onClick={() => setLineFilter('disrupted')}
              >
                Disrupted ({blockedCount + delayedCount})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search road by location (e.g. Farmgate, Mohakhali)..."
              value={lineSearch}
              onChange={(e) => setLineSearch(e.target.value)}
              className="styled-search-input"
            />
          </div>

          {/* ACTIVE BROADCAST SUMMARY */}
          <div className="admin-status-box" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ fontWeight: 800, color: '#3b82f6', marginBottom: '4px' }}>
              📡 Live Commuter Broadcast Status:
            </div>
            <div style={{ fontSize: '13px' }}>
              • <b>Blocked Roads ({blockedCount}):</b> {
                blockedCount > 0
                  ? ROAD_EDGES.filter((r) => edgeStatusMap[r.pairKey]?.status === 'blocked')
                      .map((r) => `${r.name} (${edgeStatusMap[r.pairKey].reasonLabel || 'Blocked'})`)
                      .join(', ')
                  : 'None (All 17 direct roads open & clear)'
              }
              <br />
              • <b>Delayed Roads ({delayedCount}):</b> {
                delayedCount > 0
                  ? ROAD_EDGES.filter((r) => edgeStatusMap[r.pairKey]?.status === 'delayed')
                      .map((r) => {
                        const es = edgeStatusMap[r.pairKey];
                        return `${r.name} (+${es.delayMin}m, ${es.reasonLabel || 'Traffic'}${es.priceSurge ? `, +৳${es.priceSurge} surge` : ''})`;
                      })
                      .join('; ')
                  : 'None (Normal transit travel times)'
              }
              <br />
              • <b>Fare Truth Rule:</b> Price surges strictly apply to Rickshaw & CNG connectors only. MRT-6 and Local Bus fares remain 100% fixed by BRTA/DMTCL regulations.
            </div>
          </div>

          {/* 17 ROADS DISPATCHER CARDS LIST */}
          <div className="lines-dispatcher-grid">
            {filteredRoads.map((road) => (
              <RoadDispatcherCard
                key={road.id}
                road={road}
                statusObj={edgeStatusMap[road.pairKey]}
                blockReasons={BLOCK_REASONS}
                delayReasons={DELAY_REASONS}
                onApplyBlock={handleApplyBlock}
                onApplyDelay={handleApplyDelay}
                onClear={handleClearRoad}
              />
            ))}
            {filteredRoads.length === 0 && (
              <div className="empty-results-box muted">
                No road connections match current filter "{lineFilter}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LANDMARKS CMS */}
      {activeTab === 'landmarks' && (
        <div className="admin-section">
          <div className="section-intro">
            <h3>Boarding Landmark Guidance Notes CMS</h3>
            <p className="muted small">
              Commuters rely on precise landmarks (e.g. "under pillar 242" or "opposite BSMMU gate"). Changes update commuter directions in real time.
            </p>
          </div>

          <div className="card-elevated">
            <form onSubmit={handleSaveLandmark}>
              <div className="form-group">
                <label>Select Dhaka Transit Hub</label>
                <select
                  value={selectedHub}
                  onChange={(e) => handleHubSelect(e.target.value)}
                  className="styled-select"
                >
                  {HUBS.map((h) => (
                    <option key={h.hubId} value={h.hubId}>
                      {h.name} ({h.hubId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Official Landmark Note (English)</label>
                <input
                  type="text"
                  className="styled-input"
                  value={hubEn}
                  onChange={(e) => setHubEn(e.target.value)}
                  placeholder="e.g. Board B4 at the Dhanmondi 27 signal, west side near Star Kabab"
                />
              </div>

              <div className="form-group">
                <label>Commuter Guidance Note (Banglish)</label>
                <input
                  type="text"
                  className="styled-input"
                  value={hubBn}
                  onChange={(e) => setHubBn(e.target.value)}
                  placeholder="e.g. Dhanmondi 27 signal er west pash theke B4 e uthun"
                />
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn-primary">
                  💾 Save & Broadcast Landmark
                </button>
                {landmarkSavedToast && (
                  <span className="success-toast">✓ Landmark updated live for all commuters!</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: FARE REGULATION & FUEL SLIDER */}
      {activeTab === 'fares' && (
        <div className="admin-section">
          <div className="section-intro">
            <h3>Fare Regulation & Fuel Surcharge Controller</h3>
            <p className="muted small">
              Configure BRTA gazetted rates, MRT-6 limits, and adjust the economic fuel price percentage slider.
            </p>
          </div>

          <div className="card-elevated">
            <form onSubmit={handleSaveFares}>
              {/* FUEL SLIDER */}
              <div className="fuel-slider-box">
                <div className="fuel-slider-header">
                  <div>
                    <h4>⛽ Dynamic Fuel Price / Economic Adjustment Slider</h4>
                    <p className="small muted">
                      Simulates national fuel tariff hikes (diesel/octane/CNG). Directly impacts bus, rickshaw, and CNG baseline fares across the system.
                    </p>
                  </div>
                  <div className="fuel-pct-display">
                    {fares.fuelAdjustmentPct > 0
                      ? `+${fares.fuelAdjustmentPct}%`
                      : `${fares.fuelAdjustmentPct}%`}
                  </div>
                </div>

                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="2"
                  value={fares.fuelAdjustmentPct}
                  onChange={(e) =>
                    setFares({ ...fares, fuelAdjustmentPct: Number(e.target.value) })
                  }
                  className="styled-range-slider"
                />
                <div className="slider-ticks">
                  <span>-20% (Subsidized)</span>
                  <span>0% (Gazetted Baseline)</span>
                  <span>+25%</span>
                  <span>+50% (Peak Hike)</span>
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label>Bus Per-KM Rate (৳)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="styled-input"
                    value={fares.busPerKm}
                    onChange={(e) =>
                      setFares({ ...fares, busPerKm: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Bus Minimum Fare (৳)</label>
                  <input
                    type="number"
                    className="styled-input"
                    value={fares.busMinimum}
                    onChange={(e) =>
                      setFares({ ...fares, busMinimum: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>MRT-6 Metro Per-KM (৳)</label>
                  <input
                    type="number"
                    className="styled-input"
                    value={fares.metroPerKm}
                    onChange={(e) =>
                      setFares({ ...fares, metroPerKm: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>MRT-6 Min / Max Cap (৳)</label>
                  <div className="pair-inputs">
                    <input
                      type="number"
                      className="styled-input"
                      value={fares.metroMinimum}
                      onChange={(e) =>
                        setFares({ ...fares, metroMinimum: Number(e.target.value) })
                      }
                      title="Metro Minimum"
                    />
                    <input
                      type="number"
                      className="styled-input"
                      value={fares.metroMaximum}
                      onChange={(e) =>
                        setFares({ ...fares, metroMaximum: Number(e.target.value) })
                      }
                      title="Metro Maximum"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Rickshaw Rate Range (৳/km)</label>
                  <div className="pair-inputs">
                    <input
                      type="number"
                      className="styled-input"
                      value={fares.rickshawLowPerKm}
                      onChange={(e) =>
                        setFares({ ...fares, rickshawLowPerKm: Number(e.target.value) })
                      }
                      title="Rickshaw Low/km"
                    />
                    <input
                      type="number"
                      className="styled-input"
                      value={fares.rickshawHighPerKm}
                      onChange={(e) =>
                        setFares({ ...fares, rickshawHighPerKm: Number(e.target.value) })
                      }
                      title="Rickshaw High/km"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>CNG Rate Range (৳/km)</label>
                  <div className="pair-inputs">
                    <input
                      type="number"
                      className="styled-input"
                      value={fares.cngLowPerKm}
                      onChange={(e) =>
                        setFares({ ...fares, cngLowPerKm: Number(e.target.value) })
                      }
                      title="CNG Low/km"
                    />
                    <input
                      type="number"
                      className="styled-input"
                      value={fares.cngHighPerKm}
                      onChange={(e) =>
                        setFares({ ...fares, cngHighPerKm: Number(e.target.value) })
                      }
                      title="CNG High/km"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn-primary">
                  💾 Update Regulatory Fare Schedule
                </button>
                {fareSavedToast && (
                  <span className="success-toast">✓ Fare configuration updated live!</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="admin-section">
          <div className="section-intro">
            <h3>System Audit Trail</h3>
            <p className="muted small">Chronological record of regulatory and administrative changes.</p>
          </div>

          <div className="card-elevated">
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action Executed</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log) => (
                    <tr key={log.id}>
                      <td className="muted">{log.time}</td>
                      <td><b>{log.actor}</b></td>
                      <td>{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: 17-ROAD DISPATCHER CARD (BLOCK OR DELAY/SURGE)
// -------------------------------------------------------------
function RoadDispatcherCard({
  road,
  statusObj,
  blockReasons,
  delayReasons,
  onApplyBlock,
  onApplyDelay,
  onClear,
}) {
  const isSurgeEligible = road.modes.includes('rickshaw') || road.modes.includes('cng');
  const currentStatus = statusObj?.status || 'normal';

  // Local configuration mode: 'normal' | 'block' | 'delay'
  const [activeTab, setActiveTab] = useState(() => (currentStatus === 'normal' ? 'block' : currentStatus));
  const [blockReason, setBlockReason] = useState(() => statusObj?.reason || 'heavy_rain');
  const [delayReason, setDelayReason] = useState(() => statusObj?.reason || 'heavy_traffic');
  const [delayMin, setDelayMin] = useState(() => statusObj?.delayMin || 10);
  const [priceSurge, setPriceSurge] = useState(() => (isSurgeEligible ? (statusObj?.priceSurge ?? 20) : 0));
  const [toast, setToast] = useState('');

  const DELAY_MINS = [5, 10, 15, 20, 30];
  const SURGE_OPTIONS = [0, 10, 20, 30, 50];

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handlePostBlock = () => {
    const sel = blockReasons.find((r) => r.key === blockReason) || blockReasons[0];
    onApplyBlock(road.pairKey, sel.key, sel.label);
    triggerToast(`⛔ Block Posted: ${road.name} marked unavailable`);
  };

  const handlePostDelay = () => {
    const sel = delayReasons.find((r) => r.key === delayReason) || delayReasons[0];
    const finalSurge = isSurgeEligible ? priceSurge : 0;
    onApplyDelay(road.pairKey, sel.key, sel.label, delayMin, finalSurge);
    triggerToast(`⏱️ Delay Posted: +${delayMin}m on ${road.name}`);
  };

  const handleClear = () => {
    onClear(road.pairKey);
    setActiveTab('block');
    triggerToast(`🟢 Road Cleared: ${road.name} restored to normal`);
  };

  return (
    <div className={`line-dispatcher-card ${currentStatus !== 'normal' ? `status-${currentStatus}` : ''}`}>
      {/* CARD TOP INFO */}
      <div className="line-card-header">
        <div className="line-card-left">
          <span className="line-icon-large">{road.icon}</span>
          <div>
            <div className="line-title-row">
              <span className="line-code-badge">{road.id}</span>
              <span className="line-corridor-name" style={{ fontSize: '15px', fontWeight: 700 }}>
                {road.name}
              </span>
              {road.modes.map((m) => (
                <span key={m} className={`line-mode-badge mode-${m}`}>
                  {m.toUpperCase()}
                </span>
              ))}
            </div>
            <div className="line-subtitle-name muted small">
              Direct connection · {road.km} km · Services: {road.services.join(', ')}
            </div>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="line-card-right">
          {currentStatus === 'blocked' && (
            <span className="badge-line-blocked" title="Road unavailable - Detour active">
              ⛔ Blocked: {statusObj.reasonLabel || 'Road Block'} (Unavailable)
            </span>
          )}
          {currentStatus === 'delayed' && (
            <span className="badge-line-delayed" title="Travel time delay active">
              ⏱️ Delayed: +{statusObj.delayMin}m ({statusObj.reasonLabel || 'Traffic'})
              {statusObj.priceSurge > 0 ? ` · +৳${statusObj.priceSurge} Surge` : ''}
            </span>
          )}
          {currentStatus === 'normal' && (
            <span className="badge-line-normal">
              🟢 Normal Flow
            </span>
          )}
        </div>
      </div>

      {/* ACTION MODE TOGGLES */}
      <div className="line-action-bar">
        <div className="segmented-control">
          <button
            type="button"
            className={`seg-btn ${currentStatus === 'normal' && activeTab !== 'block' && activeTab !== 'delay' ? 'active normal' : ''}`}
            onClick={handleClear}
          >
            🟢 Normal / Clear
          </button>
          <button
            type="button"
            className={`seg-btn ${activeTab === 'block' ? 'active block' : ''}`}
            onClick={() => setActiveTab('block')}
          >
            ⛔ Option 1: Block
          </button>
          <button
            type="button"
            className={`seg-btn ${activeTab === 'delay' ? 'active delay' : ''}`}
            onClick={() => setActiveTab('delay')}
          >
            ⏱️ Option 2: Delay & Surge
          </button>
        </div>

        {currentStatus !== 'normal' && (
          <button
            type="button"
            className="btn-clear-line-inline"
            onClick={handleClear}
            title="Clear road disruptions and restore normal speed and legal fare"
          >
            🔄 Reset to Normal
          </button>
        )}
      </div>

      {/* OPTION 1: BLOCK CONFIG PANEL */}
      {activeTab === 'block' && (
        <div className="line-config-panel block-panel">
          <div className="panel-field-row">
            <span className="field-label">
              Toggle Block Reason <i>(Road becomes completely unavailable; router computes detours)</i>:
            </span>
            <div className="reason-chips-row">
              {blockReasons.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`reason-chip ${blockReason === r.key ? 'active' : ''}`}
                  onClick={() => setBlockReason(r.key)}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-submit-row">
            <button
              type="button"
              className="btn-post-block"
              onClick={handlePostBlock}
            >
              📢 Post Block (Mark Road Unavailable)
            </button>
            {toast && <span className="toast-text success">{toast}</span>}
          </div>
        </div>
      )}

      {/* OPTION 2: DELAY & PRICE SURGE CONFIG PANEL */}
      {activeTab === 'delay' && (
        <div className="line-config-panel delay-panel">
          {/* DELAY REASON */}
          <div className="panel-field-row">
            <span className="field-label">1. Delay Reason:</span>
            <div className="reason-chips-row">
              {delayReasons.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`reason-chip ${delayReason === r.key ? 'active' : ''}`}
                  onClick={() => setDelayReason(r.key)}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* DELAY MINUTES */}
          <div className="panel-field-row">
            <span className="field-label">2. Delay Time:</span>
            <div className="pills-num-row">
              {DELAY_MINS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`num-pill ${delayMin === m ? 'active' : ''}`}
                  onClick={() => setDelayMin(m)}
                >
                  +{m} min
                </button>
              ))}
            </div>
          </div>

          {/* PRICE RISE / SURGE */}
          <div className="panel-field-row">
            <span className="field-label">
              3. Price Rise:
              {isSurgeEligible ? (
                <span className="accent-hint"> (Situational surge for Rickshaw / CNG)</span>
              ) : (
                <span className="locked-hint"> (Strictly locked on MRT & Bus per BRTA/DMTCL rules)</span>
              )}
            </span>

            {isSurgeEligible ? (
              <div className="pills-num-row">
                {SURGE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`num-pill surge ${priceSurge === s ? 'active' : ''}`}
                    onClick={() => setPriceSurge(s)}
                  >
                    {s === 0 ? 'No Surge (+৳0)' : `+৳${s}`}
                  </button>
                ))}
              </div>
            ) : (
              <div className="fixed-fare-pill-locked">
                <span>🔒 ৳0 Fixed Fare</span>
                <span className="locked-detail">
                  BRTA & DMTCL regulations legally prohibit fare surcharges on Metro Rail and Local Buses. Fares remain baseline.
                </span>
              </div>
            )}
          </div>

          <div className="panel-submit-row">
            <button
              type="button"
              className="btn-post-delay"
              onClick={handlePostDelay}
            >
              📢 Post Delay (+{delayMin} min{isSurgeEligible && priceSurge > 0 ? `, +৳${priceSurge} surge` : ''})
            </button>
            {toast && <span className="toast-text success">{toast}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
