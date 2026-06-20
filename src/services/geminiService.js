/**
 * AI Service — tries Gemini first, falls back to Groq (llama-3.3-70b-versatile).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY;

// ─── System prompts ──────────────────────────────────────────────────────────

const CONCEPT_SYSTEM_PROMPT = `You are ShikshaVaani, an AI teaching assistant for government school classrooms in Haryana, India. Students are in grades 5-8 and speak Hinglish (a natural mix of Hindi and English). Your job is to explain academic concepts in simple, warm, conversational Hinglish — like a friendly elder sibling who just happens to know everything.

Rules you must never break:
1. Always respond with ONLY a valid JSON object — no markdown, no code fences, no preamble text.
2. Your hinglish_explanation must be simple enough for a 12-year-old who has never left their village.
3. Your fun_analogy must use something from a rural Indian child's daily life — a khet (farm field), chulha (wood stove), bullock cart, diya, nadi (river), barsaat (rain), mela (fair), etc.
4. Never use technical jargon without immediately explaining it in the same sentence.
5. If the topic is unclear or outside school curriculum scope, return: {"error": "Topic samajh nahi aaya, dobara bolein"}

JSON schema to return:
{
  "topic": "<topic in English | हिंदी में topic>",
  "hinglish_explanation": "<3-4 sentences>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"],
  "fun_analogy": "<one relatable analogy>",
  "emoji_summary": "<3-5 emojis>",
  "difficulty_level": "beginner | intermediate | advanced"
}`;

const QUIZ_SYSTEM_PROMPT = `You are ShikshaVaani, an AI quiz generator for government school classrooms in Haryana, India. Generate exactly 4 multiple-choice questions for the given topic, appropriate for grades 5-8.

Rules:
1. Respond ONLY with valid JSON — no markdown, no code fences, no extra text.
2. Questions must be in simple Hinglish — accessible to students who may not read well.
3. All four answer options must be plausible — no obviously silly wrong answers.
4. Explanations must be warm and encouraging, never condescending.
5. Questions must test genuine understanding, not rote memorization.

JSON schema:
{
  "topic": "string",
  "questions": [
    {
      "question_text": "string",
      "options": ["A. string", "B. string", "C. string", "D. string"],
      "correct_option": "A" | "B" | "C" | "D",
      "explanation": "string"
    }
  ]
}`;

const TRANSLATION_SYSTEM_PROMPT = `You are a bilingual translation assistant for Indian school classrooms (grades 5-8). 
Given a sentence or phrase in any language (usually English or Hinglish), you must:
1. Return ONLY a valid JSON object — no markdown, no preamble.
2. Provide the original text, a clean English version, and a proper Hindi (Devanagari) translation.
3. Also provide a simple Hinglish pronunciation guide for the Hindi text (roman script).
4. Keep language simple — grade 5-8 level.

JSON schema:
{
  "original": "string",
  "english": "string",
  "hindi": "string (Devanagari script)",
  "pronunciation": "string (roman script, how to say the Hindi)",
  "word_pairs": [{"english": "word", "hindi": "शब्द"}]
}`;

const ACTIVITY_SYSTEM_PROMPT = `You are ShikshaVaani, an AI classroom activity guide for government school teachers in Haryana, India (grades 5-8).
Given an activity description, generate a structured, hands-free activity guide.

Rules:
1. Respond ONLY with valid JSON — no markdown, no code fences.
2. Steps must be short, clear Hinglish instructions a teacher can read aloud.
3. Duration in seconds (e.g. 5 min = 300).
4. Each step has its own time_seconds so a per-step timer can run.
5. Include a warm encouraging closing message.

JSON schema:
{
  "title": "string",
  "total_seconds": number,
  "intro": "string (spoken introduction in Hinglish)",
  "steps": [
    {
      "step_number": number,
      "instruction": "string (Hinglish, read aloud)",
      "time_seconds": number,
      "visual_cue": "string (1-2 word label for screen)"
    }
  ],
  "closing": "string (Hinglish encouragement)"
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJSON(text) {
  const clean = text.replace(/```json|```/gi, '').trim();
  try { return JSON.parse(clean); } catch {
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s >= 0 && e > s) {
      try { return JSON.parse(clean.slice(s, e + 1)); } catch { /* fall */ }
    }
    throw new Error('AI ne valid JSON nahi bheja. Dobara try karein.');
  }
}

function geminiAvailable() {
  return GEMINI_KEY && GEMINI_KEY !== 'your_key_here' && GEMINI_KEY.length > 10;
}
function groqAvailable() {
  return GROQ_KEY && GROQ_KEY !== 'your_groq_key_here' && GROQ_KEY.length > 10;
}
function requireAtLeastOne() {
  if (!geminiAvailable() && !groqAvailable())
    throw new Error('Koi bhi API key set nahi hai. .env mein VITE_GROQ_API_KEY add karein.');
}

// ─── Generic Groq caller ──────────────────────────────────────────────────────

async function groqCall(systemPrompt, userMessage, temperature = 0.5) {
  const client = new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true });
  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
  });
  return parseJSON(res.choices[0].message.content);
}

// ─── Generic Gemini caller ────────────────────────────────────────────────────

async function geminiCall(systemPrompt, userMessage, temperature = 0.5) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: systemPrompt,
    generationConfig: { temperature, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  });
  return parseJSON(result.response.text());
}

// ─── Unified caller with fallback ────────────────────────────────────────────

async function callAI(systemPrompt, userMessage, temperature = 0.5) {
  requireAtLeastOne();
  if (geminiAvailable()) {
    try { return await geminiCall(systemPrompt, userMessage, temperature); }
    catch (err) {
      if (!groqAvailable()) throw err;
      console.warn('Gemini failed, falling back to Groq:', err.message);
    }
  }
  return groqCall(systemPrompt, userMessage, temperature);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export let activeProvider = 'none';

export async function explainConcept(userQuery) {
  const data = await callAI(CONCEPT_SYSTEM_PROMPT, userQuery, 0.45);
  if (data.error) throw new Error(data.error);
  activeProvider = geminiAvailable() ? 'gemini' : 'groq';
  return data;
}

export async function generateQuiz(topic) {
  const data = await callAI(QUIZ_SYSTEM_PROMPT, `Quiz banao is topic pe: ${topic || 'school topic'}`, 0.65);
  if (!Array.isArray(data.questions) || data.questions.length === 0)
    throw new Error('Quiz response adhura hai. Dobara sawaal bolein.');
  activeProvider = geminiAvailable() ? 'gemini' : 'groq';
  return { ...data, questions: data.questions.slice(0, 4) };
}

export async function translateText(text) {
  const data = await callAI(TRANSLATION_SYSTEM_PROMPT, text, 0.3);
  activeProvider = geminiAvailable() ? 'gemini' : 'groq';
  return data;
}

export async function generateActivityGuide(description) {
  const data = await callAI(ACTIVITY_SYSTEM_PROMPT, `Activity banao: ${description}`, 0.5);
  if (!Array.isArray(data.steps) || data.steps.length === 0)
    throw new Error('Activity guide nahi bana. Dobara try karein.');
  activeProvider = geminiAvailable() ? 'gemini' : 'groq';
  return data;
}
