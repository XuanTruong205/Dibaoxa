import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Anchor,
  Compass,
  Hotel,
  PackageCheck,
  Plane,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';

const INITIAL_SUGGESTIONS = [
  'Gợi ý kỳ nghỉ gần biển',
  'Đi cùng gia đình thì sao?',
  'Có nơi nào dưới 5 triệu?',
];

const INITIAL_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'Chào bạn, mình là Vi. Nói cho mình điểm đến, kiểu nghỉ hoặc ngân sách, mình sẽ lọc các lựa chọn đang có trên Dibaoxa.',
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function ModeBadge({ status, mode }) {
  const degraded = status?.ai_enabled && mode === 'local';
  const aiReady = mode === 'ai';
  return (
    <span className={`travel-assistant__mode ${aiReady ? 'is-ai' : degraded ? 'is-degraded' : 'is-local'}`}>
      <i aria-hidden="true" />
      {aiReady ? 'AI đang bật' : degraded ? 'AI tạm lỗi' : 'Dữ liệu nội bộ'}
    </span>
  );
}

export default function TravelAssistantBot({ onExploreDestination }) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [matches, setMatches] = useState([]);
  const [packageMatches, setPackageMatches] = useState([]);
  const [cruiseMatches, setCruiseMatches] = useState([]);
  const [flightMatches, setFlightMatches] = useState([]);
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('local');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const conversationRef = useRef(null);

  const subtitle = useMemo(() => {
    if (status?.ai_enabled || mode === 'ai') return `Tư vấn bằng ${status?.model || 'AI'}`;
    return 'Sẵn sàng hỗ trợ bằng dữ liệu Dibaoxa';
  }, [mode, status]);

  useEffect(() => {
    let mounted = true;
    api.get('/assistant/status')
      .then((response) => {
        if (!mounted) return;
        setStatus(response.data.data);
        setMode(response.data.data.mode);
      })
      .catch(() => {
        if (mounted) setStatus({ ai_enabled: false, mode: 'local' });
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [messages, loading, isOpen, reduceMotion]);

  const sendMessage = async (content) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmed };
    const priorMessages = messages.slice(-8).map(({ role, content: historyContent }) => ({ role, content: historyContent }));
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/assistant/chat', { message: trimmed, history: priorMessages });
      const data = response.data.data;
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
      }]);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 4) : INITIAL_SUGGESTIONS);
      setMatches(Array.isArray(data.matches) ? data.matches.slice(0, 3) : []);
      setPackageMatches(Array.isArray(data.package_matches) ? data.package_matches.slice(0, 2) : []);
      setCruiseMatches(Array.isArray(data.cruise_matches) ? data.cruise_matches.slice(0, 3) : []);
      setFlightMatches(Array.isArray(data.flight_matches) ? data.flight_matches.slice(0, 3) : []);
      setMode(data.mode || 'local');
    } catch {
      setError('Vi chưa kết nối được lúc này. Bạn thử gửi lại sau một chút nhé.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const exploreMatch = (city) => {
    onExploreDestination(city);
    setIsOpen(false);
  };

  const hasResults = matches.length > 0 || packageMatches.length > 0 || cruiseMatches.length > 0 || flightMatches.length > 0;

  return (
    <div className="travel-assistant">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="travel-assistant__panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="travel-assistant-title"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="travel-assistant__header">
              <span className="travel-assistant__avatar"><img src="/logo.png" alt="Vi Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /></span>
              <div>
                <strong id="travel-assistant-title">Vi, trợ lý Dibaoxa</strong>
                <span>{subtitle}</span>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng trợ lý"><X /></button>
            </header>

            <div className="travel-assistant__toolbar">
              <ModeBadge status={status} mode={mode} />
              <span><Compass /> Lọc theo nhu cầu</span>
            </div>

            <div className="travel-assistant__conversation" ref={conversationRef} aria-live="polite">
              {messages.map((message) => (
                <div className={`assistant-message assistant-message--${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <Sparkles aria-hidden="true" />}
                  <p>{message.content}</p>
                </div>
              ))}
              {loading && (
                <div className="assistant-message assistant-message--assistant assistant-message--loading" aria-label="Vi đang chuẩn bị câu trả lời">
                  <Sparkles aria-hidden="true" /><p><span /><span /><span /></p>
                </div>
              )}
              {error && <p className="travel-assistant__error" role="alert">{error}</p>}

              {hasResults && !loading && (
                <div className="travel-assistant__results" aria-label="Gợi ý từ Vi">
                  {matches.map((match) => (
                    <button type="button" key={match.id} onClick={() => exploreMatch(match.city)} className="travel-assistant__result-card">
                      <Hotel />
                      <span>
                        <strong>{match.name}</strong>
                        <small>{match.city}{match.min_price ? ` · từ ${formatPrice(match.min_price)}đ` : ''}</small>
                        {match.reason && <em>{match.reason}</em>}
                      </span>
                      <b>Khám phá</b>
                    </button>
                  ))}

                  {cruiseMatches.map((cruise) => (
                    <div className="travel-assistant__cruise-card" key={cruise.id}>
                      <Anchor />
                      <span>
                        <strong>{cruise.name}</strong>
                        <small>{cruise.destination} · {cruise.durationDays} ngày · ★ {cruise.rating}</small>
                      </span>
                      <b>{formatPrice(cruise.price)}đ</b>
                    </div>
                  ))}

                  {flightMatches.slice(0, 2).map((flight) => (
                    <div className="travel-assistant__flight-card" key={flight.id}>
                      <Plane />
                      <span>
                        <strong>{flight.code} · {flight.airline}</strong>
                        <small>{flight.origin} → {flight.destination} · {flight.depart} - {flight.arrive}</small>
                      </span>
                      <b>{formatPrice(flight.price)}đ</b>
                    </div>
                  ))}

                  {packageMatches.map((item) => (
                    <div className="travel-assistant__package-card" key={item.id || item.title}>
                      <PackageCheck />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.destination} · {item.duration}</small>
                      </span>
                      <b>{formatPrice(item.price)}đ</b>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="travel-assistant__prompts" aria-label="Câu hỏi nhanh">
              {suggestions.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)} disabled={loading}>
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="travel-assistant__form" onSubmit={handleSubmit}>
              <label htmlFor="travel-assistant-input" className="sr-only">Nhập câu hỏi cho trợ lý Vi</label>
              <input
                id="travel-assistant-input"
                ref={inputRef}
                value={input}
                maxLength={500}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ví dụ: đi biển 3 ngày cho gia đình..."
                disabled={loading}
              />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Gửi câu hỏi"><Send /></button>
            </form>
            <p className="travel-assistant__notice">Gợi ý dựa trên dữ liệu Dibaoxa, hãy kiểm tra chi tiết trước khi đặt.</p>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={`travel-assistant__launcher ${isOpen ? 'is-open' : 'is-custom-img'}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? 'Đóng trợ lý hành trình' : 'Mở trợ lý hành trình AI'}
        aria-expanded={isOpen}
        whileHover={reduceMotion ? undefined : { y: -4, scale: 1.03 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      >
        {isOpen ? (
          <X />
        ) : (
          <img src="/images/chatbot-trigger.png" alt="Hỏi ngay - Trợ lý Dibaoxa" className="travel-assistant__trigger-img" />
        )}
      </motion.button>
    </div>
  );
}
