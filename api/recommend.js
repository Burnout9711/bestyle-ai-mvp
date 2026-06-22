// BeStyle.ai — AI Style Recommendation API
// Vercel Serverless Function → calls Google Gemini (FREE tier)
// Get free API key: https://aistudio.google.com/app/apikey

import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { answers } = req.body || {};

  const prompt = `You are BeStyle.ai's expert AI personal stylist. Analyse the user's style quiz answers and return ONLY a valid JSON object (no markdown, no explanation):
{
  "styleArchetype": "2-4 word archetype name",
  "archetype_description": "2-3 compelling sentences describing this archetype.",
  "colorPalette": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "colorNames": ["name1","name2","name3","name4","name5"],
  "outfits": [
    {"name":"outfit1","occasion":"occasion1","pieces":["specific piece 1","specific piece 2","specific piece 3","specific piece 4"],"tip":"styling tip"},
    {"name":"outfit2","occasion":"occasion2","pieces":["specific piece 1","specific piece 2","specific piece 3","specific piece 4"],"tip":"styling tip"},
    {"name":"outfit3","occasion":"occasion3","pieces":["specific piece 1","specific piece 2","specific piece 3","specific piece 4"],"tip":"styling tip"}
  ],
  "styleRules": ["rule1","rule2","rule3","rule4","rule5"],
  "shoppingTips": ["tip1","tip2","tip3","tip4"]
}

User quiz answers:
- Style identity: ${answers?.identity || 'not specified'}
- Occasions: ${Array.isArray(answers?.occasions) ? answers.occasions.join(', ') : answers?.occasions || 'mixed'}
- Style personality: ${answers?.style || 'not specified'}
- Colour preferences: ${answers?.colors || 'not specified'}
- Priority when dressing: ${answers?.priority || 'not specified'}
- Budget per outfit: ${answers?.budget || 'mid-range'}
- Dream style vibe: ${answers?.vibe || 'not specified'}`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    return res.status(200).json(JSON.parse(match[0]));
  } catch (err) {
    console.error('BeStyle API error:', err.message);
    return res.status(500).json({ error: 'Failed to generate style profile', detail: err.message });
  }
}
