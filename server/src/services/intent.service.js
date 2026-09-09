const VALID_SERVICES = ['charging', 'parking', 'maintenance', 'carwash', 'bot'];

const SYSTEM_PROMPT = `You are Rollyy's voice assistant. A driver speaks or types a request.
Read it and respond with strict JSON only, no prose, matching this shape:
{"service": string, "query": string | null, "summary": string}

"service" must be exactly one of: charging, parking, maintenance, carwash, bot.
Use "bot" when the driver is stranded, has a dead/very low battery, or otherwise
cannot reach a charging station themselves — a mobile charging robot can drive to
them instead. Use "charging" for a normal request to find a charging point.
Use "maintenance" for anything broken, noisy, smoky, or needing a mechanic — in
that case set "query" to the driver's problem description verbatim so it can be
shown to the mechanic. For charging/parking/carwash, set "query" to a place name
if the driver mentioned one (e.g. "near Espoo"), otherwise null. "summary" is one
short, friendly sentence confirming what you understood.`;

// Rare in real speech, but a mobile charging bot can reach a driver who can't reach a station.
const STRANDED_PATTERN =
  /\b(stranded|stuck|can'?t (?:get|reach|make it|drive|move)|dead battery|battery(?:'s| is)? (?:low|dead|almost (?:dead|gone)|dying)|won'?t start|out of (?:charge|battery|power)|no (?:charge|power|battery) left)\b/i;

// A direct ask for the mobile charging robot itself, e.g. "send a bot" or "call a charging robot".
const BOT_REQUEST_PATTERN = /\b(?:send|call|request|order|get|book)\b.{0,15}\b(?:rollyy )?(?:charging )?(?:bot|robot)s?\b/i;

const SERVICE_PATTERNS = {
  bot: BOT_REQUEST_PATTERN,
  charging: /charg(?:e|es|ed|ing|er|ers)|evse|top up|plug in/i,
  parking: /park(?:ing)?|car park|garage|leave (?:my|the) car/i,
  carwash: /wash|clean my car|car wash/i,
  maintenance: /repair|mechanic|broken|noise|noisy|smell|smoke|leak|rattle|squeal|grind|won'?t start|check engine|warning light|flat tyre|flat tire|puncture/i
};

function extractPlace(text) {
  // "to" is deliberately excluded — it's far too common in unrelated phrasing like
  // "I need to charge my car" and would be misread as a place name.
  const match = text.match(/\b(?:near|at|in|around)\s+(.+?)[.!?]*$/i);
  return match ? match[1].trim() : null;
}

// Deterministic fallback used whenever AI isn't configured or fails — this is the path that
// actually runs the live demo today, so it's checked in a fixed priority order (stranded first).
function classifyIntentLocally(text) {
  if (STRANDED_PATTERN.test(text)) {
    return { service: 'bot', query: null, summary: 'Your battery sounds too low to reach a station, so I found a Rollyy bot to come to you.' };
  }
  for (const service of ['maintenance', 'bot', 'carwash', 'parking', 'charging']) {
    if (SERVICE_PATTERNS[service].test(text)) {
      return {
        service,
        query: service === 'maintenance' ? text : extractPlace(text),
        summary: {
          charging: 'Looking for charging points for you.',
          parking: 'Looking for parking spots for you.',
          carwash: 'Looking for a nearby car wash.',
          maintenance: 'Matching you with a mechanic for that.',
          bot: 'Sending a Rollyy charging bot your way.'
        }[service]
      };
    }
  }
  return { service: null, query: null, summary: "I didn't quite catch that — try one of the tabs below." };
}

async function classifyIntentWithAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ]
      })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`Intent AI: OpenAI responded ${response.status} ${response.statusText} ${body.slice(0, 300)}`);
      return null;
    }
    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!VALID_SERVICES.includes(parsed.service)) return null;
    return {
      service: parsed.service,
      query: typeof parsed.query === 'string' ? parsed.query.slice(0, 300) : null,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 240) : ''
    };
  } catch (cause) {
    console.warn(`Intent AI: request failed (${cause.name}: ${cause.message}), falling back to keywords.`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Public entry point: try AI first, fall back to the deterministic matcher above on any failure.
export async function classifyIntent(text) {
  const aiResult = await classifyIntentWithAI(text);
  if (aiResult) return { ...aiResult, usedAi: true };
  return { ...classifyIntentLocally(text), usedAi: false };
}
