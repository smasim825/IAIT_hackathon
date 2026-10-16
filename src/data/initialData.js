// Dhaka transit seed data & mock state for DhakaPath UI
export const INITIAL_LANDMARKS = {
  motijheel: {
    en: 'Motijheel MRT station / Shapla Chattar (Exit 2 for south bus stand)',
    bn: 'Motijheel MRT station / Shapla Chattar (South bus stand er jonno Exit 2 theke ber hon)',
  },
  farmgate: {
    en: 'Farmgate overpass / MRT station (West side bus bay near Ananda Cinema)',
    bn: 'Farmgate overpass / MRT station (Ananda Cinema r kache West side bus bay theke uthun)',
  },
  dhanmondi: {
    en: 'Dhanmondi 27 / Satmasjid Rd crossing (Board B4 near Star Kabab signal)',
    bn: 'Dhanmondi 27 / Satmasjid Rd crossing (Star Kabab signal er kache B4 e uthun)',
  },
  mirpur: {
    en: 'Mirpur-10 roundabout / MRT station (Pillar 242 underpass bus queue)',
    bn: 'Mirpur-10 roundabout / MRT station (Pillar 242 er niche bus queue)',
  },
  'science-lab': {
    en: 'Science Lab crossing (Near Priyangon shopping centre footover bridge)',
    bn: 'Science Lab crossing (Priyangon shopping centre footover bridge er kache)',
  },
  shahbagh: {
    en: 'Shahbagh intersection / DU MRT side (Opposite BSMMU emergency gate)',
    bn: 'Shahbagh intersection / DU MRT side (BSMMU emergency gate er samne)',
  },
  uttara: {
    en: 'Uttara Center / MRT station (Sector 7 bus stoppage on Dhaka-Mymensingh Hwy)',
    bn: 'Uttara Center / MRT station (Sector 7 bus stand, Dhaka-Mymensingh Highway)',
  },
  mohammadpur: {
    en: 'Mohammadpur Bus Stand (Near Town Hall market and rickshaw stand)',
    bn: 'Mohammadpur Bus Stand (Town Hall market er samne rickshaw stand)',
  },
  agargaon: {
    en: 'Agargaon MRT station (Passport office link road crossing)',
    bn: 'Agargaon MRT station (Passport office link road crossing)',
  },
  mohakhali: {
    en: 'Mohakhali bus terminal flyover / Amtoli crossing',
    bn: 'Mohakhali bus terminal flyover / Amtoli crossing er niche',
  },
  badda: {
    en: 'Gulshan-Badda link road stop (Near Suvastu Nazar Valley)',
    bn: 'Gulshan-Badda link road stop (Suvastu Nazar Valley r kache)',
  },
  jatrabari: {
    en: 'Jatrabari flyover / Mayor Hanif entry gate',
    bn: 'Jatrabari flyover / Mayor Hanif entry gate er kache',
  },
  malibagh: {
    en: 'Malibagh rail-gate intersection / Abahani club field',
    bn: 'Malibagh rail-gate intersection / Abahani club field',
  },
  banasree: {
    en: 'Banasree main road block C / rampura bridge approach',
    bn: 'Banasree main road block C / rampura bridge approach er kache',
  },
};

export const INITIAL_ALERTS = [
  {
    id: 'alt-1',
    hubId: 'science-lab',
    type: 'waterlogging',
    title: 'Waterlogging at Science Lab crossing',
    text: 'Knee-deep water after sudden rain; rickshaws charging double, local buses crawling at 5 km/h.',
    rawText: 'Science Lab e hatu pani!! rickshaw o double bhara dabi korse, bus crawling',
    confidence: 0.85,
    status: 'active',
    severity: 'high',
    source: 'ai_ingest',
    confirmations: 6,
    upvotedByMe: false,
    reportedAt: '12 min ago',
    timestamp: Date.now() - 12 * 60000,
    impact: 'Avoid intersection; detour recommended via Farmgate.',
  },
  {
    id: 'alt-2',
    hubId: 'shahbagh',
    type: 'blockade',
    title: 'Student demonstration near Shahbagh roundabout',
    text: 'Shahbagh traffic redirected via Katabon. Bus C line delayed by ~15 min.',
    rawText: 'Shahbagh e chattro rally, rasta block, Katabon diye ghuraye dicche',
    confidence: 0.74,
    status: 'active',
    severity: 'medium',
    source: 'user',
    confirmations: 4,
    upvotedByMe: false,
    reportedAt: '25 min ago',
    timestamp: Date.now() - 25 * 60000,
    impact: 'Use MRT-6 Metro to bypass surface gridlock completely.',
  },
  {
    id: 'alt-3',
    hubId: 'farmgate',
    type: 'gridlock',
    title: 'Traffic congestion under Farmgate overpass',
    text: 'VIP motorcade clearance slowed north-bound bus lanes.',
    rawText: 'Farmgate e jhamela, bus er boro line',
    confidence: 0.42,
    status: 'unverified',
    severity: 'low',
    source: 'user',
    confirmations: 1,
    upvotedByMe: false,
    reportedAt: '6 min ago',
    timestamp: Date.now() - 6 * 60000,
    impact: 'Soft delay +5 min for Bus A and Bus F.',
  },
  {
    id: 'alt-4',
    hubId: 'mirpur',
    type: 'construction',
    title: 'Road repair on Begum Rokeya Sarani',
    text: 'Single lane closed near Mirpur-10 pillar 240. Metro running on full schedule.',
    rawText: 'Mirpur 10 e road repairing cholche',
    confidence: 0.90,
    status: 'active',
    severity: 'medium',
    source: 'admin',
    confirmations: 12,
    upvotedByMe: false,
    reportedAt: '1 hour ago',
    timestamp: Date.now() - 60 * 60000,
    impact: 'Bus travel time increased by 8 minutes.',
  },
];

export const INITIAL_MODERATION_QUEUE = [
  {
    id: 'mod-1',
    hubId: 'dhanmondi',
    type: 'blockade',
    text: 'Dhanmondi 27 e tree branch fallen on electric wire, rasta bondho pray',
    submitter: 'Commuter #842',
    confidence: 0.35,
    submittedAt: '3 min ago',
    status: 'pending',
  },
  {
    id: 'mod-2',
    hubId: 'mohakhali',
    type: 'gridlock',
    text: 'Mohakhali flyover niche CNG strike, extra 60 taka dabi korse sobai',
    submitter: 'Commuter #129',
    confidence: 0.30,
    submittedAt: '8 min ago',
    status: 'pending',
  },
];

export const INITIAL_FARE_CONFIG = {
  busPerKm: 2.45,
  busMinimum: 10,
  studentDiscountPct: 50,
  metroPerKm: 5,
  metroMinimum: 20,
  metroMaximum: 100,
  rickshawLowPerKm: 20,
  rickshawHighPerKm: 30,
  rickshawMinimum: 20,
  cngLowPerKm: 35,
  cngHighPerKm: 50,
  cngMinimum: 60,
  fuelAdjustmentPct: 0, // Admin fuel surcharge slider (-20% to +50%)
  notice: 'BRTA 2026 Gazetted Baseline Fares',
};

export const INITIAL_AUDIT_LOG = [
  { id: 'aud-1', time: '14:15', actor: 'Admin (System)', action: 'Initialized baseline BRTA fare schedule (v1.0)' },
  { id: 'aud-2', time: '14:05', actor: 'Admin (System)', action: 'Verified Alert: Mirpur road repair published' },
  { id: 'aud-3', time: '13:48', actor: 'Automated Bot', action: 'Ingested 2 community reports from social channels' },
];
