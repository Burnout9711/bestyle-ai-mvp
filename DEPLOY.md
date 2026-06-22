# Deploy BeStyle.ai in 5 Minutes

## What you need
- A free Vercel account → https://vercel.com/signup
- Your Anthropic API key → https://console.anthropic.com

## Steps

### 1. Push to GitHub
Create a new repo on GitHub and push this folder to it.

### 2. Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Click **Deploy** (no build settings needed)

### 3. Add your API key
1. In Vercel → go to your project → **Settings** → **Environment Variables**
2. Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
3. Click **Redeploy**

### Done! 🎉
Your site is live. Share the Vercel URL.

---

## File structure
```
bestyle-mvp/
├── api/
│   └── recommend.js     ← AI backend (Claude API)
├── index.html           ← Landing page
├── quiz.html            ← 7-step style quiz
├── results.html         ← AI results page
├── style.css            ← All styles
├── package.json
├── vercel.json
└── .env.example
```

## How the AI works
1. User completes quiz → answers saved in browser sessionStorage
2. Results page calls `/api/recommend` with the quiz answers
3. Backend sends answers to Claude claude-haiku-4-5 with a styling prompt
4. Claude returns a JSON style profile
5. Results page renders the profile beautifully

If the API is unavailable, the app shows a smart fallback profile automatically.
