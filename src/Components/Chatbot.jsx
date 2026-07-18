import React, { useState, useRef, useEffect } from 'react';
import favicon from '../assets/medical-symbol.png';

const WELCOME_TEXT = "Hi! I'm Scouty, your DocScout assistant. Ask me anything about hospitals in Odisha, symptoms, specialists, or how to use DocScout. 🏥";

const DISTRICTS = [
  'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh',
  'Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi',
  'Kandhamal','Kendrapada','Keonjhar','Khordha','Koraput','Malkangiri','Mayurbhanj',
  'Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh',
];

const SUGGESTIONS = [
  'Hospitals in Cuttack',
  'Show hospitals near me',
  'How to search hospitals?',
  'Emergency contact',
];

const msgAnimation = `
  @keyframes scouty-msg-in {
    from { opacity: 0; transform: translateX(-18px) scale(0.95); }
    to   { opacity: 1; transform: translateX(0)     scale(1);    }
  }
  .scouty-msg-in {
    animation: scouty-msg-in 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 p-0.5">
        <img src={favicon} alt="Scouty" className="w-full h-full object-contain" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LocatingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 p-0.5">
        <img src={favicon} alt="Scouty" className="w-full h-full object-contain" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm text-sm text-gray-500 flex items-center gap-2">
        <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        Detecting your location…
      </div>
    </div>
  );
}

const URL_RE = /(https?:\/\/[^\s,)]+)/g;
const BOLD_RE = /\*\*(.+?)\*\*/g;

function renderSegment(text, key) {
  const parts = text.split(URL_RE);
  return parts.map((part, j) =>
    URL_RE.test(part) ? (
      <a key={`${key}-${j}`} href={part} target="_blank" rel="noopener noreferrer"
        className="text-blue-500 underline break-all">{part}</a>
    ) : part
  );
}

function renderLine(line, i) {
  const segments = [];
  let last = 0;
  let match;
  BOLD_RE.lastIndex = 0;
  while ((match = BOLD_RE.exec(line)) !== null) {
    if (match.index > last) segments.push(...renderSegment(line.slice(last, match.index), `${i}-pre-${last}`));
    segments.push(<strong key={`${i}-b-${match.index}`}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < line.length) segments.push(...renderSegment(line.slice(last), `${i}-post`));
  return segments;
}

function renderText(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <span key={i}>
      {renderLine(line, i)}
      {i < lines.length - 1 && <br />}
    </span>
  ));
}

function Message({ msg, animate }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 p-0.5">
          <img src={favicon} alt="Scouty" className="w-full h-full object-contain" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
        } ${!isUser && animate ? 'scouty-msg-in' : ''}`}
      >
        {isUser ? msg.content : renderText(msg.content)}
      </div>
    </div>
  );
}

