import React from 'react';

export default function Navbar({
  simTime,
  rushHour,
  theme,
  onToggleTheme,
  currentPortal, // 'commuter' | 'admin'
  onNavigate, // function to navigate between '/' and '/admin'
}) {
  return (
    <header className="site-header">
      <div className="header-brand">
        <div className="brand-logo" onClick={() => onNavigate('/')}>
          <span className="logo-gem">◆</span>
          <span className="brand-title">DhakaPath</span>
        </div>
        <span className="brand-sub">
          {currentPortal === 'admin'
            ? 'Transit Operations & Moderation Console'
            : 'Dhaka Smart Transit & Commuter Intelligence'}
        </span>
      </div>

      <div className="header-controls">
        {/* Live Real-Time Dhaka Clock */}
        <div
          className="clock-bar live-sync-bar"
          title="Live Dhaka Time - Real-time transit clock"
        >
          <span className="live-pulse-dot" />
          <span className="clock-display">
            🕒 {simTime}
          </span>
          <span className="live-badge">LIVE FEED</span>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          className="theme-btn"
          onClick={onToggleTheme}
          aria-label="Toggle dark/light theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* If in Admin Portal, provide a clear Exit to Commuter View button */}
        {currentPortal === 'admin' && (
          <button
            type="button"
            className="btn-exit-admin"
            onClick={() => onNavigate('/')}
            title="Return to the public commuter map and route planner"
          >
            🌐 Exit to Commuter View
          </button>
        )}
      </div>
    </header>
  );
}
