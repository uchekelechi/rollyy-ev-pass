import { useState } from 'react';
import { startVoiceCapture, parseChargeIntent } from '../../services/speech';

export default function VoiceCapture({ onIntent }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  function handleListen() {
    setNote('');
    setListening(true);
    startVoiceCapture({
      onResult: (transcript) => {
        setListening(false);
        setText(transcript);
        onIntent(parseChargeIntent(transcript));
      },
      onError: (err) => {
        setListening(false);
        setNote(`Voice error: ${err}. Please type instead.`);
      },
      onFallback: (msg) => {
        setListening(false);
        setNote(msg);
      }
    });
  }

  function handleSubmitText(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onIntent(parseChargeIntent(text));
  }

  return (
    <div className="voice-capture">
      <h1>Rollyy EV Pass</h1>
      <p className="hint">Try: “Charge to 80% near Salesforce Tower at 6pm”</p>
      <button onClick={handleListen} disabled={listening} className="mic-btn">
        {listening ? 'Listening…' : '🎙️ Speak'}
      </button>
      <form onSubmit={handleSubmitText} className="text-fallback">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type your request…"
        />
        <button type="submit">Go</button>
      </form>
      {note && <p className="note">{note}</p>}
    </div>
  );
}
