import Anthropic from '@anthropic-ai/sdk';

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
  "archetype_description": "2-3 sentences describing this archetype.",
  "colorPalette": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "colorNames": ["name1","name2","name3","name4","name5"],
  "outfits": [
    {"name":"outfit1","occasion":"occasion1","pieces":["p1","p2","p3","p4"],"tip":"tip1"},
    {"name":"outfit2","occasion":"occasion2","pieces":["p1","p2","p3","p4"],"tip":"tip2"},
    {"name":"outfit3","occasion":"occasion3","pieces":["p1","p2","p3","p4"],"tip":"tip3"}
  ],
  "styleRules": ["rule1","rule2","rule3","rule4","rule5"],
  "shoppingTips": ["tip1","tip2","tip3","tip4"]
}

User quiz answers:
- Style identity: ${answers?.identity || 'not specified'}
- Occasions: ${Array.isArray(answers?.occasions) ? answers.occasions.join(', ') : answers?.occasions || 'mixed'}
- Style personality: ${answers?.style || 'not specified'}
- Colour preferences: ${answers?.colors || 'not specified'}
- Priority: ${answers?.priority || 'not specified'}
- Budget: ${answers?.budget || 'mid-range'}
- Dream vibe: ${answers?.vibe || 'not specified'}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
    const raw = message.content[0].text;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    return res.status(200).json(JSON.parse(match[0]));
  } catch (err) {
    console.error('BeStyle API error:', err.message);
    return res.status(500).json({ error: 'Failed to generate style profile', detail: err.message });
  }
}
