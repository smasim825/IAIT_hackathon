import React, { useState } from 'react';
import { HUBS, LINES } from '../data/network.js';

const LINE_DETAILS = [
  {
    id: 'MRT-6',
    name: 'MRT Line-6 (Metro Rail)',
    mode: 'metro',
    corridor: 'Uttara ➔ Mirpur ➔ Agargaon ➔ Farmgate ➔ Shahbagh ➔ Motijheel',
    speed: 'High speed (32 km/h avg)',
    fare: '৳20 minimum, ৳100 maximum cap',
    studentDiscount: false,
    frequency: 'Every 6-8 mins',
  },
  {
    id: 'BUS-A',
    name: 'Bus A (Uttara–Motijheel Direct Corridor)',
    mode: 'bus',
    corridor: 'Uttara ➔ Mirpur ➔ Agargaon ➔ Farmgate ➔ Shahbagh ➔ Motijheel',
    speed: 'Medium (Subject to surface traffic)',
    fare: '৳2.45/km (Min ৳10)',
    studentDiscount: true,
    frequency: 'Every 5-10 mins',
  },
  {
    id: 'BUS-B',
    name: 'Bus B (Mohakhali–Badda–Malibagh Arterial)',
    mode: 'bus',
    corridor: 'Uttara ➔ Mohakhali ➔ Badda ➔ Banasree ➔ Malibagh ➔ Motijheel',
    speed: 'Medium',
    fare: '৳2.45/km (Min ৳10)',
    studentDiscount: true,
    frequency: 'Every 10 mins',
  },
  {
    id: 'BUS-C',
    name: 'Bus C (Malibagh–Shahbagh–Dhanmondi Link)',
    mode: 'bus',
    corridor: 'Malibagh ➔ Shahbagh ➔ Science Lab ➔ Dhanmondi',
    speed: 'Slow to Medium',
    fare: '৳2.45/km (Min ৳10)',
    studentDiscount: true,
    frequency: 'Every 8-12 mins',
  },
  {
    id: 'BUS-D',
    name: 'Bus D (Motijheel–Jatrabari–Banasree South Loop)',
    mode: 'bus',
    corridor: 'Motijheel ➔ Jatrabari ➔ Banasree',
    speed: 'Medium',
    fare: '৳2.45/km (Min ৳10)',
    studentDiscount: true,
    frequency: 'Every 12 mins',
  },
  {
    id: 'BUS-E',
    name: 'Bus E (Mirpur–Mohammadpur–Dhanmondi Ring)',
    mode: 'bus',
    corridor: 'Mirpur ➔ Mohammadpur ➔ Dhanmondi / Agargaon',
    speed: 'Medium',
    fare: '৳2.45/km (Min ৳10)',
    studentDiscount: true,
    frequency: 'Every 8 mins',
  },
  {
    id: 'BUS-F',
    name: 'Bus F (Farmgate–Mohakhali–Science Lab Link)',
    mode: 'bus',
    corridor: 'Farmgate ➔ Science Lab / Mohakhali',
    speed: 'Medium',
    fare: '৳2.45/km (Min ৳10)',
    studentDiscount: true,
    frequency: 'Every 10 mins',
  },
  {
    id: 'LEG-1',
    name: 'Leguna 1 (Mohakhali–Badda Feeder)',
    mode: 'leguna',
    corridor: 'Mohakhali ➔ Badda',
    speed: 'Agile feeder van',
    fare: 'Flat ৳15',
    studentDiscount: false,
    frequency: 'Every 3-5 mins',
  },
  {
    id: 'LEG-2',
    name: 'Leguna 2 (Mohammadpur–Agargaon Link)',
    mode: 'leguna',
    corridor: 'Mohammadpur ➔ Agargaon',
    speed: 'Agile feeder van',
    fare: 'Flat ৳12',
    studentDiscount: false,
    frequency: 'Continuous queue',
  },
  {
    id: 'LEG-3',
    name: 'Leguna 3 (Farmgate–Science Lab Shortcut)',
    mode: 'leguna',
    corridor: 'Farmgate ➔ Science Lab',
    speed: 'Agile feeder van',
    fare: 'Flat ৳15',
    studentDiscount: false,
    frequency: 'Every 4 mins',
  },
  {
    id: 'CNG-1',
    name: 'CNG Connector (Motijheel–Jatrabari)',
    mode: 'cng',
    corridor: 'Motijheel ↔ Jatrabari flyover base',
    speed: 'Express 3-wheeler',
    fare: '৳40–৳60 negotiated',
    studentDiscount: false,
    frequency: 'On-demand stand',
  },
  {
    id: 'RKS-LOCAL',
    name: 'Rickshaw Connectors (Local Dhaka Alleys)',
    mode: 'rickshaw',
    corridor: 'Dhanmondi, Science Lab, Banasree, Badda local short links',
    speed: 'Short haul (8–12 km/h)',
    fare: '৳20 base + ৳20–30/km',
    studentDiscount: false,
    frequency: 'Every corner',
  },
];

