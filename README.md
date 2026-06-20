# ShikshaVaani - Voice-Enabled AI Teaching Assistant

> A hands-free AI co-pilot for government school classrooms in Haryana

## Live Demo
https://shik-shavaani.vercel.app/

## Tech Stack
| Component | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev, deploys in one command |
| STT | Web Speech API (browser-native) | Free, Hindi-capable, no API key |
| TTS | Web Speech API (browser-native) | Free, Hindi voice, no API key |
| AI | Google Gemini 1.5 Flash | Free tier, excellent Hinglish output |
| Deployment | Vercel | Free HTTPS, instant |

**API keys required: 1 (Gemini only)**

## Prompt Design
Gemini is instructed to return strict JSON, never plain text. This eliminates parsing failures and lets the UI render structured content (separate explanation, key points, analogy) rather than a blob of text. The system prompt forces the use of rural Indian analogies (chulha, khet, etc.) to make explanations resonate with students who have limited urban cultural references.

## Localization
- Speech recognition: `lang: 'hi-IN'` captures natural Hinglish speech
- AI output: system prompt explicitly requests Hinglish in Noto Sans Devanagari-compatible text
- TTS: `speechSynthesis` with `lang: 'hi-IN'` voice selection
- UI labels: Hindi primary, English secondary throughout

## Setup
1. Clone the repo
2. `cp .env.example .env` and add your Gemini API key from https://aistudio.google.com/apikey
3. `npm install`
4. `npm run dev`

## Deployment
Push to GitHub -> connect to Vercel -> set `VITE_GEMINI_API_KEY` in Vercel environment variables -> deploy.
