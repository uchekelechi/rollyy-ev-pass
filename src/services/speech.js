import { config } from '../config';

// Wraps Web Speech API with a 10s timeout and text fallback (spec section 3 & 4).
export function startVoiceCapture({ onResult, onError, onFallback }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onFallback?.('Speech recognition not supported in this browser.');
    return { stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const timeout = setTimeout(() => {
    recognition.stop();
    onFallback?.('No speech detected, switching to text input.');
  }, config.voice.listenTimeoutMs);

  recognition.onresult = (event) => {
    clearTimeout(timeout);
    const transcript = event.results[0][0].transcript;
    onResult?.(transcript);
  };

  recognition.onerror = (event) => {
    clearTimeout(timeout);
    onError?.(event.error);
  };

  recognition.onend = () => clearTimeout(timeout);

  recognition.start();
  return { stop: () => recognition.stop() };
}

// Very small entity extractor for the demo phrase pattern:
// "Charge to 80% near Salesforce Tower at 6pm"
export function parseChargeIntent(text) {
  const targetSoc = text.match(/(\d{1,3})\s*%/);
  const location = text.match(/near\s+(.+?)(?:\s+at\s+|$)/i);
  const time = text.match(/at\s+(\d{1,2}(:\d{2})?\s?(am|pm)?)/i);

  return {
    raw: text,
    targetSocPercent: targetSoc ? parseInt(targetSoc[1], 10) : 80,
    location: location ? location[1].trim() : null,
    time: time ? time[1].trim() : null
  };
}
