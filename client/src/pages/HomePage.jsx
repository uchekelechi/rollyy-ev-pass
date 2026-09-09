import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLocation } from '../context/LocationContext.jsx';

const DESTINATION = {
  charging: '/charging',
  parking: '/parking',
  carwash: '/carwash',
  maintenance: '/maintenance',
  bot: '/charging/bot'
};

// Minimal landing screen: logo + one voice/text prompt that routes to the right service,
// instead of asking the driver to pick a tile first. Bottom nav still covers direct access.
export default function HomePage() {
  const navigate = useNavigate();
  const { searchByText } = useLocation();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Tell Rollyy what you need.');
  const recognitionRef = useRef(null);

  async function handleIntent(spokenText) {
    const trimmed = spokenText.trim();
    if (!trimmed) return;
    setStatus('thinking');
    setMessage('Thinking…');
    try {
      const intent = await api.classifyIntent(trimmed);
      setMessage(intent.summary || 'On it.');
      if (!intent.service) {
        setStatus('idle');
        return;
      }
      if (intent.query && intent.service !== 'maintenance') {
        searchByText(intent.query);
      }
      const destination = DESTINATION[intent.service];
      const routeState = intent.service === 'maintenance' ? { issue: intent.query || trimmed } : undefined;
      navigate(destination, routeState ? { state: routeState } : undefined);
    } catch (cause) {
      setMessage(cause.message || 'Something went wrong. Try again.');
      setStatus('idle');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleIntent(text);
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Voice input is not supported on this device — type your request instead.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setListening(true);
    setMessage('Listening…');

    recognition.onresult = ({ results }) => {
      const transcript = results[0][0].transcript;
      setText(transcript);
      handleIntent(transcript);
    };
    recognition.onerror = () => {
      setMessage('Could not hear that — try again or type instead.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <div className="screen home-minimal">
      <div className="home-minimal-center">
        <span className="brand-mark home-logo">R</span>
        <h1>rollyy</h1>
        <p className="home-minimal-hint">{message}</p>

        <button
          type="button"
          className={`voice-orb ${listening ? 'is-listening' : ''} ${status === 'thinking' ? 'is-thinking' : ''}`}
          onClick={startListening}
          disabled={status === 'thinking'}
          aria-label="Speak your request"
        >
          🎙️
        </button>

        <form className="home-minimal-form" onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="or type it here… e.g. my battery is dead"
            aria-label="Type your request"
          />
          <button type="submit" className="home-go-button" disabled={status === 'thinking' || !text.trim()}>
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
