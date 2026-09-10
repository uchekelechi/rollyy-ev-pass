import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLocation } from '../context/LocationContext.jsx';
import logo from '../assets/logo.png';

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
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Stops whichever speech source (ElevenLabs playback or native TTS) is currently active.
  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }

  function speakWithBrowser(spokenReply) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(spokenReply);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  // Speaks Rollyy's reply back so the interaction can be fully hands-free, not just voice-in.
  // Tries ElevenLabs (server-side key, high-quality neural voice) first, and silently falls
  // back to the browser's built-in speech if it isn't configured or the request fails.
  async function speak(spokenReply) {
    if (!voiceReplyEnabled || !spokenReply) return;
    stopSpeaking();

    const audioBlob = await api.synthesizeSpeech(spokenReply);
    if (!audioBlob) {
      speakWithBrowser(spokenReply);
      return;
    }

    const audio = new Audio(URL.createObjectURL(audioBlob));
    audioRef.current = audio;
    audio.onended = () => URL.revokeObjectURL(audio.src);
    audio.onerror = () => speakWithBrowser(spokenReply);
    audio.play().catch(() => speakWithBrowser(spokenReply));
  }

  async function handleIntent(spokenText) {
    const trimmed = spokenText.trim();
    if (!trimmed) return;
    setStatus('thinking');
    setMessage('Thinking…');
    try {
      const intent = await api.classifyIntent(trimmed);
      const reply = intent.summary || 'On it.';
      setMessage(reply);
      if (!intent.service) {
        speak(reply);
        setStatus('idle');
        return;
      }
      if (intent.query && intent.service !== 'maintenance') {
        searchByText(intent.query);
      }
      speak(reply);
      const destination = DESTINATION[intent.service];
      const routeState = intent.service === 'maintenance' ? { issue: intent.query || trimmed } : undefined;
      navigate(destination, routeState ? { state: routeState } : undefined);
    } catch (cause) {
      const reply = cause.message || 'Something went wrong. Try again.';
      setMessage(reply);
      speak(reply);
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
    // Stop any reply currently playing so the microphone can't pick up Rollyy's own voice.
    stopSpeaking();
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
        <img className="brand-mark home-logo" src={logo} alt="Rollyy" />
        <h1>rollyy</h1>
        <p className="home-minimal-hint" data-testid="home-message">{message}</p>

        <button
          type="button"
          className={`voice-orb ${listening ? 'is-listening' : ''} ${status === 'thinking' ? 'is-thinking' : ''}`}
          onClick={startListening}
          disabled={status === 'thinking'}
          aria-label="Speak your request"
          data-testid="home-mic"
        >
          🎙️
        </button>

        <button
          type="button"
          className="voice-reply-toggle"
          onClick={() => {
            if (voiceReplyEnabled) stopSpeaking();
            setVoiceReplyEnabled((current) => !current);
          }}
          aria-pressed={voiceReplyEnabled}
          aria-label={voiceReplyEnabled ? 'Turn off spoken replies' : 'Turn on spoken replies'}
          data-testid="voice-reply-toggle"
        >
          {voiceReplyEnabled ? '🔊 Voice replies on' : '🔇 Voice replies off'}
        </button>

        <form className="home-minimal-form" onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="or type it here… e.g. my battery is dead"
            aria-label="Type your request"
            data-testid="home-input"
          />
          <button type="submit" className="home-go-button" disabled={status === 'thinking' || !text.trim()} data-testid="home-submit">
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
