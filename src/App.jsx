import React, { useMemo, useState } from 'react';
import MapView, { COLORS } from './components/MapView.jsx';
import { HUBS, EDGES, LINES } from './data/network.js';
import { findRoutes, explainChange, hubName, DEFAULT_SCENARIO } from './engine/router.js';

const bdt = (f) => (f.min === f.max ? `৳${f.min}` : `৳${f.min}–${f.max}`);
const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
const PAIRS = [...new Set(EDGES.map((e) => e.pairKey))];
const unresolved = HUBS.filter((h) => !Number.isFinite(h.lat) || !Number.isFinite(h.lng));

function Card({ kind, label, r, active, onClick }) {
  return (
    <button className={`card ${active ? 'on' : ''}`} style={{ borderLeftColor: COLORS[kind] }} onClick={onClick} disabled={!r}>
      <div className="ct">{label}{r?.budgetStatus === 'ESTIMATED_WITHIN_BUDGET' && ' (est.)'}</div>
      {r ? <div className="cm"><b>{bdt(r.fare)}</b><span>{r.timeMinutes} min</span><span>{r.transfers} transfer{r.transfers !== 1 && 's'}</span></div> : <div className="cm muted">Not available</div>}
    </button>
  );
}

export default function App() {
  const [origin, setOrigin] = useState('mirpur');
  const [dest, setDest] = useState('motijheel');
  const [goal, setGoal] = useState('fastest');
  const [viewBackup, setViewBackup] = useState(false);
  const [student, setStudent] = useState(false);
  const [budget, setBudget] = useState('');
  const [maxTransfers, setMaxTransfers] = useState(3);
  const [scn, setScn] = useState(DEFAULT_SCENARIO);
  const [open, setOpen] = useState(true);
  const [delay, setDelay] = useState({ lineId: 'MRT-6', rate: 30, extra: 3 });

  const cons = useMemo(() => ({ student, maxBudget: budget === '' ? undefined : Number(budget), maxTransfers: Number(maxTransfers) }), [student, budget, maxTransfers]);
  const base = useMemo(() => findRoutes(origin, dest, cons, {}), [origin, dest, cons]);
  const res = useMemo(() => findRoutes(origin, dest, cons, scn), [origin, dest, cons, scn]);
  const simulated = JSON.stringify(scn) !== JSON.stringify(DEFAULT_SCENARIO);

  const backup = res.backups[goal];
  const primary = res.routes[goal];
  const shown = viewBackup && backup ? backup : primary;
  const kind = viewBackup && backup ? 'backup' : goal;
  const baseRoute = base.routes[goal];
  const changed = simulated && baseRoute && (!primary || primary.routeId !== baseRoute.routeId);
  const reasons = simulated ? explainChange(baseRoute, scn) : [];

  // other routes drawn subdued; same physical route is drawn once (de-duplicated by routeId)
  const others = useMemo(() => {
    const m = new Map();
    ['cheapest', 'fastest', 'balanced'].forEach((g) => res.routes[g] && !m.has(res.routes[g].routeId) && m.set(res.routes[g].routeId, { ...res.routes[g], kind: g }));
    if (backup && !m.has(backup.routeId)) m.set(backup.routeId, { ...backup, kind: 'backup' });
    if (shown) m.delete(shown.routeId);
    return [...m.values()];
  }, [res, backup, shown]);

  const toggle = (key, v) => setScn((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  const pickGoal = (g) => { setGoal(g); setViewBackup(false); };
  const lines = [...new Set(EDGES.flatMap((e) => e.services.map((s) => s.lineId)))].filter((l) => l !== 'WALK');
  const same = [['cheapest', 'fastest'], ['cheapest', 'balanced'], ['fastest', 'balanced']].filter(([a, b]) => res.routes[a] && res.routes[a].routeId === res.routes[b]?.routeId).map(([a, b]) => `${a} = ${b}`);

  return (
    <div className="app">
      <header><h1>🚌 KoyJabo <small>Dhaka transit navigator · prototype data</small></h1>
        <button className="tog" onClick={() => setOpen(!open)}>{open ? 'Hide panel' : 'Show panel'}</button></header>
      <div className={`main ${open ? '' : 'closed'}`}>
        <div className="mapwrap">
          <MapView
            hubs={HUBS}
            edges={EDGES}
            scenario={scn}
            origin={origin}
            destination={dest}
            displayed={shown}
            displayedKind={kind}
            others={others}
            panelOpen={open}
            onSetOrigin={setOrigin}
            onSetDest={setDest}
          />
          <div className="legend">
            <div className="legend-title">Routes &amp; Lines</div>
            {Object.entries(COLORS).map(([k, c]) => (
              <div key={k}><i style={{ background: c }} />{k}</div>
            ))}
            <div><i style={{ background: '#64748b' }} />transit network link</div>
            <div><i style={{ background: '#dc2626' }} />blocked link (sim.)</div>
            <div className="legend-hubs">
              <div><span className="legend-pin origin">A</span> Start hub</div>
              <div><span className="legend-pin dest">B</span> Destination</div>
              <div><span className="legend-marker route" /> Route stop</div>
              <div><span className="legend-marker hub" /> Transit hub (14)</div>
            </div>
          </div>
        </div>
        <aside>
          <section>
            <div className="row"><label>From<select value={origin} onChange={(e) => setOrigin(e.target.value)}>{HUBS.map((h) => <option key={h.hubId} value={h.hubId}>{h.name}</option>)}</select></label>
              <button className="swap" onClick={() => { setOrigin(dest); setDest(origin); }}>⇄</button>
              <label>To<select value={dest} onChange={(e) => setDest(e.target.value)}>{HUBS.map((h) => <option key={h.hubId} value={h.hubId}>{h.name}</option>)}</select></label></div>
            <div className="row"><label>Budget ৳<input type="number" min="0" value={budget} placeholder="none" onChange={(e) => setBudget(e.target.value)} /></label>
              <label>Max transfers<select value={maxTransfers} onChange={(e) => setMaxTransfers(e.target.value)}>{[0, 1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></label>
              <label className="chk"><input type="checkbox" checked={student} onChange={(e) => setStudent(e.target.checked)} />Student</label></div>
            {unresolved.length > 0 && <p className="warn">Hubs missing coordinates: {unresolved.map((h) => h.name).join(', ')}</p>}
          </section>

          {simulated && <div className="sim">⚠ SIMULATED conditions – not live incidents</div>}
          {res.status !== 'OK' && <div className="msg">{res.message || res.status}<div className="muted">Status: {res.status}</div></div>}
          {res.overBudgetCheapest && <div className="msg">Over budget: {bdt(res.overBudgetCheapest.fare)}, {res.overBudgetCheapest.timeMinutes} min via {res.overBudgetCheapest.hubIds.map(hubName).join(' → ')}</div>}

          {res.status === 'OK' && <section>
            <div className="cards">
              <Card kind="cheapest" label="Cheapest" r={res.routes.cheapest} active={goal === 'cheapest' && !viewBackup} onClick={() => pickGoal('cheapest')} />
              <Card kind="fastest" label="Fastest" r={res.routes.fastest} active={goal === 'fastest' && !viewBackup} onClick={() => pickGoal('fastest')} />
              <Card kind="balanced" label="Balanced" r={res.routes.balanced} active={goal === 'balanced' && !viewBackup} onClick={() => pickGoal('balanced')} />
              <Card kind="backup" label={`Backup (${goal})`} r={backup} active={viewBackup} onClick={() => setViewBackup(true)} />
            </div>
            {same.length > 0 && <p className="muted">Same physical route: {same.join(', ')} (drawn once).</p>}
            {!backup && <p className="muted">No operationally distinct backup found.</p>}

            {shown && <div className="detail">
              <h3 style={{ color: COLORS[kind] }}>{kind === 'backup' ? 'Backup route' : `${goal[0].toUpperCase() + goal.slice(1)} route`}</h3>
              <p><b>{bdt(shown.fare)}</b> · {shown.timeMinutes} min · {shown.transfers} transfer(s) · <span className="muted">{shown.fareConfidence.replace('_', ' ').toLowerCase()}{shown.budgetStatus === 'WITHIN_BUDGET' ? ' · within budget (max fare)' : ''}</span></p>
              {kind === 'backup' && <p className="muted">Trigger: {backup.trigger}. vs primary: {sign(backup.diff.minutes)} min, {sign(backup.diff.fare)} ৳, {sign(backup.diff.transfers)} transfers.</p>}
              <ol>{shown.legs.map((l, i) => (
                <li key={i}><b>{l.mode === 'walking' ? 'Walk' : `Take ${LINES[l.lineId]}`}</b> {hubName(l.fromHubId)} → {hubName(l.toHubId)}
                  <div className="muted">{l.hubIds.length > 2 && `via ${l.hubIds.slice(1, -1).map(hubName).join(', ')} · `}{l.km.toFixed(1)} km · {l.minutes} min · {bdt(l.fare)}</div>
                  <div className="muted">Board at: {HUBS.find((h) => h.hubId === l.fromHubId).landmark}</div></li>))}</ol>
              {shown.transferMinutes > 0 && <p className="muted">Includes {shown.transferMinutes} min transfer wait/walk.</p>}
            </div>}
            {res.stats && <p className="muted tiny">Search: {res.stats.hubPaths} hub paths, {res.stats.serviceCandidates} service combos, complete={String(res.stats.complete)}</p>}
          </section>}

          {simulated && baseRoute && <div className="msg">
            <b>Before vs after ({goal})</b>
            <div>Original: {bdt(baseRoute.fare)}, {baseRoute.timeMinutes} min — {baseRoute.hubIds.map(hubName).join(' → ')}</div>
            <div>Now: {primary ? `${bdt(primary.fare)}, ${primary.timeMinutes} min — ${primary.hubIds.map(hubName).join(' → ')}` : 'no valid route'}</div>
            <div>{changed ? (primary ? 'Route changed.' : 'Original route is no longer valid.') : 'Original route still valid.'}</div>
            {reasons.map((r) => <div key={r} className="muted">• {r}</div>)}
          </div>}

          <section className="scn">
            <h3>What-if simulator</h3>
            <label className="chk"><input type="checkbox" checked={scn.rushHour} onChange={(e) => setScn({ ...scn, rushHour: e.target.checked })} />Rush hour</label>
            <label>Rain<select value={scn.rainSeverity} onChange={(e) => setScn({ ...scn, rainSeverity: Number(e.target.value) })}><option value={0}>None</option><option value={1}>Light</option><option value={2}>Heavy (buses suspended)</option></select></label>
            <label>Block hub<select value="" onChange={(e) => e.target.value && toggle('blockedHubs', e.target.value)}><option value="">Add…</option>{HUBS.map((h) => <option key={h.hubId} value={h.hubId}>{h.name}</option>)}</select></label>
            <label>Block connection<select value="" onChange={(e) => e.target.value && toggle('disabledEdges', e.target.value)}><option value="">Add…</option>{PAIRS.map((p) => <option key={p} value={p}>{p.replace('|', ' ↔ ')}</option>)}</select></label>
            <label>Disable line<select value="" onChange={(e) => e.target.value && toggle('disabledLines', e.target.value)}><option value="">Add…</option>{lines.map((l) => <option key={l}>{l}</option>)}</select></label>
            <div className="row"><select value={delay.lineId} onChange={(e) => setDelay({ ...delay, lineId: e.target.value })}>{lines.map((l) => <option key={l}>{l}</option>)}</select>
              <input type="number" value={delay.rate} onChange={(e) => setDelay({ ...delay, rate: Number(e.target.value) })} title="% delay" />%
              <input type="number" value={delay.extra} onChange={(e) => setDelay({ ...delay, extra: Number(e.target.value) })} title="extra min" />min
              <button onClick={() => setScn({ ...scn, delays: [...scn.delays.filter((d) => d.lineId !== delay.lineId), { lineId: delay.lineId, rate: delay.rate / 100, extra: delay.extra }] })}>Add delay</button></div>
            <div className="chips">{[...scn.blockedHubs.map((v) => ['blockedHubs', v, `hub ${v}`]), ...scn.disabledEdges.map((v) => ['disabledEdges', v, v.replace('|', '↔')]), ...scn.disabledLines.map((v) => ['disabledLines', v, `line ${v}`])].map(([k, v, t]) => <button key={k + v} className="chip" onClick={() => toggle(k, v)}>{t} ✕</button>)}
              {scn.delays.map((d) => <button key={d.lineId} className="chip" onClick={() => setScn({ ...scn, delays: scn.delays.filter((x) => x !== d) })}>{d.lineId} +{Math.round(d.rate * 100)}%/{d.extra}m ✕</button>)}</div>
            <button onClick={() => setScn(DEFAULT_SCENARIO)} disabled={!simulated}>Reset scenario</button>
          </section>
        </aside>
      </div>
    </div>
  );
}
