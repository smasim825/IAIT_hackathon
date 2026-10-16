// Deterministic routing engine: depth-limited DFS -> service expansion -> time/fare/transfers -> rankings -> backup.
import { HUBS, EDGES } from '../data/network.js';

export const CONFIG = {
  maxHops: 6,
  maxCandidates: 20000,
  rushMult: 1.3,
  rainTimeMult: { 1: { bus: 1.2, rickshaw: 1.3, cng: 1.3, leguna: 1.2 }, 2: { rickshaw: 1.6, cng: 1.6 } },
  transferWait: 6, transferWalkMetro: 5, transferWalkOther: 2,
  weights: { time: 0.5, fare: 0.3, transfers: 0.2 }, // S = .5(T/60)+.3(F/100)+.2(X/3)
};
export const DEFAULT_SCENARIO = { rushHour: false, rainSeverity: 0, rainHubs: [], blockedHubs: [], disabledLines: [], disabledEdges: [], delays: [] };

const hubIds = new Set(HUBS.map((h) => h.hubId));
const adj = new Map();
EDGES.forEach((e) => { if (!adj.has(e.fromHubId)) adj.set(e.fromHubId, []); adj.get(e.fromHubId).push(e); });

const norm = (s) => ({ ...DEFAULT_SCENARIO, ...(s || {}) });
const rainAffects = (e, s) => s.rainSeverity > 0 && (!s.rainHubs.length || s.rainHubs.includes(e.fromHubId) || s.rainHubs.includes(e.toHubId));

/** Returns a reason string if a service cannot be used, else null. */
export function serviceBlockReason(e, svc, s, c = {}) {
  if (!svc.isEnabled) return `${svc.lineId} is disabled`;
  if (s.disabledLines.includes(svc.lineId)) return `${svc.lineId} is disabled (scenario)`;
  if (s.disabledEdges.includes(e.pairKey)) return 'connection is blocked (scenario)';

  // User-selectable transport mode filters (Local Bus, MRT-6 Metro, Leguna, Rickshaw, Walking)
  if (c.allowedModes && c.allowedModes.length > 0) {
    const isAllowed = c.allowedModes.includes(svc.mode) || (svc.mode === 'cng' && c.allowedModes.includes('rickshaw'));
    if (!isAllowed) return `mode ${svc.mode} is not selected`;
  }

  if (c.avoidModes?.includes(svc.mode)) return `mode ${svc.mode} avoided`;
  if (s.rainSeverity >= 2 && rainAffects(e, s) && ['bus', 'leguna'].includes(svc.mode)) return 'heavy rain suspends buses';
  return null;
}

/** T = ceil(base*(1+D)*rush*rain + A) */
export function segTime(svc, e, scn) {
  const s = norm(scn);
  const d = s.delays.find((x) => x.lineId === svc.lineId) || { rate: 0, extra: 0 };
  const rush = s.rushHour && !['metro', 'walking'].includes(svc.mode) ? CONFIG.rushMult : 1;
  const rain = rainAffects(e, s) ? CONFIG.rainTimeMult[s.rainSeverity]?.[svc.mode] ?? 1 : 1;
  return Math.ceil(svc.baseTimeMinutes * (1 + d.rate) * rush * rain + d.extra - 1e-9);
}

export function legFare(leg, scn, student) {
  const s = norm(scn), km = leg.km;
  let min = 0, max = 0;
  if (leg.mode === 'bus') { min = max = Math.max(10, Math.round(2.7 * km)); if (student) min = max = Math.max(10, Math.ceil(min / 2)); }
  else if (leg.mode === 'metro') { min = max = Math.min(100, Math.max(20, Math.round(km) * 5)); } // provisional
  else if (leg.mode === 'leguna') { min = 10; max = 20; }
  else if (leg.mode === 'rickshaw' || leg.mode === 'cng') {
    const [a, b, lo, hi] = leg.mode === 'rickshaw' ? [15, 25, 20, 30] : [30, 45, 40, 60];
    min = Math.max(lo, Math.round(km * a)); max = Math.max(hi, Math.round(km * b));
    if (leg.rainAffected) { min = Math.round(min * 1.2); max = Math.round(max * 1.5); }
    if (s.rushHour) max = Math.round(max * 1.2);
  }
  return { min, max };
}

