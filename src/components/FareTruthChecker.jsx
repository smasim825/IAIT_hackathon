import React, { useState, useMemo } from 'react';
import { HUBS } from '../data/network.js';

export default function FareTruthChecker({ fareConfig, rushHour, scenario }) {
  const [mode, setMode] = useState('rickshaw');
  const [askedFare, setAskedFare] = useState('40');
  const [origin, setOrigin] = useState('science-lab');
  const [dest, setDest] = useState('dhanmondi');
  const [customKm, setCustomKm] = useState('1.5');
  const [isStudent, setIsStudent] = useState(false);

  // Active admin situational surges for Rickshaw & CNG lines
  const activeLineSurges = useMemo(() => {
    return Object.entries(scenario?.lineStatuses || {})
      .filter(([id, ls]) => ls.status === 'delayed' && ls.priceSurge > 0)
      .map(([id, ls]) => ({ id, ...ls }));
  }, [scenario]);

  const modeSurge = useMemo(() => {
    if (mode !== 'rickshaw' && mode !== 'cng') return 0;
    const match = activeLineSurges.find(
      (s) => (mode === 'rickshaw' && s.id.startsWith('RKS')) || (mode === 'cng' && s.id.startsWith('CNG'))
    );
    return match ? Number(match.priceSurge) : 0;
  }, [mode, activeLineSurges]);

  // Compute approximate distance between origin & dest
  const estimatedKm = useMemo(() => {
    const o = HUBS.find((h) => h.hubId === origin);
    const d = HUBS.find((h) => h.hubId === dest);
    if (!o || !d || o === d) return Number(customKm) || 2.0;
    // Euclidean approx for Dhaka grid
    const degLat = (o.lat - d.lat) * 111;
    const degLng = (o.lng - d.lng) * 102;
    const dist = Math.sqrt(degLat * degLat + degLng * degLng);
    return Math.max(0.8, Math.round(dist * 1.3 * 10) / 10); // 1.3 road curvature factor
  }, [origin, dest, customKm]);

  // Compute fair rate
  const calculation = useMemo(() => {
    const km = estimatedKm;
    const asked = Number(askedFare) || 0;
    const fuelAdj = 1 + (fareConfig.fuelAdjustmentPct || 0) / 100;

    let baseMin = 0;
    let baseMax = 0;
    let ruleText = '';

    if (mode === 'bus') {
      const perKm = fareConfig.busPerKm * fuelAdj;
      baseMin = baseMax = Math.max(fareConfig.busMinimum, Math.round(km * perKm));
      if (isStudent) {
        baseMin = baseMax = Math.max(fareConfig.busMinimum, Math.ceil(baseMin / 2));
        ruleText = 'BRTA Gazetted Rate (Half Fare Student applied — No driver surcharges allowed)';
      } else {
        ruleText = 'BRTA Gazetted Bus Rate (Strictly fixed by law — No driver surcharges allowed)';
      }
    } else if (mode === 'metro') {
      baseMin = baseMax = Math.min(
        fareConfig.metroMaximum,
        Math.max(fareConfig.metroMinimum, Math.round(km) * fareConfig.metroPerKm)
      );
      ruleText = 'DMTCL Official MRT-6 Fixed Fare Matrix (Strictly fixed by law — No surcharges allowed)';
    } else if (mode === 'leguna') {
      baseMin = 15;
      baseMax = 25;
      ruleText = 'Standard Dhaka Leguna Corridor Fixed Flat Rate';
    } else if (mode === 'rickshaw') {
      baseMin = Math.max(fareConfig.rickshawMinimum, Math.round(km * fareConfig.rickshawLowPerKm * fuelAdj));
      baseMax = Math.max(fareConfig.rickshawMinimum, Math.round(km * fareConfig.rickshawHighPerKm * fuelAdj));
      if (modeSurge > 0) {
        baseMin += modeSurge;
        baseMax += modeSurge;
        ruleText = `BRTA Baseline + ৳${modeSurge} Admin Authorized Situational Delay Surge`;
      } else {
        ruleText = 'Non-metered negotiated baseline range';
      }
    } else if (mode === 'cng') {
      baseMin = Math.max(fareConfig.cngMinimum, Math.round(km * fareConfig.cngLowPerKm * fuelAdj));
      baseMax = Math.max(fareConfig.cngMinimum, Math.round(km * fareConfig.cngHighPerKm * fuelAdj));
      if (modeSurge > 0) {
        baseMin += modeSurge;
        baseMax += modeSurge;
        ruleText = `BRTA Baseline + ৳${modeSurge} Admin Authorized Situational Delay Surge`;
      } else {
        ruleText = 'Non-metered CNG connector standard rates';
      }
    }

    // Rounding
    baseMin = Math.round(baseMin / 5) * 5 || baseMin;
    baseMax = Math.round(baseMax / 5) * 5 || baseMax;

    let verdict = 'fair';
    let diff = 0;
    if (asked < baseMin) {
      verdict = 'bargain';
      diff = baseMin - asked;
    } else if (asked <= baseMax) {
      verdict = 'fair';
      diff = 0;
    } else if (asked <= Math.round(baseMax * 1.25)) {
      verdict = 'surge';
      diff = asked - baseMax;
    } else {
      verdict = 'gouging';
      diff = asked - baseMax;
    }

    return {
      km,
      asked,
      baseMin,
      baseMax,
      verdict,
      diff,
      ruleText,
    };
  }, [mode, askedFare, estimatedKm, isStudent, fareConfig, modeSurge]);

  return (
    <div className="fare-truth-container">
      <div className="panel-header">
        <div className="title-with-badge">
          <h2>⚖️ Fare Truth: Is This Fare Fair?</h2>
          <span className="badge-pill active">Anti-Gouging Engine</span>
        </div>
        <p className="panel-desc">
          Compare what a driver or conductor quoted against official BRTA gazetted rates, DMTCL MRT-6 tables, and weather/rush-hour bounds.
        </p>
      </div>

      <div className="card-elevated fare-input-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Mode of Travel</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="styled-select"
            >
              <option value="rickshaw">🛺 Rickshaw</option>
              <option value="cng">🛺 CNG Auto</option>
              <option value="bus">🚌 Local Bus</option>
              <option value="metro">🚆 MRT-6 Metro Rail</option>
              <option value="leguna">🚐 Leguna</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fare Demanded / Asked (৳)</label>
            <div className="input-with-symbol">
              <span className="currency-prefix">৳</span>
              <input
                type="number"
                min="5"
                step="5"
                value={askedFare}
                onChange={(e) => setAskedFare(e.target.value)}
                placeholder="e.g. 50"
                className="styled-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>From (Origin Hub)</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="styled-select"
            >
              {HUBS.map((h) => (
                <option key={h.hubId} value={h.hubId}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>To (Destination Hub)</label>
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
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

        <div className="form-row-toggles">
          {mode === 'bus' && (
            <label className="checkbox-pill">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
              />
              <span>🎓 Student Card (Half Fare Eligible)</span>
            </label>
          )}

          <div className="distance-badge">
            Est. Trip Distance: <b>{calculation.km} km</b>
          </div>
        </div>
      </div>

      {/* VERDICT CARD */}
      <div className={`verdict-banner verdict-${calculation.verdict}`}>
        <div className="verdict-icon">
          {calculation.verdict === 'bargain' && '🎉'}
          {calculation.verdict === 'fair' && '✅'}
          {calculation.verdict === 'surge' && '⚡'}
          {calculation.verdict === 'gouging' && '🚨'}
        </div>
        <div className="verdict-content">
          <div className="verdict-title">
            {calculation.verdict === 'bargain' && 'Below Standard Rate (Bargain)'}
            {calculation.verdict === 'fair' && 'Fair & Justified Price'}
            {calculation.verdict === 'surge' && 'Moderate Peak / Weather Surge'}
            {calculation.verdict === 'gouging' && 'Severe Overcharge / Gouging Detected!'}
          </div>
          <div className="verdict-sub">
            {calculation.verdict === 'fair' &&
              `Asked ৳${calculation.asked} falls comfortably within standard fare range (৳${calculation.baseMin} – ৳${calculation.baseMax}).`}
            {calculation.verdict === 'bargain' &&
              `Asked ৳${calculation.asked} is below typical fair range (৳${calculation.baseMin} – ৳${calculation.baseMax}). Great deal!`}
            {calculation.verdict === 'surge' &&
              `Asked ৳${calculation.asked} is slightly elevated (+৳${calculation.diff} above ৳${calculation.baseMax}). Acceptable in rush/rain.`}
            {calculation.verdict === 'gouging' &&
              `Asked ৳${calculation.asked} is +৳${calculation.diff} OVER fair rate (৳${calculation.baseMin} – ৳${calculation.baseMax}). Counter-offer ৳${calculation.baseMax}!`}
          </div>
        </div>
      </div>

      {/* DETAILED BREAKDOWN TABLE */}
      <div className="card-elevated breakdown-card">
        <h3>Fare Computation Details</h3>
        <table className="breakdown-table">
          <tbody>
            <tr>
              <td>Selected Mode</td>
              <td><b>{mode.toUpperCase()}</b></td>
            </tr>
            <tr>
              <td>Journey Route</td>
              <td>{HUBS.find((h) => h.hubId === origin)?.name} ➔ {HUBS.find((h) => h.hubId === dest)?.name} ({calculation.km} km)</td>
            </tr>
            <tr>
              <td>Official Benchmark Range</td>
              <td><b>৳{calculation.baseMin} – ৳{calculation.baseMax}</b></td>
            </tr>
            <tr>
              <td>Rush-Hour Active?</td>
              <td>{rushHour ? '⚡ Yes (+30% road delay factor)' : 'No (Normal)'}</td>
            </tr>
            <tr>
              <td>Admin Situational Surge</td>
              <td>
                {['metro', 'bus'].includes(mode) ? (
                  <span style={{ color: '#10b981', fontWeight: 700 }}>
                    🔒 Strictly Prohibited (BRTA/DMTCL rules forbid surges on Metro & Bus)
                  </span>
                ) : modeSurge > 0 ? (
                  <span style={{ color: '#06b6d4', fontWeight: 700 }}>
                    ⚡ +৳{modeSurge} Authorized Delay Surge Active
                  </span>
                ) : (
                  <span>None (Standard baseline fares)</span>
                )}
              </td>
            </tr>
            {fareConfig.fuelAdjustmentPct !== 0 && (
              <tr>
                <td>Fuel Surcharge (Admin)</td>
                <td><b>{fareConfig.fuelAdjustmentPct > 0 ? `+${fareConfig.fuelAdjustmentPct}%` : `${fareConfig.fuelAdjustmentPct}%`}</b></td>
              </tr>
            )}
            <tr>
              <td>Regulatory Authority</td>
              <td className="muted">{calculation.ruleText}</td>
            </tr>
          </tbody>
        </table>

        <div className="counter-offer-tip">
          💡 <b>Negotiation Pro-Tip:</b> If the driver demands ৳{calculation.asked}, politely show this calculation and counter with <b>৳{calculation.baseMax}</b>. In Dhaka transit, drivers frequently respect the BRTA/rain benchmark when quoted with confidence.
        </div>
      </div>
    </div>
  );
}
