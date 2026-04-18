import { env } from 'process';

/**
 * Custom AI Service using Google Gemini via REST API.
 * This avoids needing to install @google/generative-ai or deal with dependency conflicts.
 */

const GEMINI_API_KEY = env.GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function askGemini(prompt: string, jsonMode = false): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const payload: any = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  if (jsonMode) {
    payload.generationConfig = {
      responseMimeType: 'application/json'
    };
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Gemini API Error:', errorBody);
    throw new Error(`Gemini API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('Unexpected response format from Gemini');
  }

  return text;
}
