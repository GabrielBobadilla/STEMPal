require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const generateContent = async (prompt, systemInstruction = '') => {
  console.log('Gemini API call starting...');
  console.log('Prompt length:', prompt.length, 'characters');

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
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini API error:', response.status, err);
    throw new Error(`Gemini API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  console.log('Gemini response received, length:', text.length, 'characters');
  return text;
};

const generateJSON = async (prompt, systemInstruction = '') => {
  console.log('Gemini JSON call starting...');
  console.log('Prompt length:', prompt.length, 'characters');

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
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', response.status, err);
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    console.log('Gemini JSON response received, length:', text.length, 'characters');
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    console.error('Gemini JSON generation failed:', error.message);
    throw error;
  }
};

module.exports = { generateContent, generateJSON };
