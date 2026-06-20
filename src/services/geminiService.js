/**
 * AI Service — tries Gemini first, falls back to Groq (llama-3.3-70b-versatile).
 * Both providers are asked to return strict JSON so the same parser works for both.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ─── Prompts ────────────────────────────────────────────────────────────────

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

// ─── JSON parser ─────────────────────────────────────────────────────────────

function parseJSON(text) {
  const clean = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        throw new Error('AI ne valid JSON nahi bheja. Dobara try karein.');
      }
    }
    throw new Error('AI ne valid JSON nahi bheja. Dobara try karein.');
  }
}

// ─── Provider check helpers ───────────────────────────────────────────────────

function geminiAvailable() {
  return GEMINI_KEY && GEMINI_KEY !== 'your_key_here' && GEMINI_KEY.length > 10;
}

function groqAvailable() {
  return GROQ_KEY && GROQ_KEY !== 'your_groq_key_here' && GROQ_KEY.length > 10;
}

function requireAtLeastOne() {
  if (!geminiAvailable() && !groqAvailable()) {
    throw new Error('Koi bhi API key set nahi hai. .env mein VITE_GROQ_API_KEY add karein.');
  }
}

// ─── Gemini calls ─────────────────────────────────────────────────────────────

async function geminiExplain(userQuery) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userQuery }] }],
    systemInstruction: CONCEPT_SYSTEM_PROMPT,
    generationConfig: { temperature: 0.45, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  });
  return parseJSON(result.response.text());
}

async function geminiQuiz(topic) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Quiz banao is topic pe: ${topic || 'school topic'}` }] }],
    systemInstruction: QUIZ_SYSTEM_PROMPT,
    generationConfig: { temperature: 0.65, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  });
  return parseJSON(result.response.text());
}

// ─── Groq calls ───────────────────────────────────────────────────────────────

async function groqExplain(userQuery) {
  const client = new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true });
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.45,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CONCEPT_SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ],
  });
  return parseJSON(completion.choices[0].message.content);
}

async function groqQuiz(topic) {
  const client = new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true });
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.65,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: QUIZ_SYSTEM_PROMPT },
      { role: 'user', content: `Quiz banao is topic pe: ${topic || 'school topic'}` },
    ],
  });
  return parseJSON(completion.choices[0].message.content);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export let activeProvider = 'none';

export async function explainConcept(userQuery) {
  requireAtLeastOne();

  if (geminiAvailable()) {
    try {
      const data = await geminiExplain(userQuery);
      if (data.error) throw new Error(data.error);
      activeProvider = 'gemini';
      return data;
    } catch (err) {
      // If Groq is available as fallback, swallow the error and continue.
      if (!groqAvailable()) throw err;
      console.warn('Gemini failed, falling back to Groq:', err.message);
    }
  }

  // Groq path
  const data = await groqExplain(userQuery);
  if (data.error) throw new Error(data.error);
  activeProvider = 'groq';
  return data;
}

export async function generateQuiz(topic) {
  requireAtLeastOne();

  if (geminiAvailable()) {
    try {
      const data = await geminiQuiz(topic);
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Quiz response adhura hai.');
      }
      activeProvider = 'gemini';
      return { ...data, questions: data.questions.slice(0, 4) };
    } catch (err) {
      if (!groqAvailable()) throw err;
      console.warn('Gemini failed, falling back to Groq:', err.message);
    }
  }

  const data = await groqQuiz(topic);
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Quiz response adhura hai. Dobara sawaal bolein.');
  }
  activeProvider = 'groq';
  return { ...data, questions: data.questions.slice(0, 4) };
}
