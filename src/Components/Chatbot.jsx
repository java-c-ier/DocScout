import React, { useState, useRef, useEffect } from 'react';
import favicon from '../assets/medical-symbol.png';

const WELCOME_TEXT = "Hi! I'm Scouty, your DocScout assistant. Ask me anything about hospitals in Odisha, symptoms, specialists, or how to use DocScout. 🏥";


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
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
        } ${!isUser && animate ? 'scouty-msg-in' : ''}`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function IdleScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 select-none">
      <img src={favicon} alt="Scouty" className="w-16 h-16 object-contain" />
      <p className="text-gray-800 font-semibold text-lg">Scouty</p>
      <p className="text-gray-400 text-sm text-center px-6">Your DocScout assistant — ask me anything!</p>
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAnimatedIdx, setLastAnimatedIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const isGreeting = (text) =>
    /^\s*(hi+|hello+|hey+|hiya|howdy|greetings|good\s*(morning|afternoon|evening|day)|sup|what'?s\s*up)\s*[!?.]*\s*$/i.test(text);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');

    if (isGreeting(text)) {
      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: WELCOME_TEXT }];
        setLastAnimatedIdx(next.length - 1);
        return next;
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: data.reply || data.error || 'Sorry, something went wrong.' }];
        setLastAnimatedIdx(next.length - 1);
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: 'Network error. Please try again.' }];
        setLastAnimatedIdx(next.length - 1);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

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
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages / Idle */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 flex flex-col">
          {messages.length === 0 ? (
            <IdleScreen />
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => <Message key={i} msg={m} animate={i === lastAnimatedIdx} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about hospitals, symptoms…"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 max-h-24 leading-snug"
            style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
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