export default function NetworkDirectory({ landmarks, blockedHubs = [] }) {
  const [activeTab, setActiveTab] = useState('lines');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');

  const filteredLines = LINE_DETAILS.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.corridor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = selectedMode === 'all' || l.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const filteredHubs = HUBS.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="network-directory-container">
      <div className="panel-header">
        <div className="title-with-badge">
          <h2>🗺️ Dhaka Transit Network Directory</h2>
          <span className="badge-pill active">14 Hubs · 12 Major Lines</span>
        </div>
        <p className="panel-desc">
          Official directory of transit corridors, feeder legunas, and landmark boarding guidelines across Dhaka.
        </p>
      </div>

      <div className="network-nav-row">
        <div className="tab-group-pills">
          <button
            type="button"
            className={`pill-tab ${activeTab === 'lines' ? 'active' : ''}`}
            onClick={() => setActiveTab('lines')}
          >
            Transit Lines & Corridors ({LINE_DETAILS.length})
          </button>
          <button
            type="button"
            className={`pill-tab ${activeTab === 'hubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('hubs')}
          >
            Major Hubs & Landmark Notes ({HUBS.length})
          </button>
        </div>

        <input
          type="text"
          className="search-input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'lines' ? 'Filter by line or stop...' : 'Filter by hub name...'}
        />
      </div>

      {activeTab === 'lines' ? (
        <div className="lines-view">
          <div className="mode-filter-chips">
            {['all', 'metro', 'bus', 'leguna', 'cng', 'rickshaw'].map((m) => (
              <button
                key={m}
                type="button"
                className={`filter-chip ${selectedMode === m ? 'active' : ''}`}
                onClick={() => setSelectedMode(m)}
              >
                {m === 'all' && 'All Modes'}
                {m === 'metro' && '🚆 MRT-6 Metro'}
                {m === 'bus' && '🚌 Local Buses'}
                {m === 'leguna' && '🚐 Legunas'}
                {m === 'cng' && '🛺 CNG'}
                {m === 'rickshaw' && '🛺 Rickshaw'}
              </button>
            ))}
          </div>

          <div className="lines-grid">
            {filteredLines.map((line) => (
              <div key={line.id} className={`line-card mode-${line.mode}`}>
                <div className="line-card-header">
                  <span className="line-id-tag">{line.id}</span>
                  <span className="line-mode-badge">{line.mode.toUpperCase()}</span>
                </div>
                <h3 className="line-name">{line.name}</h3>
                <p className="line-corridor">
                  <b>Corridor:</b> {line.corridor}
                </p>
                <div className="line-specs-row">
                  <div>
                    <span className="muted small">Fare:</span>
                    <br />
                    <b>{line.fare}</b>
                  </div>
                  <div>
                    <span className="muted small">Student 50%:</span>
                    <br />
                    <b>{line.studentDiscount ? '✅ Yes (BRTA)' : '❌ Not applicable'}</b>
                  </div>
                  <div>
                    <span className="muted small">Frequency:</span>
                    <br />
                    <b>{line.frequency}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="hubs-grid">
          {filteredHubs.map((hub) => {
            const isBlocked = blockedHubs.includes(hub.hubId);
            const landmarkNote = landmarks[hub.hubId];
            return (
              <div key={hub.hubId} className={`hub-card ${isBlocked ? 'blocked' : ''}`}>
                <div className="hub-card-header">
                  <h3 className="hub-name-title">{hub.name}</h3>
                  <span className={`status-pill ${isBlocked ? 'danger' : 'success'}`}>
                    {isBlocked ? '⛔ Disrupted / Blocked' : '🟢 Operational'}
                  </span>
                </div>
                <div className="hub-coord-row">
                  <span>Coordinates: {hub.lat}, {hub.lng}</span>
                </div>
                <div className="hub-landmark-block">
                  <div className="landmark-entry">
                    <span className="lang-tag">EN</span>
                    <span>{landmarkNote?.en || hub.landmark}</span>
                  </div>
                  {landmarkNote?.bn && (
                    <div className="landmark-entry">
                      <span className="lang-tag">Banglish</span>
                      <span>{landmarkNote.bn}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
