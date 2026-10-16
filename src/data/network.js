// PROTOTYPE DATA. Hub coordinates are approximate area centres; times, distances,
// lines and fares are illustrative, not verified Dhaka transit data.
// Replace lat/lng/landmarks with surveyed values before presenting as authoritative.
export const HUBS = [
  { hubId: 'motijheel', name: 'Motijheel', lat: 23.733, lng: 90.4172, landmark: 'Motijheel MRT station / Shapla Chattar' },
  { hubId: 'banasree', name: 'Banasree', lat: 23.7632, lng: 90.4326, landmark: 'Banasree main road stop' },
  { hubId: 'malibagh', name: 'Malibagh', lat: 23.7497, lng: 90.4126, landmark: 'Malibagh rail-gate intersection' },
  { hubId: 'shahbagh', name: 'Shahbagh', lat: 23.7388, lng: 90.3958, landmark: 'Shahbagh intersection / DU MRT side' },
  { hubId: 'farmgate', name: 'Farmgate', lat: 23.7561, lng: 90.3872, landmark: 'Farmgate overpass / MRT station' },
  { hubId: 'science-lab', name: 'Science Lab', lat: 23.7395, lng: 90.3836, landmark: 'Science Lab crossing' },
  { hubId: 'dhanmondi', name: 'Dhanmondi', lat: 23.7461, lng: 90.3742, landmark: 'Dhanmondi 27 / Satmasjid Rd crossing' },
  { hubId: 'mohammadpur', name: 'Mohammadpur', lat: 23.7662, lng: 90.3589, landmark: 'Mohammadpur Bus Stand' },
  { hubId: 'mirpur', name: 'Mirpur', lat: 23.8069, lng: 90.3687, landmark: 'Mirpur-10 roundabout / MRT station' },
  { hubId: 'agargaon', name: 'Agargaon', lat: 23.7775, lng: 90.38, landmark: 'Agargaon MRT station' },
  { hubId: 'mohakhali', name: 'Mohakhali', lat: 23.7781, lng: 90.405, landmark: 'Mohakhali bus terminal flyover' },
  { hubId: 'badda', name: 'Badda', lat: 23.7805, lng: 90.426, landmark: 'Gulshan-Badda link road stop' },
  { hubId: 'uttara', name: 'Uttara', lat: 23.8759, lng: 90.3795, landmark: 'Uttara Center / MRT station' },
  { hubId: 'jatrabari', name: 'Jatrabari', lat: 23.7101, lng: 90.4344, landmark: 'Jatrabari flyover' },
];

export const LINES = {
  'MRT-6': 'MRT Line-6 (Metro Rail)',
  'BUS-A': 'Bus A (Uttara–Motijheel corridor)',
  'BUS-B': 'Bus B (Mohakhali–Badda–Malibagh)',
  'BUS-C': 'Bus C (Malibagh–Shahbagh–Dhanmondi)',
  'BUS-D': 'Bus D (Motijheel–Jatrabari–Banasree)',
  'BUS-E': 'Bus E (Mirpur–Mohammadpur–Dhanmondi)',
  'BUS-F': 'Bus F (Farmgate link)',
  'LEG-1': 'Leguna (Mohakhali–Badda)',
  'LEG-2': 'Leguna (Mohammadpur–Agargaon)',
  'LEG-3': 'Leguna (Farmgate–Science Lab)',
  'RKS-1': 'Rickshaw (Badda ↔ Banasree)',
  'RKS-2': 'Rickshaw (Malibagh ↔ Motijheel)',
  'RKS-3': 'Rickshaw (Science Lab ↔ Dhanmondi)',
  'RKS-4': 'Rickshaw (Farmgate ↔ Science Lab)',
  'RKS-5': 'Rickshaw (Dhanmondi ↔ Mohammadpur)',
  'CNG-1': 'CNG (Motijheel ↔ Jatrabari)',
  'CNG-2': 'CNG (Farmgate ↔ Mohakhali)',
  WALK: 'Walking (Shahbagh ↔ Science Lab)',
};

