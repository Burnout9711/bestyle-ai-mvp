// BeStyle.ai — AI Style Recommendation API
// Vercel Serverless Function → calls Google Gemini
// Get free API key: https://aistudio.google.com/app/apikey

import { GoogleGenerativeAI } from '@google/generative-ai';

// Model fallback chain — if Google retires one, the next is tried automatically.
const MODELS = [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'].filter(Boolean);

async function generateWithFallback(genAI, prompt) {
  let lastErr;
  for (const name of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { answers } = req.body || {};
  const a = answers || {};

  const prompt = `You are BeStyle.ai's expert AI personal stylist. A user completed a style quiz. Build a genuinely personalised style profile for them.

EVERYTHING WE KNOW ABOUT THIS USER:
- Shopping for: ${a.gender === 'men' ? "men's fashion" : "women's fashion"}
- Aesthetics they LOVED (swiped yes): ${a.likedAesthetics || 'not specified'}
- Aesthetics they REJECTED (swiped no): ${a.dislikedAesthetics || 'none'}
- Body shape: ${a.bodyShape || 'not specified'}
- Height: ${a.height || 'not specified'}
- Skin tone: ${a.skinTone || 'not specified'}
- Occasions they dress for: ${Array.isArray(a.occasions) ? a.occasions.join(', ') : a.occasions || 'mixed'}
- Situation they STRUGGLE to dress for (their exact words): "${a.struggleOccasion || 'not specified'}"
- How they want to FEEL when seen (their exact words): "${a.desiredFeeling || 'not specified'}"

PERSONALISATION RULES — this is what makes the profile feel real:
1. The archetype_description MUST weave in their own words (their struggle and desired feeling) so they recognise themselves in it.
2. At least one outfit MUST directly solve the situation they said they struggle with, and its occasion should name that situation.
3. Every outfit tip should reference their body shape, height or skin tone where relevant (e.g. lengthening lines for petite, colours that flatter their undertone).
4. The colour palette must genuinely flatter their stated skin tone — name colours accordingly.
5. Respect the rejected aesthetics: never recommend pieces in that direction.
6. All garments must match the gender they are shopping for.
7. Be specific: "Tailored camel blazer", never just "blazer".
8. If their answers were vague or dismissive, still build a confident profile from the swipe data — never mention that answers were vague.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "styleArchetype": "2-4 word archetype name",
  "archetype_description": "2-3 compelling sentences, personalised with their own words.",
  "colorPalette": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "colorNames": ["name1","name2","name3","name4","name5"],
  "outfits": [
    {"name":"outfit name","occasion":"occasion","pieces":["piece 1","piece 2","piece 3","piece 4"],"tip":"styling tip tied to their body/colouring"},
    {"name":"outfit name","occasion":"occasion","pieces":["piece 1","piece 2","piece 3","piece 4"],"tip":"styling tip"},
    {"name":"outfit name","occasion":"occasion","pieces":["piece 1","piece 2","piece 3","piece 4"],"tip":"styling tip"}
  ],
  "styleRules": ["rule1","rule2","rule3","rule4","rule5"],
  "shoppingTips": ["tip1","tip2","tip3","tip4"]
}`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const raw = await generateWithFallback(genAI, prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    return res.status(200).json(JSON.parse(match[0]));
  } catch (err) {
    console.error('BeStyle API error:', err.message);
    return res.status(500).json({ error: 'Failed to generate style profile', detail: err.message });
  }
}
