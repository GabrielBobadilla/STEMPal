require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generateContent = async (prompt, systemInstruction = '') => {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('Gemini returned no candidates. Content may have been blocked by safety filters.');
  }

  const candidate = response.candidates[0];
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked the response due to safety filters. Try rephrasing your request.');
  }

  const text = response.text();
  if (!text) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  return text;
};

const generateJSON = async (prompt, systemInstruction = '') => {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('Gemini returned no candidates.');
  }

  const candidate = response.candidates[0];
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked the response due to safety filters.');
  }

  const text = response.text();
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(text);
};

module.exports = { generateContent, generateJSON };