export const ALL_LINES = [
  { id: 'MRT-6', name: 'MRT Line-6', title: 'MRT Line-6 (Metro Rail)', corridor: 'Uttara ↔ Mirpur ↔ Farmgate ↔ Motijheel', mode: 'metro', icon: '🚇' },
  { id: 'BUS-A', name: 'Bus Line A', title: 'Bus A (Uttara–Motijheel corridor)', corridor: 'Uttara ↔ Mirpur ↔ Farmgate ↔ Motijheel', mode: 'bus', icon: '🚌' },
  { id: 'BUS-B', name: 'Bus Line B', title: 'Bus B (Mohakhali–Badda–Malibagh)', corridor: 'Uttara ↔ Mohakhali ↔ Badda ↔ Malibagh ↔ Motijheel', mode: 'bus', icon: '🚌' },
  { id: 'BUS-C', name: 'Bus Line C', title: 'Bus C (Malibagh–Shahbagh–Dhanmondi)', corridor: 'Malibagh ↔ Shahbagh ↔ Dhanmondi', mode: 'bus', icon: '🚌' },
  { id: 'BUS-D', name: 'Bus Line D', title: 'Bus D (Motijheel–Jatrabari–Banasree)', corridor: 'Motijheel ↔ Jatrabari ↔ Banasree', mode: 'bus', icon: '🚌' },
  { id: 'BUS-E', name: 'Bus Line E', title: 'Bus E (Mirpur–Mohammadpur–Dhanmondi)', corridor: 'Mirpur ↔ Mohammadpur ↔ Dhanmondi', mode: 'bus', icon: '🚌' },
  { id: 'BUS-F', name: 'Bus Line F', title: 'Bus F (Airport–Farmgate Express)', corridor: 'Uttara ↔ Mohakhali ↔ Farmgate ↔ Science Lab', mode: 'bus', icon: '🚌' },
  { id: 'LEG-1', name: 'Leguna 1', title: 'Leguna (Mohakhali–Badda–Uttara)', corridor: 'Uttara ↔ Mohakhali ↔ Badda Connector', mode: 'leguna', icon: '🚐' },
  { id: 'LEG-2', name: 'Leguna 2', title: 'Leguna (Mohammadpur–Agargaon)', corridor: 'Mohammadpur ↔ Agargaon Link', mode: 'leguna', icon: '🚐' },
  { id: 'LEG-3', name: 'Leguna 3', title: 'Leguna (Farmgate–Science Lab)', corridor: 'Farmgate ↔ Science Lab Link', mode: 'leguna', icon: '🚐' },
  { id: 'RKS-1', name: 'Rickshaw 1', title: 'Rickshaw (Badda ↔ Banasree)', corridor: 'Badda ↔ Banasree Local', mode: 'rickshaw', icon: '🛺' },
  { id: 'RKS-2', name: 'Rickshaw 2', title: 'Rickshaw (Malibagh ↔ Motijheel)', corridor: 'Malibagh ↔ Motijheel Local', mode: 'rickshaw', icon: '🛺' },
  { id: 'RKS-3', name: 'Rickshaw 3', title: 'Rickshaw (Science Lab ↔ Dhanmondi)', corridor: 'Science Lab ↔ Dhanmondi Local', mode: 'rickshaw', icon: '🛺' },
  { id: 'RKS-4', name: 'Rickshaw 4', title: 'Rickshaw (Farmgate ↔ Science Lab)', corridor: 'Farmgate ↔ Science Lab Local', mode: 'rickshaw', icon: '🛺' },
  { id: 'RKS-5', name: 'Rickshaw 5', title: 'Rickshaw (Dhanmondi ↔ Mohammadpur)', corridor: 'Dhanmondi ↔ Mohammadpur Local', mode: 'rickshaw', icon: '🛺' },
  { id: 'CNG-1', name: 'CNG 1', title: 'CNG (Motijheel ↔ Jatrabari)', corridor: 'Motijheel ↔ Jatrabari Connector', mode: 'cng', icon: '🛺' },
  { id: 'CNG-2', name: 'CNG 2', title: 'CNG (Farmgate ↔ Mohakhali ↔ Uttara)', corridor: 'Farmgate ↔ Mohakhali ↔ Uttara Connector', mode: 'cng', icon: '🛺' },
  { id: 'WALK', name: 'Pedestrian Walkway', title: 'Walking (Shahbagh ↔ Science Lab)', corridor: 'Shahbagh ↔ Science Lab Footpath', mode: 'walking', icon: '🚶' },
];

