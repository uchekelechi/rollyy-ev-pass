const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs' public "Rachel" preset voice.

// Optional high-quality neural TTS via ElevenLabs. Requires a server-side ELEVENLABS_API_KEY —
// the key is never sent to the client. Returns null (never throws) if it isn't configured or
// fails, so the caller can fall back to the browser's built-in SpeechSynthesis instead.
export async function synthesizeSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !text?.trim()) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`ElevenLabs TTS: responded ${response.status} ${response.statusText} ${body.slice(0, 300)}`);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (cause) {
    console.warn(`ElevenLabs TTS: request failed (${cause.name}: ${cause.message}), falling back to browser speech.`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
