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
  'MRT-6': 'MRT Line-6 (Metro)', 'BUS-A': 'Bus A (Uttara–Motijheel corridor)', 'BUS-B': 'Bus B (Mohakhali–Badda–Malibagh)',
  'BUS-C': 'Bus C (Malibagh–Shahbagh–Dhanmondi)', 'BUS-D': 'Bus D (Motijheel–Jatrabari–Banasree)',
  'BUS-E': 'Bus E (Mirpur–Mohammadpur–Dhanmondi)', 'BUS-F': 'Bus F (Farmgate link)',
  'LEG-1': 'Leguna (Mohakhali–Badda)', 'LEG-2': 'Leguna (Mohammadpur–Agargaon)', 'LEG-3': 'Leguna (Farmgate–Science Lab)',
  'RKS-1': 'Rickshaw', 'RKS-2': 'Rickshaw', 'RKS-3': 'Rickshaw', 'RKS-4': 'Rickshaw', 'RKS-5': 'Rickshaw',
  'CNG-1': 'CNG', 'CNG-2': 'CNG', WALK: 'Walking',
};

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
  L('mohakhali', 'uttara', 10.5, ['BUS-B', 'bus', 32]),
  L('badda', 'banasree', 3.5, ['BUS-B', 'bus', 15], ['RKS-1', 'rickshaw', 22]),
  L('banasree', 'malibagh', 3.5, ['BUS-B', 'bus', 14]),
  L('malibagh', 'motijheel', 2.5, ['BUS-B', 'bus', 12], ['RKS-2', 'rickshaw', 18]),
  L('malibagh', 'shahbagh', 3, ['BUS-C', 'bus', 14]),
  L('shahbagh', 'science-lab', 1.8, ['BUS-C', 'bus', 8], ['WALK', 'walking', 22]),
  L('science-lab', 'dhanmondi', 1.5, ['BUS-C', 'bus', 8], ['RKS-3', 'rickshaw', 9]),
  L('farmgate', 'science-lab', 2, ['BUS-F', 'bus', 10], ['RKS-4', 'rickshaw', 12], ['LEG-3', 'leguna', 9]),
  L('farmgate', 'mohakhali', 3, ['BUS-F', 'bus', 14], ['CNG-2', 'cng', 11]),
  L('dhanmondi', 'mohammadpur', 2.5, ['BUS-E', 'bus', 12], ['RKS-5', 'rickshaw', 15]),
  L('mohammadpur', 'mirpur', 6, ['BUS-E', 'bus', 25]),
  L('mohammadpur', 'agargaon', 3.2, ['BUS-E', 'bus', 14], ['LEG-2', 'leguna', 12]),
  L('motijheel', 'jatrabari', 3.5, ['BUS-D', 'bus', 15], ['CNG-1', 'cng', 12]),
  L('jatrabari', 'banasree', 5.5, ['BUS-D', 'bus', 20]),
];

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
