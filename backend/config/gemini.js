require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

console.log('Gemini config loaded:', { model: GEMINI_MODEL, keySet: !!GEMINI_API_KEY });

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generateContent = async (prompt, systemInstruction = '') => {
  console.log('Gemini SDK call starting...');
  console.log('Prompt length:', prompt.length, 'characters');

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  if (!response.candidates || response.candidates.length === 0) {
    console.error('Gemini returned no candidates:', JSON.stringify(response).substring(0, 500));
    throw new Error('Gemini returned no candidates. Content may have been blocked by safety filters.');
  }

  const candidate = response.candidates[0];
  if (candidate.finishReason === 'SAFETY') {
    console.error('Gemini response blocked by safety filters');
    throw new Error('Gemini blocked the response due to safety filters. Try rephrasing your request.');
  }

  const text = response.text();
  if (!text) {
    console.error('Gemini returned empty text');
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  console.log('Gemini response received, length:', text.length, 'characters');
  return text;
};

const generateJSON = async (prompt, systemInstruction = '') => {
  console.log('Gemini SDK JSON call starting...');
  console.log('Prompt length:', prompt.length, 'characters');

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  if (!response.candidates || response.candidates.length === 0) {
    console.error('Gemini JSON returned no candidates:', JSON.stringify(response).substring(0, 500));
    throw new Error('Gemini returned no candidates. Content may have been blocked by safety filters.');
  }

  const candidate = response.candidates[0];
  if (candidate.finishReason === 'SAFETY') {
    console.error('Gemini JSON response blocked by safety filters');
    throw new Error('Gemini blocked the response due to safety filters. Try rephrasing your request.');
  }

  const text = response.text();
  if (!text) {
    console.error('Gemini JSON returned empty text');
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  console.log('Gemini JSON response received, length:', text.length, 'characters');
  return JSON.parse(text);
};

module.exports = { generateContent, generateJSON };
