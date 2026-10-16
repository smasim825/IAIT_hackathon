// Bidirectional Synchronization between React Frontend (Port 5180) and Backend API (Port 3000)
// Translates between frontend pairKeys ('agargaon|mirpur') and backend edge IDs ('MRT6:MIR-AGA')

export const HUB_ID_TO_BACKEND = {
  uttara: 'UTT',
  mirpur: 'MIR',
  mohakhali: 'MOH',
  agargaon: 'AGA',
  badda: 'BAD',
  farmgate: 'FAR',
  shahbagh: 'SHA',
  'science-lab': 'SCI',
  mohammadpur: 'MPR',
  dhanmondi: 'DHA',
  malibagh: 'MAL',
  banasree: 'BAN',
  motijheel: 'MOT',
  jatrabari: 'JAT',
};

export const BACKEND_HUB_TO_FRONTEND = Object.fromEntries(
  Object.entries(HUB_ID_TO_BACKEND).map(([f, b]) => [b, f])
);

export const FRONTEND_TO_BACKEND_EDGES = {
  'mirpur|uttara': ['MRT6:UTT-MIR'],
  'agargaon|mirpur': ['MRT6:MIR-AGA', 'B1:MIR-AGA', 'L2:MIR-AGA'],
  'agargaon|farmgate': ['MRT6:AGA-FAR', 'B1:AGA-FAR'],
  'farmgate|shahbagh': ['MRT6:FAR-SHA', 'B1:FAR-SHA'],
  'motijheel|shahbagh': ['MRT6:SHA-MOT', 'B1:SHA-MOT', 'B4:SHA-MOT'],
  'badda|mohakhali': ['B7:MOH-BAD', 'C-MOH-BAD:MOH-BAD'],
  'mohakhali|uttara': ['B2:UTT-MOH', 'C-UTT-MOH:UTT-MOH'],
  'banasree|malibagh': ['B5:BAN-MAL', 'R-BAN-MAL:BAN-MAL'],
  'malibagh|motijheel': ['B3:MAL-MOT', 'B5:MAL-MOT'],
  'farmgate|science-lab': ['R-FAR-SCI:FAR-SCI'],
  'science-lab|shahbagh': ['B4:SCI-SHA', 'R-SHA-SCI:SHA-SCI', 'W-SHA-SCI:SHA-SCI'],
  'dhanmondi|science-lab': ['B4:DHA-SCI', 'R-SCI-DHA:SCI-DHA'],
  'farmgate|mohakhali': ['B2:MOH-FAR', 'R-MOH-FAR:MOH-FAR'],
  'dhanmondi|mohammadpur': ['B4:MPR-DHA', 'R-MPR-DHA:MPR-DHA'],
  'jatrabari|motijheel': ['B4:MOT-JAT', 'L1:MOT-JAT'],
};

export const BACKEND_EDGE_TO_FRONTEND = {};
Object.entries(FRONTEND_TO_BACKEND_EDGES).forEach(([pk, edgeIds]) => {
  edgeIds.forEach((id) => {
    BACKEND_EDGE_TO_FRONTEND[id] = pk;
  });
});

/**
 * Checks if the direct road between two hubs is blocked
 */
export function isDirectRoadBlocked(origin, dest, scenario) {
  if (!origin || !dest || !scenario) return false;
  const pairKey = [origin, dest].sort().join('|');
  const fromTo = `${origin}|${dest}`;
  const toFrom = `${dest}|${origin}`;
  return Boolean(
    scenario.disabledEdges?.includes(pairKey) ||
    scenario.disabledEdges?.includes(fromTo) ||
    scenario.disabledEdges?.includes(toFrom) ||
    scenario.blockedEdges?.includes(pairKey) ||
    scenario.blockedEdges?.includes(fromTo) ||
    scenario.blockedEdges?.includes(toFrom) ||
    scenario.edgeStatuses?.[pairKey]?.status === 'blocked' ||
    scenario.edgeStatuses?.[fromTo]?.status === 'blocked' ||
    scenario.edgeStatuses?.[toFrom]?.status === 'blocked'
  );
}

/**
 * Pushes updated scenario to the backend API via /api/scenario
 */
export async function syncScenarioToBackend(scenario) {
  try {
    const backendBlockedEdges = [];
    (scenario.blockedEdges || []).forEach((pk) => {
      const ids = FRONTEND_TO_BACKEND_EDGES[pk] || [];
      backendBlockedEdges.push(...ids);
    });

    const backendBlockedHubs = (scenario.blockedHubs || [])
      .map((h) => HUB_ID_TO_BACKEND[h])
      .filter(Boolean);

    const payload = {
      blocked: [...new Set(backendBlockedHubs)],
      blockedEdges: [...new Set(backendBlockedEdges)],
      rain: (scenario.rainHubs || []).map((h) => HUB_ID_TO_BACKEND[h]).filter(Boolean),
      rainSeverity: scenario.rainSeverity > 1 ? 'heavy' : 'light',
      rush: scenario.rushHour ? true : null,
      disabledLines: scenario.disabledLines || [],
    };

    const res = await fetch('/api/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn('[apiSync] Could not push scenario to backend:', err.message);
    return null;
  }
}

/**
 * Pulls current active scenario from backend API via /api/scenario
 */
export async function fetchScenarioFromBackend(currentScenario) {
  try {
    const res = await fetch('/api/scenario');
    const json = await res.json();
    if (!json.ok || !json.data?.scenario) return currentScenario;

    const bSc = json.data.scenario;
    const blockedEdges = [];
    const edgeStatuses = { ...(currentScenario?.edgeStatuses || {}) };

    (bSc.blockedEdges || []).forEach((bId) => {
      const pk = BACKEND_EDGE_TO_FRONTEND[bId];
      if (pk) {
        blockedEdges.push(pk);
        if (!edgeStatuses[pk]) {
          edgeStatuses[pk] = {
            status: 'blocked',
            reason: 'road_block',
            reasonLabel: 'Road Block',
            updatedAt: Date.now(),
          };
        }
      }
    });

    const blockedHubs = (bSc.blocked || []).map((bH) => BACKEND_HUB_TO_FRONTEND[bH]).filter(Boolean);

    return {
      ...currentScenario,
      blockedEdges: [...new Set([...(currentScenario?.blockedEdges || []), ...blockedEdges])],
      disabledEdges: [...new Set([...(currentScenario?.disabledEdges || []), ...blockedEdges])],
      edgeStatuses,
      blockedHubs: [...new Set([...(currentScenario?.blockedHubs || []), ...blockedHubs])],
      rainHubs: (bSc.rain || []).map((bH) => BACKEND_HUB_TO_FRONTEND[bH]).filter(Boolean),
      rushHour: bSc.rush === true,
    };
  } catch (err) {
    console.warn('[apiSync] Could not fetch scenario from backend:', err.message);
    return currentScenario;
  }
}

/**
 * Clears scenario on the backend API via DELETE /api/scenario
 */
export async function resetScenarioOnBackend() {
  try {
    const res = await fetch('/api/scenario', { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    console.warn('[apiSync] Could not reset scenario on backend:', err.message);
    return null;
  }
}
