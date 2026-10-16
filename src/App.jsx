import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import CommuterView from './components/CommuterView.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import ChatDock from './components/ChatDock.jsx';
import {
  INITIAL_LANDMARKS,
  INITIAL_ALERTS,
  INITIAL_MODERATION_QUEUE,
  INITIAL_FARE_CONFIG,
  INITIAL_AUDIT_LOG,
} from './data/initialData.js';
import { DEFAULT_SCENARIO } from './engine/router.js';
import {
  syncScenarioToBackend,
  fetchScenarioFromBackend,
  resetScenarioOnBackend,
} from './engine/apiSync.js';

export default function App() {
  // Route detection helper: checks if URL is /admin or /maintenance
  const isAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    return (
      path.includes('/admin') ||
      path.includes('/maintenance') ||
      hash.includes('/admin') ||
      hash.includes('/maintenance')
    );
  };

  const [currentPortal, setCurrentPortal] = useState(() => (isAdminPath() ? 'admin' : 'commuter'));
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('dp_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState('dark');

  // Routing Origin / Destination
  const [origin, setOrigin] = useState('mirpur');
  const [dest, setDest] = useState('motijheel');

  // Shared System State
  const [landmarks, setLandmarks] = useState(INITIAL_LANDMARKS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [moderationQueue, setModerationQueue] = useState(INITIAL_MODERATION_QUEUE);
  const [fareConfig, setFareConfig] = useState(INITIAL_FARE_CONFIG);
  const [scenario, setScenario] = useState(() => {
    // Load persisted admin blocks/delays from localStorage so all tabs share state
    try {
      const saved = localStorage.getItem('dp_scenario');
      if (saved) return { ...DEFAULT_SCENARIO, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SCENARIO;
  });
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT_LOG);

  // Rush hour is strictly broadcasted by Admin (not fixed clock timer)
  const rushHour = Boolean(scenario.rushHour);

  // URL-based route listener: switches portal when navigating to /admin, /maintenance, or /
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPortal(isAdminPath() ? 'admin' : 'commuter');
    };
    // Cross-tab sync: when admin blocks a road in another tab, pick it up immediately
    const handleStorage = (e) => {
      if (e.key === 'dp_scenario' && e.newValue) {
        try {
          setScenario({ ...DEFAULT_SCENARIO, ...JSON.parse(e.newValue) });
        } catch {}
      }
    };

    // Initial backend fetch: sync active backend scenario on mount
    fetchScenarioFromBackend(DEFAULT_SCENARIO).then((backendSc) => {
      if (backendSc) {
        setScenario((prev) => ({ ...prev, ...backendSc }));
        try { localStorage.setItem('dp_scenario', JSON.stringify(backendSc)); } catch {}
      }
    });

    const handleFocus = () => {
      fetchScenarioFromBackend(DEFAULT_SCENARIO).then((backendSc) => {
        if (backendSc) {
          setScenario((prev) => ({ ...prev, ...backendSc }));
          try { localStorage.setItem('dp_scenario', JSON.stringify(backendSc)); } catch {}
        }
      });
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleNavigate = (path) => {
    try {
      window.history.pushState({}, '', path);
    } catch {
      window.location.hash = path;
    }
    setCurrentPortal(isAdminPath() ? 'admin' : 'commuter');
  };

  // Sync dark/light theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live auto-updating Dhaka time (pure real-time clock)
  const [liveTime, setLiveTime] = useState(() => {
    try {
      return new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  });

  const simTimeString = liveTime;

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
        });
        setLiveTime(timeStr);
      } catch {
        // fallback
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // Add crowdsourced alert from commuter
  const handleAddAlert = (newAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);

    // Also push to moderation queue
    setModerationQueue((prev) => [
      {
        id: `mod-${Date.now()}`,
        hubId: newAlert.hubId,
        type: newAlert.type,
        text: newAlert.rawText || newAlert.text,
        submitter: 'Commuter (Ingested)',
        confidence: newAlert.confidence,
        submittedAt: 'Just now',
        status: 'pending',
      },
      ...prev,
    ]);

    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: simTimeString,
        actor: 'Crowdsource Ingestor',
        action: `Citizen report ingested at ${newAlert.hubId}: "${newAlert.title}"`,
      },
      ...prev,
    ]);
  };

  // Confirm / upvote an alert (+0.20 confidence)
  const handleConfirmAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          const newConf = Math.min(1.0, a.confidence + 0.2);
          const isNowHard = newConf >= 0.6;
          // If waterlogging or blockade becomes hard, auto-block the hub in scenario!
          if (isNowHard && ['waterlogging', 'blockade'].includes(a.type)) {
            setScenario((sc) => ({
              ...sc,
              blockedHubs: [...new Set([...sc.blockedHubs, a.hubId])],
            }));
          }
          return {
            ...a,
            confidence: newConf,
            confirmations: a.confirmations + 1,
            upvotedByMe: true,
            status: isNowHard ? 'active' : a.status,
          };
        }
        return a;
      })
    );
  };

  // Admin approves report from moderation queue
  const handleApproveReport = (item) => {
    setModerationQueue((prev) => prev.filter((q) => q.id !== item.id));

    // Verify & activate in live alerts
    const verifiedAlert = {
      id: `alt-v-${Date.now()}`,
      hubId: item.hubId,
      type: item.type,
      title: `Verified Incident: ${item.type.toUpperCase()} at ${item.hubId}`,
      text: item.text,
      rawText: item.text,
      confidence: 0.9,
      status: 'active',
      severity: 'high',
      source: 'admin',
      confirmations: 8,
      upvotedByMe: true,
      reportedAt: 'Just now',
      timestamp: Date.now(),
      impact: 'Official alert confirmed by transit authority dispatcher.',
    };

    setAlerts((prev) => [verifiedAlert, ...prev]);

    // If blockade or waterlogging, add to blockedHubs in scenario
    if (['blockade', 'waterlogging'].includes(item.type)) {
      setScenario((prev) => ({
        ...prev,
        blockedHubs: [...new Set([...prev.blockedHubs, item.hubId])],
      }));
    }

    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: simTimeString,
        actor: 'Admin Dispatcher',
        action: `Approved & published alert for ${item.hubId} (Confidence: 0.90)`,
      },
      ...prev,
    ]);
  };

  // Admin rejects report
  const handleRejectReport = (itemId) => {
    setModerationQueue((prev) => prev.filter((q) => q.id !== itemId));
    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: simTimeString,
        actor: 'Admin Dispatcher',
        action: `Rejected false report from moderation queue`,
      },
      ...prev,
    ]);
  };

  // Admin saves landmark guidance note
  const handleSaveLandmark = (hubId, en, bn) => {
    setLandmarks((prev) => ({
      ...prev,
      [hubId]: { en, bn },
    }));

    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: simTimeString,
        actor: 'Admin Dispatcher',
        action: `Updated landmark guidance notes for ${hubId}`,
      },
      ...prev,
    ]);
  };

  // Admin updates fare configuration
  const handleUpdateFareConfig = (newFares) => {
    setFareConfig(newFares);
    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: simTimeString,
        actor: 'Admin Dispatcher',
        action: `Updated regulatory fare chart (Fuel surcharge: ${newFares.fuelAdjustmentPct}%)`,
      },
      ...prev,
    ]);
  };

  // Admin updates disruption scenario — persisted to localStorage so all tabs see changes instantly, and pushed to backend API
  const handleUpdateScenario = (newScenario) => {
    setScenario(newScenario);
    try { localStorage.setItem('dp_scenario', JSON.stringify(newScenario)); } catch {}
    syncScenarioToBackend(newScenario);
    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: simTimeString,
        actor: 'Admin Dispatcher',
        action: `Updated live disruption scenario (${(newScenario.blockedHubs || []).length} blocked hubs, ${(newScenario.blockedEdges || []).length} blocked roads)`,
      },
      ...prev,
    ]);
  };

  // Reset to factory seed data
  const handleResetData = () => {
    if (window.confirm('Reset all alerts, fares and landmarks to factory default seed data?')) {
      setLandmarks(INITIAL_LANDMARKS);
      setAlerts(INITIAL_ALERTS);
      setModerationQueue(INITIAL_MODERATION_QUEUE);
      setFareConfig(INITIAL_FARE_CONFIG);
      setScenario(DEFAULT_SCENARIO);
      try { localStorage.removeItem('dp_scenario'); } catch {}
      resetScenarioOnBackend();
      setAuditLog((prev) => [
        {
          id: `aud-${Date.now()}`,
          time: simTimeString,
          actor: 'Admin Dispatcher',
          action: 'Reset all system collections to baseline seed data',
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="app-container">
      {/* GLOBAL NAVBAR */}
      <Navbar
        simTime={simTimeString}
        rushHour={rushHour}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentPortal={currentPortal}
        onNavigate={handleNavigate}
      />

      {/* PORTAL VIEW AREA */}
      <main className="portal-main-area">
        {currentPortal === 'commuter' ? (
          <CommuterView
            origin={origin}
            dest={dest}
            onSetOrigin={setOrigin}
            onSetDest={setDest}
            scenario={scenario}
            landmarks={landmarks}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onConfirmAlert={handleConfirmAlert}
            fareConfig={fareConfig}
            rushHour={rushHour}
            onUpdateScenario={handleUpdateScenario}
          />
        ) : (
          <AdminPortal
            isLoggedIn={isAdminLoggedIn}
            onLogin={() => {
              setIsAdminLoggedIn(true);
              try { sessionStorage.setItem('dp_admin_auth', 'true'); } catch {}
            }}
            onLogout={() => {
              setIsAdminLoggedIn(false);
              try { sessionStorage.removeItem('dp_admin_auth'); } catch {}
            }}
            onResetData={handleResetData}
            landmarks={landmarks}
            onSaveLandmark={handleSaveLandmark}
            fareConfig={fareConfig}
            onUpdateFareConfig={handleUpdateFareConfig}
            scenario={scenario}
            onUpdateScenario={handleUpdateScenario}
            auditLog={auditLog}
          />
        )}
      </main>

      {/* PERSISTENT AI CHAT ASSISTANT DOCK */}
      <ChatDock
        onSelectRoute={(o, d) => {
          setOrigin(o);
          setDest(d);
          setCurrentPortal('commuter');
        }}
      />
    </div>
  );
}
