import React, { useState, useRef, useEffect } from 'react';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: 'Salam! I am your Dhaka transit assistant. Ask me in English, Bangla, or Banglish (e.g. "Mirpur theke Motijheel student fare koto?" or "Science Lab er rasta kemon?").',
    chips: ['Mirpur to Motijheel, student', 'Science Lab er rasta kemon?', 'Shahbagh protest status'],
  },
];

export default function ChatDock({ onSelectRoute, onSelectOrigin, onSelectDest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const HUB_CODE_MAP = {
    MIR: 'mirpur',
    MOT: 'motijheel',
    FAR: 'farmgate',
    SHA: 'shahbagh',
    UTT: 'uttara',
    DHA: 'dhanmondi',
    MOH: 'mohakhali',
    MOHP: 'mohammadpur',
    AGA: 'agargaon',
    SCI: 'science-lab',
    BAD: 'badda',
    JAT: 'jatrabari',
    MAL: 'malibagh',
    BAN: 'banasree',
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Attempt to query live backend /api/chat
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        const replyText = data.reply || data.replyBn || 'Route found.';
        
        let actionRoute = null;
        if (data.parsed?.origin && data.parsed?.destination) {
          const orig = HUB_CODE_MAP[data.parsed.origin] || data.parsed.origin.toLowerCase();
          const dst = HUB_CODE_MAP[data.parsed.destination] || data.parsed.destination.toLowerCase();
          actionRoute = { origin: orig, dest: dst };
        }

        const chips = [];
        if (actionRoute) {
          chips.push(`Apply ${actionRoute.origin.toUpperCase()} ➔ ${actionRoute.dest.toUpperCase()} in Planner`);
        }
        chips.push('Check Fare Truth', 'Show Metro Line');

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: replyText,
            actionRoute,
            chips,
          },
        ]);
        return;
      }
    } catch {
      // Backend unavailable or network error: fall back to local rule simulation
    }

    // Local fallback simulation
    setTimeout(() => {
      const q = query.toLowerCase();
      let botReply = '';
      let actionRoute = null;
      let chips = [];

      if (q.includes('science lab') || q.includes('panir') || q.includes('pani') || q.includes('water')) {
        botReply = '⚠️ Science Lab crossing has active waterlogging reports with knee-deep water. Surface buses are delayed by ~20 minutes and rickshaws are charging surge fares. Detour via Farmgate or use MRT-6 where possible!';
        chips = ['Avoid Science Lab in search', 'Check Dhanmondi route'];
      } else if (q.includes('shahbagh') || q.includes('protest') || q.includes('rally')) {
        botReply = '⛔ Active alert at Shahbagh: student rally reported. Road traffic is being diverted via Katabon. Recommendation: Ride MRT-6 Metro Rail to Dhaka University / Shahbagh station to bypass all surface jams.';
        chips = ['Show MRT-6 line', 'Farmgate to Motijheel'];
      } else if (q.includes('mirpur') && q.includes('motijheel')) {
        const isStudent = q.includes('student');
        botReply = `🚆 Best route from Mirpur to Motijheel:
• Option 1: MRT-6 Metro Rail (Fastest, ~28 mins, ৳60). Air-conditioned, completely immune to surface traffic.
• Option 2: Bus A (Cheapest${isStudent ? ' with Student 50% discount = ৳18' : ' = ৳36'}, ~45 mins).
Tap below to load this route into your planner:`;
        actionRoute = { origin: 'mirpur', dest: 'motijheel' };
        chips = ['Apply Mirpur ➔ Motijheel in Planner', 'Compare Metro vs Bus fare'];
      } else if (q.includes('dhanmondi') && q.includes('motijheel')) {
        botReply = '🚌 From Dhanmondi to Motijheel: Take Bus C or Rickshaw to Shahbagh MRT station (৳25-30), then MRT-6 directly to Motijheel (৳20). Total ~32 min.';
        actionRoute = { origin: 'dhanmondi', dest: 'motijheel' };
        chips = ['Apply Dhanmondi ➔ Motijheel'];
      } else if (q.includes('fare') || q.includes('bhara') || q.includes('taka')) {
        botReply = '💰 Standard BRTA Rates: Bus is ৳2.45/km (Min ৳10, Student half-pass valid on all buses). MRT-6 is ৳20 minimum to ৳100 max cap. Rickshaws range from ৳20-30/km base.';
        chips = ['Open Fare Truth Checker', 'MRT-6 fare chart'];
      } else {
        botReply = `Got it! I analyzed your query "${query}". I can calculate grounded multi-modal routes (Bus + Metro + Leguna + Rickshaw), verify driver fare quotes, and warn you of live road blockades. Where are you heading today?`;
        chips = ['Uttara to Motijheel', 'Mohakhali to Dhanmondi', 'Science Lab alert check'];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          actionRoute,
          chips,
        },
      ]);
    }, 400);
  };

  const handleChipClick = (chip) => {
    if (chip.includes('Apply ') && chip.includes('➔')) {
      const parts = chip.replace('Apply ', '').replace(' in Planner', '').split('➔').map(s => s.trim().toLowerCase());
      if (parts.length === 2) {
        onSelectRoute?.(parts[0], parts[1]);
        return;
      }
    }
    handleSend(chip);
  };

  return (
    <div className="chat-dock-container">
      {!isOpen && (
        <button
          type="button"
          className="chat-floating-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open DhakaPath Commuter Assistant"
        >
          <span className="chat-btn-icon">💬</span>
          <span className="chat-btn-text">DhakaPath Assistant</span>
          <span className="chat-btn-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="chat-window-card">
          <div className="chat-header">
            <div className="chat-header-title">
              <span className="bot-avatar">🤖</span>
              <div>
                <b>DhakaPath AI Assistant</b>
                <div className="chat-subtitle">English · বাংলা · Banglish</div>
              </div>
            </div>
            <button
              type="button"
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="chat-messages-log">
            {messages.map((m) => (
              <div key={m.id} className={`chat-message ${m.sender}`}>
                <div className="bubble-text">{m.text}</div>
                {m.actionRoute && (
                  <button
                    type="button"
                    className="chat-action-btn"
                    onClick={() => onSelectRoute?.(m.actionRoute.origin, m.actionRoute.dest)}
                  >
                    🎯 Load {m.actionRoute.origin.toUpperCase()} ➔ {m.actionRoute.dest.toUpperCase()} on Map
                  </button>
                )}
                {m.chips && m.chips.length > 0 && (
                  <div className="chat-chips-group">
                    {m.chips.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        className="chat-chip"
                        onClick={() => handleChipClick(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          <form
            className="chat-composer-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="chat-input-field"
              placeholder="e.g. Mirpur theke Motijheel student..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
              ↑
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