function IdleScreen({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 select-none">
      <img src={favicon} alt="Scouty" className="w-16 h-16 object-contain" />
      <p className="text-gray-800 font-semibold text-lg">Scouty</p>
      <p className="text-gray-400 text-sm text-center px-6">Your DocScout assistant — ask me anything!</p>
      <div className="flex flex-wrap justify-center gap-2 px-4 mt-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1 hover:bg-blue-100 transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [lastAnimatedIdx, setLastAnimatedIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, locating]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const addAssistantMsg = (content) => {
    setMessages((prev) => {
      const next = [...prev, { role: 'assistant', content }];
      setLastAnimatedIdx(next.length - 1);
      return next;
    });
  };

  const isGreeting = (text) =>
    /^\s*(hi+|hello+|hey+|hiya|howdy|greetings|good\s*(morning|afternoon|evening|day)|sup|what'?s\s*up)\s*[!?.]*\s*$/i.test(text);

  const isFarewell = (text) =>
    /^\s*(bye|goodbye|see\s*you|thanks|thank\s*you|ok\s*thanks|ok\s*bye|that'?s?\s*(all|it)|done)\s*[!?.]*\s*$/i.test(text);

  const isLocationQuery = (text) =>
    /where\s*(am\s*i|is\s*my\s*location)|my\s*(current\s*)?location|(show\s*)?(hospitals?|clinics?)\s*near\s*(me|my)|nearby\s*(hospitals?|clinics?)|show\s*nearby|current\s*location/i.test(text);

  const callApi = async (history, coords) => {
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, coords: coords || null }),
    });
    const data = await res.json();
    return data.reply || data.error || 'Sorry, something went wrong.';
  };

  const sendMessage = async (text, coords = null) => {
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      const reply = await callApi(history, coords);
      addAssistantMsg(reply);
    } catch {
      addAssistantMsg('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocation = async (originalText = null) => {
    if (!navigator.geolocation) {
      addAssistantMsg("Your browser doesn't support location access. Please use the search bar to find hospitals by district.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en-US,en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const district = DISTRICTS.find((d) => {
            const dl = d.toLowerCase();
            return (
              addr.state_district?.toLowerCase().includes(dl) ||
              addr.county?.toLowerCase().includes(dl) ||
              addr.district?.toLowerCase().includes(dl) ||
              addr.city?.toLowerCase().includes(dl) ||
              addr.town?.toLowerCase().includes(dl)
            );
          });
          const locationName = [
            addr.neighbourhood || addr.suburb || addr.village || addr.town,
            addr.city || addr.county,
            addr.state,
            addr.country,
          ].filter(Boolean).join(', ');

          const coords = { lat: latitude, lon: longitude, locationName };
          const text = originalText || (district ? `What hospitals are in ${district}?` : 'Show hospitals near my location');
          setLocating(false);
          await sendMessage(text, coords);
        } catch {
          setLocating(false);
          addAssistantMsg('Could not detect your location. Please try again or search manually.');
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          addAssistantMsg('Location permission denied. Please allow location access in your browser settings and try again.');
        } else {
          addAssistantMsg('Unable to get your location. Please try again or search by district manually.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || locating) return;
    setInput('');

    if (isGreeting(text)) {
      setMessages((prev) => {
        const next = [...prev, { role: 'user', content: text }, { role: 'assistant', content: WELCOME_TEXT }];
        setLastAnimatedIdx(next.length - 1);
        return next;
      });
      return;
    }

    if (isFarewell(text)) {
      setMessages((prev) => {
        const next = [...prev, { role: 'user', content: text }, { role: 'assistant', content: "You're welcome! Stay healthy. Feel free to ask anything anytime. 😊" }];
        setLastAnimatedIdx(next.length - 1);
        return next;
      });
      return;
    }

    if (isLocationQuery(text)) {
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      await fetchLocation(text);
      return;
    }

    await sendMessage(text);
  };

  const handleSuggestion = async (text) => {
    if (loading || locating) return;
    if (isLocationQuery(text)) {
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      await fetchLocation(text);
      return;
    }
    await sendMessage(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showTyping = loading || locating;

  return (
    <>
      <style>{msgAnimation}</style>

      {/* Chat window */}
      <div
        className={`fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '560px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 p-1">
            <img src={favicon} alt="Scouty" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Scouty</p>
            <p className="text-white/60 text-xs">{showTyping ? (locating ? 'Detecting location…' : 'Typing…') : 'DocScout Assistant'}</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages / Idle */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 flex flex-col">
          {messages.length === 0 && !showTyping ? (
            <IdleScreen onSuggestion={handleSuggestion} />
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => <Message key={i} msg={m} animate={i === lastAnimatedIdx} />)}
              {locating && <LocatingIndicator />}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={() => fetchLocation()}
            disabled={locating || loading}
            title="Use my location"
            className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center text-gray-500 transition flex-shrink-0"
          >
            {locating ? (
              <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            )}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about hospitals, symptoms…"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 max-h-24 leading-snug"
            style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
            disabled={loading || locating}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || locating}
            className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center text-white transition flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
        aria-label="Open chat"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}
      </button>
    </>
  );
}