function buildJourney(edges, svcs, scn, student) {
  const segments = edges.map((e, i) => ({
    edgeId: e.edgeId, pairKey: e.pairKey, from: e.fromHubId, to: e.toHubId, km: e.distanceKm,
    lineId: svcs[i].lineId, mode: svcs[i].mode, minutes: segTime(svcs[i], e, scn), rainAffected: rainAffects(e, scn),
  }));
  const legs = [];
  segments.forEach((sg) => {
    const last = legs[legs.length - 1];
    if (last && last.lineId === sg.lineId) { // same continuous line only
      last.toHubId = sg.to; last.hubIds.push(sg.to); last.km += sg.km; last.minutes += sg.minutes; last.rainAffected ||= sg.rainAffected;
    } else legs.push({ lineId: sg.lineId, mode: sg.mode, fromHubId: sg.from, toHubId: sg.to, hubIds: [sg.from, sg.to], km: sg.km, minutes: sg.minutes, rainAffected: sg.rainAffected });
  });
  const riding = legs.filter((l) => l.mode !== 'walking');
  const transfers = Math.max(0, riding.length - 1);
  let transferMinutes = 0;
  for (let i = 1; i < riding.length; i++) {
    const metro = riding[i].mode === 'metro' || riding[i - 1].mode === 'metro';
    transferMinutes += CONFIG.transferWait + (metro ? CONFIG.transferWalkMetro : CONFIG.transferWalkOther);
  }
  let min = 0, max = 0;
  legs.forEach((l) => { l.fare = legFare(l, scn, student); min += l.fare.min; max += l.fare.max; });
  const hubPath = [segments[0].from, ...segments.map((s) => s.to)];
  return {
    routeId: `${hubPath.join('>')}#${legs.map((l) => l.lineId).join('+')}`,
    hubIds: hubPath, segments, legs, transfers, transferMinutes,
    timeMinutes: segments.reduce((a, s) => a + s.minutes, 0) + transferMinutes,
    fare: { min, max, est: Math.round((min + max) / 2) },
    fareConfidence: min === max ? 'PROTOTYPE_ESTIMATE' : 'RANGE_ESTIMATE',
  };
}

function search(origin, dest, c, s) {
  const stats = { nodesVisited: 0, hubPaths: 0, serviceCandidates: 0, rejected: {}, complete: true };
  const rej = (r) => { stats.rejected[r] = (stats.rejected[r] || 0) + 1; };
  const out = [], seen = new Set([origin]), path = [];
  const maxHops = c.maxHops ?? CONFIG.maxHops;

  const expand = () => {
    const options = path.map((e) => e.services.map((svc) => ({ svc, r: serviceBlockReason(e, svc, s, c) })));
    for (const opts of options) if (!opts.some((o) => !o.r)) { rej(opts[0]?.r || 'no service'); return; }
    const pick = [];
    const rec = (i) => {
      if (!stats.complete) return;
      if (i === path.length) {
        if (out.length >= CONFIG.maxCandidates) { stats.complete = false; return; }
        stats.serviceCandidates++;
        const j = buildJourney(path, pick.slice(), s, c.student);

        // Single-mode-only constraint enforcement
        if (c.singleModeOnly) {
          const distinctModes = new Set(j.legs.map((l) => (l.mode === 'cng' ? 'rickshaw' : l.mode)));
          if (distinctModes.size > 1) return rej('multiple modes in single-mode routing');
        }

        if (j.transfers > (c.maxTransfers ?? Infinity)) return rej('too many transfers');
        if (j.timeMinutes > (c.maxTravelTime ?? Infinity)) return rej('over time limit');
        out.push(j); return;
      }
      for (const o of options[i]) if (!o.r) { pick[i] = o.svc; rec(i + 1); }
    };
    rec(0);
  };
  const dfs = (hub) => {
    stats.nodesVisited++;
    if (hub === dest) { stats.hubPaths++; expand(); return; }
    if (path.length >= maxHops) return;
    for (const e of adj.get(hub) || []) {
      const n = e.toHubId;
      if (seen.has(n)) continue;
      if (n !== dest && s.blockedHubs.includes(n)) { rej('blocked hub'); continue; }
      if (n !== dest && c.avoidHubs?.includes(n)) { rej('avoided hub'); continue; }
      seen.add(n); path.push(e); dfs(n); path.pop(); seen.delete(n);
    }
  };
  dfs(origin);
  return { cands: out, stats };
}

