require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const FETCH_TIMEOUT = 60000;

const generateContent = async (prompt, systemInstruction = '') => {
  console.log('Gemini API call starting...');
  console.log('Prompt length:', prompt.length, 'characters');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', response.status, err);
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini returned no candidates:', JSON.stringify(data).substring(0, 500));
      throw new Error('Gemini returned no candidates. Content may have been blocked by safety filters.');
    }

    const candidate = data.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
      console.error('Gemini response blocked by safety filters');
      throw new Error('Gemini blocked the response due to safety filters. Try rephrasing your request.');
    }

    const text = candidate?.content?.parts?.[0]?.text || '';
    if (!text) {
      console.error('Gemini returned empty text from candidates');
      throw new Error('Gemini returned an empty response. Please try again.');
    }

    console.log('Gemini response received, length:', text.length, 'characters');
    return text;
  } finally {
    clearTimeout(timeout);
  }
};

const generateJSON = async (prompt, systemInstruction = '') => {
  console.log('Gemini JSON call starting...');
  console.log('Prompt length:', prompt.length, 'characters');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', response.status, err);
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini JSON returned no candidates:', JSON.stringify(data).substring(0, 500));
      throw new Error('Gemini returned no candidates. Content may have been blocked by safety filters.');
    }

    const candidate = data.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
      console.error('Gemini JSON response blocked by safety filters');
      throw new Error('Gemini blocked the response due to safety filters. Try rephrasing your request.');
    }

    const text = candidate?.content?.parts?.[0]?.text || '';
    if (!text) {
      console.error('Gemini JSON returned empty text');
      throw new Error('Gemini returned an empty response. Please try again.');
    }

    console.log('Gemini JSON response received, length:', text.length, 'characters');
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    if (error.message.includes('aborted')) {
      console.error('Gemini JSON request timed out after', FETCH_TIMEOUT / 1000, 'seconds');
      throw new Error('Gemini API request timed out. Please try again.');
    }
    console.error('Gemini JSON generation failed:', error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { generateContent, generateJSON };
