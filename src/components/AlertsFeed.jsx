import React, { useState } from 'react';
import { HUBS } from '../data/network.js';

const SAMPLE_POSTS = [
  'Science Lab e hatu pani!! rickshaw o jacche na, bus crawling',
  'Shahbagh e chattro protest, rasta block, Katabon diye ghuraye dicche',
  'Mohakhali flyover niche CNG strike, extra 60 taka dabi korse sobai',
  'Farmgate e VIP movement er jonno north-bound bus bay jam',
  'Mirpur-10 e road repair er jonno one lane bondho',
];

export default function AlertsFeed({ alerts, onAddAlert, onConfirmAlert }) {
  const [filter, setFilter] = useState('all');
  const [postText, setPostText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'active') return a.confidence >= 0.6;
    if (filter === 'unverified') return a.confidence < 0.6;
    if (filter === 'waterlogging') return a.type === 'waterlogging';
    if (filter === 'blockade') return a.type === 'blockade';
    return true;
  });

  const handleSampleClick = (sample) => {
    setPostText(sample);
  };

  const handleIngestSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      // Rule-based parsing simulation
      const text = postText.toLowerCase();
      let detectedHub = 'science-lab';
      if (text.includes('mirpur')) detectedHub = 'mirpur';
      else if (text.includes('shahbagh')) detectedHub = 'shahbagh';
      else if (text.includes('farmgate')) detectedHub = 'farmgate';
      else if (text.includes('dhanmondi')) detectedHub = 'dhanmondi';
      else if (text.includes('mohakhali')) detectedHub = 'mohakhali';
      else if (text.includes('motijheel')) detectedHub = 'motijheel';
      else if (text.includes('uttara')) detectedHub = 'uttara';
      else if (text.includes('badda')) detectedHub = 'badda';

      let detectedType = 'gridlock';
      if (text.includes('pani') || text.includes('water') || text.includes('rain')) detectedType = 'waterlogging';
      else if (text.includes('block') || text.includes('protest') || text.includes('strike') || text.includes('rally')) detectedType = 'blockade';
      else if (text.includes('repair') || text.includes('construction')) detectedType = 'construction';

      const newAlert = {
        id: `alt-${Date.now()}`,
        hubId: detectedHub,
        type: detectedType,
        title: `Crowdsourced Report: ${detectedType.toUpperCase()} near ${HUBS.find((h) => h.hubId === detectedHub)?.name || detectedHub}`,
        text: postText,
        rawText: postText,
        confidence: 0.35, // low initial confidence
        status: 'unverified',
        severity: detectedType === 'waterlogging' ? 'high' : 'medium',
        source: 'ai_ingest',
        confirmations: 1,
        upvotedByMe: true,
        reportedAt: 'Just now',
        timestamp: Date.now(),
        impact: 'Unverified crowdsourced report. Needs commuter confirmations to trigger automatic routing detours.',
      };

      onAddAlert(newAlert);
      setIsSubmitting(false);
      setSuccessMsg(`Extracted! Filed as unverified ${detectedType} near ${HUBS.find((h) => h.hubId === detectedHub)?.name}.`);
      setPostText('');
      setTimeout(() => setSuccessMsg(''), 4500);
    }, 400);
  };

  return (
    <div className="alerts-feed-container">
      <div className="panel-header">
        <div className="title-with-badge">
          <h2>⚠️ Street Alerts & Disruption Radar</h2>
          <span className="badge-pill active">{alerts.length} Live Reports</span>
        </div>
        <p className="panel-desc">
          Real-time street hazards, monsoon waterlogging, and student or political blockades verified by commuter consensus.
        </p>
      </div>

      {/* CROWDSOURCE INGESTOR CARD */}
      <div className="card-elevated ingestor-card">
        <div className="ingestor-header">
          <h3>📢 Paste a Street Post (Crowdsourced Ingestor)</h3>
          <span className="badge-pill subtle">AI & Rule-Based Ingest</span>
        </div>
        <p className="small muted">
          Paste a raw social post or message in English or Banglish. The engine extracts the hub and hazard type, placing it in the unverified queue (0.35 trust).
        </p>

        <form onSubmit={handleIngestSubmit}>
          <textarea
            className="styled-textarea"
            rows="3"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="e.g. Science Lab e hatu pani!! rickshaw o jacche na, rasta bondho..."
          />

          <div className="sample-chips-row">
            <span className="chips-label">Try sample:</span>
            {SAMPLE_POSTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-sample"
                onClick={() => handleSampleClick(sample)}
              >
                "{sample.slice(0, 28)}..."
              </button>
            ))}
          </div>

          <div className="ingestor-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !postText.trim()}
            >
              {isSubmitting ? 'Analyzing & Extracting...' : 'Extract & File Street Alert'}
            </button>
            {successMsg && <span className="success-toast">{successMsg}</span>}
          </div>
        </form>
      </div>

      {/* FILTER TABS */}
      <div className="filter-bar">
        <button
          type="button"
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Confirmed (≥0.60)
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'unverified' ? 'active' : ''}`}
          onClick={() => setFilter('unverified')}
        >
          Unverified (&lt;0.60)
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'waterlogging' ? 'active' : ''}`}
          onClick={() => setFilter('waterlogging')}
        >
          🌧️ Waterlogging
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'blockade' ? 'active' : ''}`}
          onClick={() => setFilter('blockade')}
        >
          ⛔ Blockades
        </button>
      </div>

      {/* ALERTS LIST */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">No alerts match the selected filter.</div>
        ) : (
          filteredAlerts.map((alt) => {
            const hub = HUBS.find((h) => h.hubId === alt.hubId);
            const isConfirmed = alt.confidence >= 0.6;
            return (
              <div
                key={alt.id}
                className={`alert-card-item ${isConfirmed ? 'confirmed' : 'unverified'}`}
              >
                <div className="alert-item-top">
                  <div className="alert-badge-group">
                    <span className={`type-badge type-${alt.type}`}>
                      {alt.type === 'waterlogging' && '🌊 Waterlogging'}
                      {alt.type === 'blockade' && '⛔ Blockade'}
                      {alt.type === 'gridlock' && '🚗 Severe Gridlock'}
                      {alt.type === 'construction' && '🚧 Construction'}
                    </span>
                    <span className="hub-tag">📍 {hub ? hub.name : alt.hubId}</span>
                    <span className={`status-pill ${isConfirmed ? 'hard' : 'soft'}`}>
                      {isConfirmed ? 'Hard Detour (Confirmed)' : 'Soft Delay (Unverified)'}
                    </span>
                  </div>
                  <span className="alert-time">{alt.reportedAt}</span>
                </div>

                <h4 className="alert-title">{alt.title}</h4>
                <p className="alert-body">{alt.text}</p>

                {alt.impact && (
                  <div className="alert-impact-note">
                    <b>Routing Impact:</b> {alt.impact}
                  </div>
                )}

                <div className="alert-footer">
                  <div className="confidence-meter">
                    <div className="confidence-label">
                      <span>Trust Score: <b>{Math.round(alt.confidence * 100)}%</b></span>
                      <span className="confirmations-count">
                        👥 {alt.confirmations} confirmation{alt.confirmations !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-fill"
                        style={{
                          width: `${Math.min(100, Math.round(alt.confidence * 100))}%`,
                          backgroundColor: isConfirmed ? '#10b981' : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-confirm ${alt.upvotedByMe ? 'confirmed-done' : ''}`}
                    onClick={() => onConfirmAlert(alt.id)}
                    disabled={alt.upvotedByMe}
                  >
                    {alt.upvotedByMe ? '✓ Confirmed by you' : '👍 Confirm this (+20%)'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