// Exactly 17 direct road connections (edges) on the Dhaka transit network
// [hubA, hubB, km, ...[lineId, mode, baseMinutes]]  (each link is created in both directions)
const L = (a, b, km, ...s) => ({ a, b, km, s });
const LINKS = [
  L('uttara', 'mirpur', 8.5, ['MRT-6', 'metro', 14], ['BUS-A', 'bus', 32]),
  L('mirpur', 'agargaon', 4.5, ['MRT-6', 'metro', 8], ['BUS-A', 'bus', 20], ['BUS-E', 'bus', 18]),
  L('agargaon', 'farmgate', 2.5, ['MRT-6', 'metro', 5], ['BUS-A', 'bus', 12]),
  L('farmgate', 'shahbagh', 2.5, ['MRT-6', 'metro', 5], ['BUS-A', 'bus', 12]),
  L('shahbagh', 'motijheel', 2.8, ['MRT-6', 'metro', 6], ['BUS-A', 'bus', 14]),
  L('agargaon', 'mohakhali', 3.5, ['BUS-B', 'bus', 16]),
  L('mohakhali', 'badda', 3.5, ['BUS-B', 'bus', 16], ['LEG-1', 'leguna', 14]),
  L('mohakhali', 'uttara', 10.5, ['BUS-B', 'bus', 32], ['BUS-F', 'bus', 28], ['CNG-2', 'cng', 22], ['LEG-1', 'leguna', 26]),
  L('badda', 'banasree', 3.5, ['BUS-B', 'bus', 15], ['RKS-1', 'rickshaw', 22]),
  L('banasree', 'malibagh', 3.5, ['BUS-B', 'bus', 14]),
  L('malibagh', 'motijheel', 2.5, ['BUS-B', 'bus', 12], ['RKS-2', 'rickshaw', 18]),
  L('farmgate', 'science-lab', 2.0, ['BUS-F', 'bus', 10], ['RKS-4', 'rickshaw', 12], ['LEG-3', 'leguna', 9]),
  L('shahbagh', 'science-lab', 1.8, ['BUS-C', 'bus', 8], ['WALK', 'walking', 22]),
  L('science-lab', 'dhanmondi', 1.5, ['BUS-C', 'bus', 8], ['RKS-3', 'rickshaw', 9]),
  L('farmgate', 'mohakhali', 3.0, ['BUS-F', 'bus', 14], ['CNG-2', 'cng', 11]),
  L('dhanmondi', 'mohammadpur', 2.5, ['BUS-E', 'bus', 12], ['RKS-5', 'rickshaw', 15]),
  L('motijheel', 'jatrabari', 3.5, ['BUS-D', 'bus', 15], ['CNG-1', 'cng', 12]),
];

// Exactly 17 direct road connections (edges) for admin dispatcher & routing
export const ROAD_EDGES = LINKS.map((l, index) => {
  const hA = HUBS.find((h) => h.hubId === l.a)?.name || l.a;
  const hB = HUBS.find((h) => h.hubId === l.b)?.name || l.b;
  const pairKey = [l.a, l.b].sort().join('|');
  const modes = [...new Set(l.s.map((s) => s[1]))];
  const mainMode = modes.includes('metro')
    ? 'metro'
    : modes.includes('bus')
    ? 'bus'
    : modes.includes('leguna')
    ? 'leguna'
    : modes.includes('rickshaw')
    ? 'rickshaw'
    : modes.includes('cng')
    ? 'cng'
    : 'walking';
  const icon =
    mainMode === 'metro'
      ? '🚇'
      : mainMode === 'bus'
      ? '🚌'
      : mainMode === 'leguna'
      ? '🚐'
      : mainMode === 'rickshaw' || mainMode === 'cng'
      ? '🛺'
      : '🚶';
  return {
    id: `ROAD-${index + 1}`,
    pairKey,
    fromHubId: l.a,
    toHubId: l.b,
    fromName: hA,
    toName: hB,
    name: `${hA} → ${hB}`,
    label: `${hA} ↔ ${hB}`,
    title: `${hA} ↔ ${hB} (${l.km} km)`,
    corridor: `${hA} → ${hB}`,
    km: l.km,
    services: l.s.map((s) => s[0]),
    modes,
    mode: mainMode,
    icon,
  };
});

export const EDGES = LINKS.flatMap((l) =>
  [[l.a, l.b], [l.b, l.a]].map(([f, t]) => ({
    edgeId: `${f}>${t}`,
    pairKey: [l.a, l.b].sort().join('|'),
    fromHubId: f,
    toHubId: t,
    distanceKm: l.km,
    services: l.s.map(([lineId, mode, baseTimeMinutes]) => ({
      serviceId: `${lineId}:${f}>${t}`, lineId, mode, baseTimeMinutes,
      isEnabled: true, studentEligible: mode === 'bus',
    })),
  }))
);
