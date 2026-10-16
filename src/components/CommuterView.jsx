import React, { useState, useMemo } from 'react';
import MapView, { COLORS } from './MapView.jsx';
import FareTruthChecker from './FareTruthChecker.jsx';
import AlertsFeed from './AlertsFeed.jsx';
import NetworkDirectory from './NetworkDirectory.jsx';
import OfflineCardModal from './OfflineCardModal.jsx';
import { HUBS, EDGES } from '../data/network.js';
import { findRoutes, explainChange, routeModes } from '../engine/router.js';

const AVAILABLE_MODES = [
  { id: 'bus', label: 'Local Bus', icon: '🚌' },
  { id: 'metro', label: 'MRT-6 Metro', icon: '🚆' },
  { id: 'leguna', label: 'Leguna', icon: '🚐' },
  { id: 'rickshaw', label: 'Rickshaw', icon: '🛺' },
  { id: 'walking', label: 'Walking', icon: '🚶' },
];

export default function CommuterView({
  origin,
  dest,
  onSetOrigin,
  onSetDest,
  scenario,
  landmarks,
  alerts,
  onAddAlert,
  onConfirmAlert,
  fareConfig,
  rushHour,
  onUpdateScenario,
}) {
  const [activeSubTab, setActiveSubTab] = useState('planner'); // 'planner' | 'fare-truth' | 'alerts' | 'network'
  const [goal, setGoal] = useState('fastest'); // 'fastest' | 'cheapest' | 'balanced' | 'all'
  const [viewBackup, setViewBackup] = useState(false);
  const [student, setStudent] = useState(false);
  const [budget, setBudget] = useState('');
  const [maxTransfers, setMaxTransfers] = useState(3);
  const [departTime, setDepartTime] = useState('');
  const [avoidHub, setAvoidHub] = useState('');
  const [allowedModes, setAllowedModes] = useState(['bus', 'metro', 'leguna', 'rickshaw', 'walking']);
  const [singleModeOnly, setSingleModeOnly] = useState(false);
  const [allowDetours, setAllowDetours] = useState(true);
  const [nlQuery, setNlQuery] = useState('');
  const [landmarkLang, setLandmarkLang] = useState('en'); // 'en' | 'bn'
  const [isWatchingTrip, setIsWatchingTrip] = useState(false);
  const [watchToast, setWatchToast] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const hasActiveDisruptions =
    (scenario.disabledEdges && scenario.disabledEdges.length > 0) ||
    (scenario.blockedEdges && scenario.blockedEdges.length > 0) ||
    (scenario.edgeStatuses && Object.keys(scenario.edgeStatuses).length > 0) ||
    (scenario.disabledLines && scenario.disabledLines.length > 0) ||
    (scenario.lineStatuses && Object.keys(scenario.lineStatuses).length > 0) ||
    (scenario.blockedHubs && scenario.blockedHubs.length > 0);

  const handleResetDisruptions = () => {
    onUpdateScenario?.({
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

  // Constraints object for routing engine
  const constraints = useMemo(
    () => ({
      student,
      maxBudget: budget === '' ? undefined : Number(budget),
      maxTransfers: Number(maxTransfers),
      allowedModes,
      singleModeOnly,
      directOnly: !allowDetours,
      avoidHubs: avoidHub ? [avoidHub] : [],
    }),
    [student, budget, maxTransfers, allowedModes, singleModeOnly, allowDetours, avoidHub]
  );

  // Execute routing
  const res = useMemo(() => findRoutes(origin, dest, constraints, scenario), [
    origin,
    dest,
    constraints,
    scenario,
  ]);

  const isAll = goal === 'all';
  const effectiveGoal = isAll ? 'fastest' : goal;
  const backup = res.backups?.[effectiveGoal];
  const primary = isAll ? null : res.routes?.[goal];
  const shown = isAll ? null : viewBackup && backup ? backup : primary;
  const kind = isAll ? 'all' : viewBackup && backup ? 'backup' : goal;

  const allThreeRoutes = useMemo(() => {
    if (!res || res.status !== 'OK') return [];
    const list = [];
    ['cheapest', 'fastest', 'balanced'].forEach((g) => {
      if (res.routes[g]) list.push({ ...res.routes[g], kind: g });
    });
    if (backup) list.push({ ...backup, kind: 'backup' });
    return list;
  }, [res, backup]);

  const others = useMemo(() => {
    if (isAll) return [];
    const m = new Map();
    ['cheapest', 'fastest', 'balanced'].forEach((g) => {
      if (res.routes?.[g] && !m.has(res.routes[g].routeId)) {
        m.set(res.routes[g].routeId, { ...res.routes[g], kind: g });
      }
    });
    if (backup && !m.has(backup.routeId)) m.set(backup.routeId, { ...backup, kind: 'backup' });
    if (shown) m.delete(shown.routeId);
    return [...m.values()];
  }, [res, backup, shown, isAll]);

  const handleSwap = () => {
    const temp = origin;
    onSetOrigin(dest);
    onSetDest(temp);
  };

  const handleModeToggle = (modeId) => {
    if (allowedModes.includes(modeId)) {
      if (allowedModes.length > 1) {
        setAllowedModes(allowedModes.filter((m) => m !== modeId));
      }
    } else {
      setAllowedModes([...allowedModes, modeId]);
    }
  };

  const handleNlSearch = (e) => {
    e.preventDefault();
    const q = nlQuery.toLowerCase();
    if (!q) return;

    if (q.includes('student')) setStudent(true);
    if (q.includes('fast') || q.includes('druto')) setGoal('fastest');
    if (q.includes('cheap') || q.includes('shosta') || q.includes('kom')) setGoal('cheapest');

    // Hub extraction
    HUBS.forEach((h) => {
      if (q.includes(h.name.toLowerCase()) || q.includes(h.hubId)) {
        if (!q.indexOf(h.name.toLowerCase()) || q.indexOf(h.name.toLowerCase()) < q.length / 2) {
          onSetOrigin(h.hubId);
        } else {
          onSetDest(h.hubId);
        }
      }
    });
  };

  const toggleWatchTrip = () => {
    const next = !isWatchingTrip;
    setIsWatchingTrip(next);
    if (next) {
      setWatchToast('👁 Trip Watch active! Monitoring real-time alerts on your route.');
      setTimeout(() => setWatchToast(''), 4000);
    }
  };

  const bdt = (f) => (f.min === f.max ? `৳${f.min}` : `৳${f.min}–${f.max}`);

  return (
    <div className="commuter-view-layout">
      {/* COMMUTER SUB-NAVIGATION TABS */}
      <div className="commuter-subnav">
        <button
          type="button"
          className={`subnav-tab ${activeSubTab === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('planner')}
        >
          🎯 Route Planner & Map
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeSubTab === 'fare-truth' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('fare-truth')}
        >
          ⚖️ Fare Truth Validator
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeSubTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('network')}
        >
          🗺️ Network & Corridors
        </button>
      </div>

      {watchToast && <div className="watch-toast-banner">{watchToast}</div>}

      {/* SUBVIEW 1: PLANNER & INTERACTIVE MAP */}
      {activeSubTab === 'planner' && (
        <div className="planner-split-workspace">
          {/* LEFT: LEAFLET MAP */}
          <div className="map-column-container">
            <div className="map-toolbar-row">
              <div className="pref-selector-pills">
                <button
                  type="button"
                  className={`pref-pill fastest ${goal === 'fastest' ? 'active' : ''}`}
                  onClick={() => {
                    setGoal('fastest');
                    setViewBackup(false);
                  }}
                >
                  ⚡ Fastest
                </button>
                <button
                  type="button"
                  className={`pref-pill cheapest ${goal === 'cheapest' ? 'active' : ''}`}
                  onClick={() => {
                    setGoal('cheapest');
                    setViewBackup(false);
                  }}
                >
                  💰 Cheapest
                </button>
                <button
                  type="button"
                  className={`pref-pill balanced ${goal === 'balanced' ? 'active' : ''}`}
                  onClick={() => {
                    setGoal('balanced');
                    setViewBackup(false);
                  }}
                >
                  ⚖️ Balanced
                </button>
                <button
                  type="button"
                  className={`pref-pill all ${goal === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setGoal('all');
                    setViewBackup(false);
                  }}
                >
                  🌐 All Three
                </button>
              </div>

              <div className="map-status-pill">
                {scenario.blockedHubs.length > 0
                  ? `⛔ ${scenario.blockedHubs.length} Blocked Hubs`
                  : '🟢 Network Normal'}
              </div>
            </div>

            <div className="map-view-frame">
              <MapView
                hubs={HUBS}
                edges={EDGES}
                scenario={scenario}
                origin={origin}
                destination={dest}
                displayed={shown}
                displayedKind={kind}
                others={others}
                allThreeRoutes={allThreeRoutes}
                panelOpen={true}
                onSetOrigin={onSetOrigin}
                onSetDest={onSetDest}
              />
            </div>
          </div>

          {/* RIGHT: SEARCH CONTROLS & ROUTE CARDS */}
          <div className="planner-controls-column">
            {/* NL SEARCH BAR */}
            <form onSubmit={handleNlSearch} className="nl-search-bar">
              <input
                type="text"
                className="nl-input"
                placeholder="Search in Banglish: Dhanmondi theke Motijheel, student..."
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
              />
              <button type="submit" className="nl-btn">
                Plan
              </button>
            </form>

            {/* ROUTE ORIGIN/DEST CARD */}
            <div className="card-elevated origin-dest-box">
              <div className="od-inputs-row">
                <div className="od-field">
                  <span className="od-indicator a">A</span>
                  <select
                    value={origin}
                    onChange={(e) => onSetOrigin(e.target.value)}
                    className="styled-select"
                  >
                    {HUBS.map((h) => (
                      <option key={h.hubId} value={h.hubId}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="swap-btn"
                  onClick={handleSwap}
                  title="Swap Origin and Destination"
                >
                  ⇅
                </button>

                <div className="od-field">
                  <span className="od-indicator b">B</span>
                  <select
                    value={dest}
                    onChange={(e) => onSetDest(e.target.value)}
                    className="styled-select"
                  >
                    {HUBS.map((h) => (
                      <option key={h.hubId} value={h.hubId}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DIRECT ROAD BLOCKED WARNING BANNER */}
              {res.isDirectRoadBlocked && (
                <div className="direct-road-blocked-banner">
                  <div className="blocked-banner-icon">⛔</div>
                  <div className="blocked-banner-text">
                    <b>Direct Road Connection Blocked: {HUBS.find((h) => h.hubId === origin)?.name} ↔ {HUBS.find((h) => h.hubId === dest)?.name}</b>
                    <p>
                      Direct road connection is closed by Admin Dispatcher ({res.directRoadBlockReason || 'Road Block'}).
                      {allowDetours ? ' Showing alternative detour paths bypassing the blocked road.' : ' Detour routing is disabled.'}
                    </p>
                  </div>
                </div>
              )}

              {/* CONSTRAINTS & PREFERENCES */}
              <div className="preferences-row">
                <label className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={student}
                    onChange={(e) => setStudent(e.target.checked)}
                  />
                  <span>🎓 Student Pass (Half Fare Bus)</span>
                </label>

                <label className="checkbox-pill" title="Toggle detour paths when direct roads are blocked">
                  <input
                    type="checkbox"
                    checked={allowDetours}
                    onChange={(e) => setAllowDetours(e.target.checked)}
                  />
                  <span>🔄 Allow Detours</span>
                </label>

                <div className="field-inline">
                  <span className="muted small">Max ৳:</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    placeholder="any"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="small-input"
                  />
                </div>

                <div className="field-inline">
                  <span className="muted small">Max Transfers:</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={maxTransfers}
                    onChange={(e) => setMaxTransfers(e.target.value)}
                    className="small-input"
                  />
                </div>
              </div>

              {/* MODE TOGGLES */}
              <div className="modes-row">
                <span className="muted small">Allowed:</span>
                {AVAILABLE_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mode-toggle-chip ${allowedModes.includes(m.id) ? 'on' : 'off'}`}
                    onClick={() => handleModeToggle(m.id)}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {/* AVOID HUB PICKER */}
              <div className="avoid-row">
                <span className="muted small">Avoid Hub:</span>
                <select
                  value={avoidHub}
                  onChange={(e) => setAvoidHub(e.target.value)}
                  className="styled-select small"
                >
                  <option value="">None (Take fastest paths)</option>
                  {HUBS.map((h) => (
                    <option key={h.hubId} value={h.hubId}>
                      Avoid {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ACTIVE DISRUPTION NOTICE BANNER */}
            {hasActiveDisruptions && (
              <div className="active-disruptions-banner">
                <div className="disruption-info">
                  <span className="disruption-badge">⚠️ Active Disruption</span>
                  <span className="disruption-text">
                    Transit lines/hubs have been modified or blocked by Admin.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-clear-disruptions"
                  onClick={handleResetDisruptions}
                  title="Clear all blocks and delays"
                >
                  Clear Blocks
                </button>
              </div>
            )}

            {/* ROUTE COMPARISON CARDS */}
            <div className="routes-comparison-cards">
              {['fastest', 'cheapest', 'balanced'].map((g) => {
                const r = res.routes?.[g];
                const isActive = goal === g && !viewBackup;
                const modes = r ? routeModes(r).join(' + ') : 'None';
                return (
                  <button
                    key={g}
                    type="button"
                    className={`route-card-pill ${isActive ? 'selected' : ''}`}
                    style={{ borderLeftColor: COLORS[g] }}
                    onClick={() => {
                      setGoal(g);
                      setViewBackup(false);
                    }}
                    disabled={!r}
                  >
                    <div className="pill-top">
                      <span className="pill-kind">{g.toUpperCase()}</span>
                      {r && <span className="pill-fare">{bdt(r.fare)}</span>}
                    </div>
                    {r ? (
                      <div className="pill-details">
                        <b>{r.timeMinutes} min</b> · {r.transfers} transfer{r.transfers !== 1 ? 's' : ''}
                        <div className="pill-modes">{modes}</div>
                        {r.isDetour && (
                          <div style={{ marginTop: '3px' }}>
                            <span className="detour-pill-badge" title="Direct road connection is blocked; route takes an alternative detour">
                              ⚠️ Detour Route
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="muted small">No route meets criteria</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* NO ROUTES FOUND EXPLANATION */}
            {(!res.routes?.fastest && !res.routes?.cheapest) && (
              <div className="no-routes-found-box">
                <span className="no-routes-icon">🧭</span>
                <div className="no-routes-desc">
                  <b>{res.message?.includes('No valid route') ? 'No Valid Route Available' : 'No route meets your current filters'}</b>
                  <p className="small muted">
                    {res.message || (avoidHub
                      ? `All paths through ${HUBS.find((h) => h.hubId === avoidHub)?.name || avoidHub} are excluded by your "Avoid Hub" filter.`
                      : 'Try enabling more transport modes (e.g. Leguna or Rickshaw) or increasing transfer limit.')}
                  </p>
                  <div className="no-routes-actions">
                    {avoidHub && (
                      <button
                        type="button"
                        className="btn-mini-action"
                        onClick={() => setAvoidHub('')}
                      >
                        Clear "Avoid {HUBS.find((h) => h.hubId === avoidHub)?.name || avoidHub}"
                      </button>
                    )}
                    {hasActiveDisruptions && (
                      <button
                        type="button"
                        className="btn-mini-action"
                        onClick={handleResetDisruptions}
                      >
                        Reset Admin Road Blocks
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BACKUP ROUTE ACCORDION (If Disruption Exists) */}
            {backup && (
              <div className="backup-route-banner">
                <div>
                  <span className="backup-tag">⚠️ Backup Detour Available</span>
                  <div className="small">
                    Detour around congestion: <b>{bdt(backup.fare)}</b> · {backup.timeMinutes} min
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-backup ${viewBackup ? 'active' : ''}`}
                  onClick={() => setViewBackup(!viewBackup)}
                >
                  {viewBackup ? 'Viewing Detour' : 'Show Detour'}
                </button>
              </div>
            )}

            {/* SELECTED ROUTE STEP-BY-STEP BREAKDOWN */}
            {shown && (
              <div className="card-elevated itinerary-box">
                <div className="itinerary-header">
                  <div>
                    <h3>Route Itinerary</h3>
                    <div className="sub-stats">
                      <b>{shown.timeMinutes} mins</b> total · <b>{bdt(shown.fare)}</b> ·{' '}
                      {shown.transfers} transfers
                    </div>
                  </div>

                  <div className="itinerary-actions">
                    <button
                      type="button"
                      className={`btn-watch ${isWatchingTrip ? 'watching' : ''}`}
                      onClick={toggleWatchTrip}
                      title="Monitor this trip for real-time congestion alerts"
                    >
                      {isWatchingTrip ? '👁 Watching Trip' : '👁 Watch Trip'}
                    </button>
                    <button
                      type="button"
                      className="btn-offline-ticket"
                      onClick={() => setShowOfflineModal(true)}
                    >
                      🎫 Offline Pass
                    </button>
                  </div>
                </div>

                {/* LANDMARK LANGUAGE SWITCHER */}
                <div className="landmark-lang-switch">
                  <span className="muted small">Boarding Notes Language:</span>
                  <button
                    type="button"
                    className={`lang-btn ${landmarkLang === 'en' ? 'active' : ''}`}
                    onClick={() => setLandmarkLang('en')}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-btn ${landmarkLang === 'bn' ? 'active' : ''}`}
                    onClick={() => setLandmarkLang('bn')}
                  >
                    Banglish
                  </button>
                </div>

                {/* LEGS LIST */}
                <div className="itinerary-legs">
                  {shown.legs.map((leg, idx) => {
                    const fromHub = HUBS.find((h) => h.hubId === leg.fromHubId);
                    const toHub = HUBS.find((h) => h.hubId === leg.toHubId);
                    const noteObj = landmarks[leg.fromHubId];
                    const note =
                      landmarkLang === 'bn'
                        ? noteObj?.bn || noteObj?.en
                        : noteObj?.en || noteObj?.bn;

                    return (
                      <div key={idx} className="leg-item">
                        <div className="leg-icon-column">
                          <span className={`leg-mode-icon mode-${leg.mode}`}>
                            {leg.mode === 'metro' && '🚆'}
                            {leg.mode === 'bus' && '🚌'}
                            {leg.mode === 'leguna' && '🚐'}
                            {leg.mode === 'rickshaw' && '🛺'}
                            {leg.mode === 'cng' && '🛺'}
                            {leg.mode === 'walking' && '🚶'}
                          </span>
                          {idx < shown.legs.length - 1 && <span className="leg-connector-line" />}
                        </div>

                        <div className="leg-content">
                          <div className="leg-title-row">
                            <b>
                              {leg.lineId} ({leg.mode.toUpperCase()})
                            </b>
                            {scenario?.lineStatuses?.[leg.lineId]?.status === 'delayed' && (
                              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800 }}>
                                ⏱️ +{scenario.lineStatuses[leg.lineId].delayMin}m delay
                                {scenario.lineStatuses[leg.lineId].priceSurge > 0 ? ` (+৳${scenario.lineStatuses[leg.lineId].priceSurge})` : ''}
                              </span>
                            )}
                            <span className="leg-time-fare">
                              {leg.minutes} min · ৳{leg.fare.min === leg.fare.max ? leg.fare.min : `${leg.fare.min}–${leg.fare.max}`}
                            </span>
                          </div>

                          <div className="leg-route-segment">
                            {fromHub?.name} ➔ {toHub?.name} ({leg.km} km)
                          </div>

                          {note && (
                            <div className="boarding-landmark-callout">
                              📍 <b>Boarding Note:</b> {note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: FARE TRUTH CHECKER */}
      {activeSubTab === 'fare-truth' && (
        <FareTruthChecker
          fareConfig={fareConfig}
          rushHour={rushHour}
          scenario={scenario}
        />
      )}

      {/* SUBVIEW 3: NETWORK DIRECTORY */}
      {activeSubTab === 'network' && (
        <NetworkDirectory
          landmarks={landmarks}
          blockedHubs={scenario.blockedHubs}
        />
      )}

      {/* OFFLINE MODAL */}
      {showOfflineModal && shown && (
        <OfflineCardModal
          route={shown}
          origin={origin}
          dest={dest}
          landmarks={landmarks}
          lang={landmarkLang}
          onClose={() => setShowOfflineModal(false)}
        />
      )}
    </div>
  );
}
