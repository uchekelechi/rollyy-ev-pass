const SPECIALTY_ENUM = [
  'brakes', 'tyres', 'battery', 'engine', 'electrical', 'air_conditioning', 'bodywork', 'ev_specialist', 'general'
];

const SYSTEM_PROMPT = `You are a car maintenance triage assistant for the Rollyy app.
A driver describes a problem with their car in free text. Read it and respond with
strict JSON only, no prose, matching this shape:
{"specialties": string[], "urgency": "low" | "medium" | "high", "summary": string}

"specialties" must only contain values from this exact list: ${SPECIALTY_ENUM.join(', ')}.
Use "general" if nothing specific applies. "summary" is one short, plain-English
sentence explaining what you think is wrong and what kind of shop to look for.
Never recommend unsafe driving; if it sounds dangerous, set urgency to "high".`;

// Optional LLM-based issue triage. Requires a server-side OPENAI_API_KEY — the key is
// never sent to the client. Returns null (never throws) if AI isn't configured or fails,
// so the caller can fall back to the deterministic keyword matcher in recommendation.service.js.
export async function classifyIssueWithAI(issueText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !issueText?.trim()) return null;

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
          { role: 'user', content: issueText }
        ]
      })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`AI triage: OpenAI responded ${response.status} ${response.statusText} ${body.slice(0, 300)}`);
      return null;
    }

    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) {
      console.warn('AI triage: OpenAI response had no message content.');
      return null;
    }

    const parsed = JSON.parse(raw);
    const specialties = Array.isArray(parsed.specialties)
      ? parsed.specialties.filter((specialty) => SPECIALTY_ENUM.includes(specialty))
      : [];
    if (!specialties.length) {
      console.warn('AI triage: no recognised specialties in AI response, falling back to keywords.');
      return null;
    }

    return {
      specialties,
      urgency: ['low', 'medium', 'high'].includes(parsed.urgency) ? parsed.urgency : 'medium',
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 240) : ''
    };
  } catch (cause) {
    console.warn(`AI triage: request failed (${cause.name}: ${cause.message}), falling back to keywords.`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
