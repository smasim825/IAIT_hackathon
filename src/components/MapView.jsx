import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { edgeStatus } from '../engine/router.js';

export const COLORS = { cheapest: '#2563eb', fastest: '#16a34a', balanced: '#7c3aed', backup: '#f97316' };

// Fine-tuned label directions so neighbouring hubs never overlap each other
const HUB_DIRECTIONS = {
  'agargaon': 'left',
  'science-lab': 'left',
  'dhanmondi': 'left',
};

// Create custom high-contrast HTML markers for all 14 Dhaka transit hubs
const createHubIcon = (hub, isOrigin, isDest, isOnRoute, isBlocked, routeColor) => {
  if (isOrigin) {
    return L.divIcon({
      className: 'hub-icon-container',
      html: `<div class="hub-pin origin-pin" title="Origin (A): ${hub.name}"><span class="pin-letter">A</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }
  if (isDest) {
    return L.divIcon({
      className: 'hub-icon-container',
      html: `<div class="hub-pin dest-pin" title="Destination (B): ${hub.name}"><span class="pin-letter">B</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }
  if (isBlocked) {
    return L.divIcon({
      className: 'hub-icon-container',
      html: `<div class="hub-marker blocked-marker" title="Blocked: ${hub.name}"><span class="marker-symbol">⛔</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }
  if (isOnRoute) {
    return L.divIcon({
      className: 'hub-icon-container',
      html: `<div class="hub-marker on-route-marker" style="--route-color: ${routeColor};" title="Route Stop: ${hub.name}"><div class="marker-core"></div></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  }
  // Standard transit hub: high-contrast dark station ring with inner teal core
  return L.divIcon({
    className: 'hub-icon-container',
    html: `<div class="hub-marker standard-marker" title="${hub.name} Transit Station"><div class="marker-core"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const valid = (h) => Number.isFinite(h.lat) && Number.isFinite(h.lng) && Math.abs(h.lat) <= 90 && Math.abs(h.lng) <= 180;

function FitAndResize({ bounds, fitKey, panelOpen, viewAll }) {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => {
    map.invalidateSize();
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [fitKey, panelOpen, viewAll]);
  return null;
}

export default function MapView({
  hubs,
  edges,
  scenario,
  origin,
  destination,
  displayed,
  displayedKind,
  others,
  panelOpen,
  onSetOrigin,
  onSetDest,
}) {
  const [viewAll, setViewAll] = useState(false);
  const good = useMemo(() => hubs.filter(valid), [hubs]);
  const pos = useMemo(() => new Map(good.map((h) => [h.hubId, [h.lat, h.lng]])), [good]);
  const pairs = useMemo(() => [...new Set(edges.map((e) => e.pairKey))], [edges]);
  const line = (r) => r.hubIds.map((h) => pos.get(h)).filter(Boolean);
  const routeHubs = new Set(displayed?.hubIds || []);
  const bounds = (displayed && !viewAll) ? line(displayed) : good.map((h) => [h.lat, h.lng]);
  const fitKey = (displayed && !viewAll) ? displayed.routeId : 'all';
  const col = COLORS[displayedKind] || '#111';

  return (
    <div className="map-container-relative" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <button
        type="button"
        className="map-view-toggle"
        onClick={() => setViewAll(!viewAll)}
        title={viewAll ? 'Focus selected route' : 'Show all 14 Dhaka transit hubs'}
      >
        {viewAll ? '🎯 Focus Route' : `🗺 Show All 14 Hubs (${good.length})`}
      </button>

      <MapContainer center={[23.76, 90.39]} zoom={12} className="map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitAndResize bounds={bounds} fitKey={fitKey} panelOpen={panelOpen} viewAll={viewAll} />

        {/* Transit Network Connections */}
        {pairs.map((k) => {
          const [a, b] = k.split('|');
          if (!pos.has(a) || !pos.has(b)) return null;
          const st = edgeStatus(k, scenario);
          return (
            <Polyline
              key={k}
              positions={[pos.get(a), pos.get(b)]}
              pathOptions={st.blocked
                ? { color: '#dc2626', weight: 4, dashArray: '4 8', opacity: 0.9 }
                : { color: '#64748b', weight: 3, opacity: 0.65 }
              }
            >
              <Tooltip sticky className="edge-tooltip">
                <div style={{ fontWeight: 700, fontSize: '12px' }}>{a} ↔ {b}</div>
                {st.blocked && <div style={{ color: '#dc2626', fontWeight: 600 }}>BLOCKED / UNAVAILABLE (simulated)</div>}
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  {st.services.map((x) => (
                    <div key={x.lineId}>{x.lineId} ({x.mode}){x.reason ? ` ✕ ${x.reason}` : ''}</div>
                  ))}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Alternative / Inactive Routes */}
        {others.map((r) => (
          <Polyline
            key={r.routeId}
            positions={line(r)}
            pathOptions={{
              color: COLORS[r.kind],
              weight: 5,
              opacity: 0.35,
              dashArray: r.kind === 'backup' ? '8 8' : undefined,
            }}
          />
        ))}

        {/* Active Selected Route */}
        {displayed && (
          <Polyline
            key={displayed.routeId}
            positions={line(displayed)}
            pathOptions={{
              color: col,
              weight: 8,
              opacity: 0.95,
              dashArray: displayedKind === 'backup' ? '12 10' : undefined,
            }}
          />
        )}

        {/* 14 High-Visibility Dhaka Transit Hubs */}
        {good.map((h) => {
          const blocked = scenario.blockedHubs.includes(h.hubId);
          const isO = h.hubId === origin;
          const isD = h.hubId === destination;
          const isOnRoute = routeHubs.has(h.hubId);
          const dir = HUB_DIRECTIONS[h.hubId] || 'right';
          const icon = createHubIcon(h, isO, isD, isOnRoute, blocked, col);
          const zIndex = isO || isD ? 1200 : isOnRoute ? 900 : 600;

          return (
            <Marker
              key={h.hubId}
              position={[h.lat, h.lng]}
              icon={icon}
              zIndexOffset={zIndex}
            >
              <Tooltip
                permanent
                direction={dir}
                offset={dir === 'left' ? [-14, 0] : [14, 0]}
                className={`hub-tooltip ${isO ? 'tt-origin' : ''} ${isD ? 'tt-dest' : ''} ${isOnRoute ? 'tt-route' : ''} ${blocked ? 'tt-blocked' : ''}`}
              >
                <div className="hub-tooltip-content" style={isOnRoute ? { '--route-color': col } : undefined}>
                  {isO && <span className="hub-badge badge-origin">A</span>}
                  {isD && <span className="hub-badge badge-dest">B</span>}
                  {isOnRoute && !isO && !isD && <span className="hub-badge badge-route">STOP</span>}
                  <span className="hub-name">{h.name}</span>
                  {blocked && <span className="hub-badge badge-blocked">⛔ Blocked</span>}
                </div>
              </Tooltip>

              <Popup className="hub-popup" offset={[0, -12]}>
                <div className="hub-popup-content">
                  <div className="popup-header">
                    <h4>{h.name}</h4>
                    {blocked && <span className="popup-badge-blocked">Blocked</span>}
                  </div>
                  <p className="landmark">📍 {h.landmark}</p>
                  <div className="popup-actions">
                    <button
                      type="button"
                      className="btn-set-origin"
                      onClick={() => onSetOrigin && onSetOrigin(h.hubId)}
                      disabled={isO}
                    >
                      {isO ? '✓ Current Start (A)' : 'Set as Start (A)'}
                    </button>
                    <button
                      type="button"
                      className="btn-set-dest"
                      onClick={() => onSetDest && onSetDest(h.hubId)}
                      disabled={isD}
                    >
                      {isD ? '✓ Current End (B)' : 'Set as Destination (B)'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
