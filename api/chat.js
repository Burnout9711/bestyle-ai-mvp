// BeStyle.ai — Reactive Stylist Chat API
// Generates a short, human reaction to each quiz chat answer,
// so the onboarding conversation responds to what the user actually said.

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'].filter(Boolean);

async function generateWithFallback(genAI, prompt) {
  let lastErr;
  for (const name of MODELS) {
    try {
      // Note: no maxOutputTokens cap — Gemini 2.5 spends "thinking" tokens from the same
      // budget and a low cap truncates the visible reply. Brevity is enforced by the prompt.
      const model = genAI.getGenerativeModel({ model: name, generationConfig: { temperature: 0.8 } });
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

  const { stage, question, answer, context } = req.body || {};
  const c = context || {};

  const prompt = `You are the BeStyle.ai AI personal stylist, in a short onboarding chat with a new user.

What you know about them so far (from their quiz):
- Shopping for: ${c.gender === 'men' ? "men's fashion" : "women's fashion"}
- Aesthetics they loved: ${c.likedAesthetics || 'not specified'}
- Body shape: ${c.bodyShape || 'not specified'}, height: ${c.height || '?'}cm, skin tone: ${c.skinTone || 'not specified'}
- They dress for: ${c.occasions || 'not specified'}
${stage === 1 && c.previousAnswer ? `- Earlier they said they struggle to dress for: "${c.previousAnswer}"` : ''}

You asked: "${question || ''}"
They answered: "${answer || ''}"

Write ONE short reaction (maximum 2 sentences, under 35 words) that:
- Responds directly to what they actually said, echoing their specific words where natural
- Sounds like a warm, confident human stylist — no emojis, no over-excitement
- If their answer is vague, dismissive or a joke (like "nothing", "bad", "idk"), react to THAT naturally and lightly, like a real person would — never pretend it was a detailed answer
${stage === 0
  ? '- Do NOT ask any question — your next question arrives separately right after.'
  : '- End by saying you now have what you need to build their profile.'}

Return ONLY the reaction text. No quotes, no markdown.`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const raw = await generateWithFallback(genAI, prompt);
    const reply = raw.trim().replace(/^["']|["']$/g, '');
    if (!reply) throw new Error('Empty reply');
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('BeStyle chat API error:', err.message);
    return res.status(500).json({ error: 'Failed to generate reply', detail: err.message });
  }
}
