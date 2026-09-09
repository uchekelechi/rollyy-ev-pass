// Deterministic keyword -> specialty mapping. Replaces this with an LLM classifier in a future iteration.
const SPECIALTY_KEYWORDS = {
  brakes: ['brake', 'brakes', 'squeal', 'grinding when stopping', 'pedal soft'],
  tyres: ['tyre', 'tire', 'puncture', 'flat', 'tread', 'wheel alignment', 'alignment'],
  battery: ['battery', "won't start", 'wont start', 'no power', 'dead battery', 'jump start'],
  engine: ['engine', 'overheating', 'smoke', 'stalling', 'stalls', 'check engine', 'misfire'],
  electrical: ['electrical', 'wiring', 'fuse', 'lights not working', 'dashboard warning'],
  air_conditioning: ['ac ', 'air con', 'air conditioning', 'not cooling', 'aircon'],
  bodywork: ['dent', 'scratch', 'bodywork', 'bumper', 'paint', 'collision', 'crash'],
  ev_specialist: ['ev', 'electric vehicle', 'charging port', 'high voltage', 'battery pack', 'inverter']
};

// OSM tags that directly confirm a shop offers a given specialty when present.
const SPECIALTY_OSM_TAGS = {
  brakes: ['service:vehicle:brakes'],
  tyres: ['service:vehicle:tyres'],
  battery: ['service:vehicle:battery'],
  engine: ['service:vehicle:engine', 'service:vehicle:diagnostic'],
  electrical: ['service:vehicle:electrical'],
  air_conditioning: ['service:vehicle:air_conditioning'],
  bodywork: ['service:vehicle:bodywork', 'craft', 'shop=car_body'],
  ev_specialist: ['service:vehicle:electric']
};

export function detectSpecialties(issueText) {
  const text = issueText.toLowerCase();
  const matches = Object.entries(SPECIALTY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([specialty]) => specialty);
  return matches.length ? matches : ['general'];
}

function shopMatchesSpecialty(shop, specialty) {
  const tagKeys = SPECIALTY_OSM_TAGS[specialty] || [];
  const hasTagMatch = tagKeys.some((tagKey) => shop.tags?.[tagKey] === 'yes');
  const nameHaystack = `${shop.name} ${shop.tags?.brand || ''}`.toLowerCase();
  const keywordMatch = (SPECIALTY_KEYWORDS[specialty] || []).some((keyword) => nameHaystack.includes(keyword.trim()));
  return { hasTagMatch, keywordMatch };
}

// Ranks nearby repair shops against a pre-determined list of specialties (from either the
// keyword matcher below or an AI classifier) — shared so both paths score shops identically.
function scoreShops(shops, specialties) {
  return shops
    .map((shop) => {
      let score = 0;
      const reasons = [];

      for (const specialty of specialties) {
        if (specialty === 'general') continue;
        const { hasTagMatch, keywordMatch } = shopMatchesSpecialty(shop, specialty);
        if (hasTagMatch) {
          score += 30;
          reasons.push(`Confirmed ${specialty.replace('_', ' ')} service`);
        } else if (keywordMatch) {
          score += 15;
          reasons.push(`Likely handles ${specialty.replace('_', ' ')} work`);
        }
      }

      const proximityScore = shop.distanceKm == null ? 0 : Math.max(0, 20 - shop.distanceKm * 2);
      score += proximityScore;
      if (!reasons.length) reasons.push('General repair shop nearby');

      return { ...shop, matchScore: Math.round(score), matchReasons: reasons, detectedSpecialties: specialties };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// Ranks nearby repair shops against the driver's described issue: specialty match first, distance second.
export function rankMechanics(shops, issueText) {
  return scoreShops(shops, detectSpecialties(issueText));
}

// Same ranking, but for specialties already determined elsewhere (e.g. the AI triage classifier).
export function rankMechanicsBySpecialties(shops, specialties) {
  return scoreShops(shops, specialties.length ? specialties : ['general']);
}