const score = (r) => CONFIG.weights.time * (r.timeMinutes / 60) + CONFIG.weights.fare * (r.fare.est / 100) + CONFIG.weights.transfers * (r.transfers / 3);
const CMP = {
  cheapest: (a, b) => a.fare.est - b.fare.est || a.timeMinutes - b.timeMinutes || a.transfers - b.transfers,
  fastest: (a, b) => a.timeMinutes - b.timeMinutes || a.fare.est - b.fare.est || a.transfers - b.transfers,
  balanced: (a, b) => score(a) - score(b) || a.timeMinutes - b.timeMinutes,
};
const best = (goal, list) => [...list].sort((a, b) => CMP[goal](a, b) || (a.routeId < b.routeId ? -1 : 1))[0] || null;

function budgetStatus(r, budget) {
  if (budget == null) return 'NO_BUDGET';
  return r.fare.max <= budget ? 'WITHIN_BUDGET' : r.fare.est <= budget ? 'ESTIMATED_WITHIN_BUDGET' : 'OVER_BUDGET';
}

function reachable(o, d) {
  const q = [o], seen = new Set([o]);
  while (q.length) { const h = q.shift(); if (h === d) return true; (adj.get(h) || []).forEach((e) => { if (!seen.has(e.toHubId)) { seen.add(e.toHubId); q.push(e.toHubId); } }); }
  return false;
}

export function findRoutes(origin, destination, constraints = {}, scenario = {}) {
  const c = constraints, s = norm(scenario);
  const base = { origin, destination, scenario: s, routes: { cheapest: null, fastest: null, balanced: null }, backups: { cheapest: null, fastest: null, balanced: null }, explanations: [], overBudgetCheapest: null };
  if (!hubIds.has(origin) || !hubIds.has(destination)) return { ...base, status: 'INVALID_INPUT', message: 'Unknown origin or destination hub.' };
  if (origin === destination) return { ...base, status: 'SAME_LOCATION', message: 'Origin and destination are the same.' };

  const { cands, stats } = search(origin, destination, c, s);
  const withBudget = cands.map((r) => ({ ...r, budgetStatus: budgetStatus(r, c.maxBudget) }));
  const ok = c.maxBudget == null ? withBudget : withBudget.filter((r) => r.budgetStatus === 'WITHIN_BUDGET'); // strict: max fare must fit
  const res = { ...base, stats, candidateCount: ok.length };

  if (!ok.length) {
    res.overBudgetCheapest = best('cheapest', withBudget);
    res.status = !reachable(origin, destination) ? 'NO_ROUTE_IN_MODELED_NETWORK' : stats.complete ? 'NO_ROUTE_WITHIN_CONSTRAINTS' : 'SEARCH_INCOMPLETE';
    if (res.overBudgetCheapest) {
      res.message = `No route has a maximum fare within ৳${c.maxBudget}. Cheapest over-budget option shown separately.`;
    } else if (c.allowedModes && c.allowedModes.length < 5) {
      const modeLabels = { bus: 'Local Bus', metro: 'MRT-6 Metro', leguna: 'Leguna', rickshaw: 'Rickshaw', walking: 'Walking' };
      const selectedNames = c.allowedModes.map((m) => modeLabels[m] || m).join(', ');
      res.message = `No route found using selected transport mode(s): ${selectedNames}${c.singleModeOnly ? ' (single-mode only)' : ''}. Try enabling additional transport modes.`;
    } else {
      res.message = 'No valid route under the current constraints, blocks or hop limit.';
    }
    return res;
  }
  res.status = stats.complete ? 'OK' : 'SEARCH_INCOMPLETE';
  for (const g of ['cheapest', 'fastest', 'balanced']) {
    const p = best(g, ok); res.routes[g] = { ...p, goal: g };
    const crit = [...p.legs].filter((l) => l.mode !== 'walking').sort((a, b) => b.minutes - a.minutes)[0]?.lineId;
    const b = best(g, ok.filter((r) => r.routeId !== p.routeId && !(crit && r.legs.some((l) => l.lineId === crit))));
    res.backups[g] = b && { ...b, goal: 'backup', trigger: crit ? `${crit} becomes unavailable` : 'Primary route unavailable', diff: { minutes: b.timeMinutes - p.timeMinutes, fare: b.fare.est - p.fare.est, transfers: b.transfers - p.transfers } };
  }
  res.explanations.push('Cheapest = lowest estimated fare; Fastest = lowest time; Balanced = weighted score of time, fare and transfers.');
  if (!stats.complete) res.explanations.push('Search limit reached: results are partial, not proven optimal.');
  return res;
}

/** Returns formatted list of unique transport modes used in a route */
export function routeModes(route) {
  if (!route || !route.legs) return [];
  const labels = {
    metro: 'MRT-6 Metro',
    bus: 'Local Bus',
    leguna: 'Leguna',
    rickshaw: 'Rickshaw',
    cng: 'CNG',
    walking: 'Walking',
  };
  const seen = new Set();
  const res = [];
  for (const leg of route.legs) {
    const key = leg.mode === 'cng' ? 'rickshaw' : leg.mode;
    if (!seen.has(key)) {
      seen.add(key);
      res.push(labels[leg.mode] || leg.mode);
    }
  }
  return res;
}

/** Why would a baseline route be affected by a scenario? Only reports causes the engine can verify. */
export function explainChange(route, scenario) {
  if (!route) return [];
  const s = norm(scenario), out = [];
  route.hubIds.slice(1, -1).forEach((h) => s.blockedHubs.includes(h) && out.push(`Hub ${HUBS.find((x) => x.hubId === h).name} is blocked.`));
  route.segments.forEach((sg) => {
    const e = EDGES.find((x) => x.edgeId === sg.edgeId);
    const svc = e.services.find((x) => x.lineId === sg.lineId);
    const r = serviceBlockReason(e, svc, s);
    if (r) out.push(`${sg.lineId} on ${sg.from}→${sg.to}: ${r}.`);
  });
  s.delays.forEach((d) => route.legs.some((l) => l.lineId === d.lineId) && out.push(`${d.lineId} delay: +${Math.round(d.rate * 100)}% and +${d.extra} min.`));
  if (s.rushHour) out.push('Rush-hour multiplier applied to non-metro services.');
  if (s.rainSeverity) out.push(`Rain severity ${s.rainSeverity} applied${s.rainHubs.length ? ' in selected zones' : ''}.`);
  return [...new Set(out)];
}

/** Display status of an undirected link for the map (engine decides, map only draws). */
export function edgeStatus(pairKey, scenario) {
  const s = norm(scenario);
  const e = EDGES.find((x) => x.pairKey === pairKey);
  const services = e.services.map((svc) => ({ lineId: svc.lineId, mode: svc.mode, reason: serviceBlockReason(e, svc, s) }));
  const hubBlocked = pairKey.split('|').some((h) => s.blockedHubs.includes(h));
  return { services, blocked: services.every((x) => x.reason) || hubBlocked, hubBlocked, delayed: s.delays.some((d) => services.some((x) => x.lineId === d.lineId)) };
}

export const hubName = (id) => HUBS.find((h) => h.hubId === id)?.name || id;
