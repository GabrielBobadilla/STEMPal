const { generateContent, generateJSON } = require('../config/gemini');

const SYSTEM_TUTOR = 'STEM tutor. Generate original content. Return valid JSON only.';

const SYSTEM_WELLNESS = 'Study wellness expert. Return valid JSON only.';

const parseAIJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('AI returned empty or invalid response');
  }

  let cleaned = text.replace(/```json|```/g, '').trim();

  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');

  let startIdx = -1;
  if (firstBracket >= 0 && firstBrace >= 0) {
    startIdx = Math.min(firstBracket, firstBrace);
  } else if (firstBracket >= 0) {
    startIdx = firstBracket;
  } else if (firstBrace >= 0) {
    startIdx = firstBrace;
  }

  if (startIdx >= 0) {
    cleaned = cleaned.substring(startIdx);
  }

  const lastBracket = cleaned.lastIndexOf(']');
  const lastBrace = cleaned.lastIndexOf('}');
  let endIdx = -1;
  if (lastBracket >= 0 && lastBrace >= 0) {
    endIdx = Math.max(lastBracket, lastBrace) + 1;
  } else if (lastBracket >= 0) {
    endIdx = lastBracket + 1;
  } else if (lastBrace >= 0) {
    endIdx = lastBrace + 1;
  }

  if (endIdx > startIdx) {
    cleaned = cleaned.substring(0, endIdx);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse failed. Raw text (first 500 chars):', text.substring(0, 500));
    console.error('Cleaned text (first 500 chars):', cleaned.substring(0, 500));
    throw new Error(`AI returned invalid JSON. Please try again. Details: ${e.message}`);
  }
};

const generateReviewer = async (topic, type = 'basic') => {
  const prompts = {
    basic: `Generate study materials for "${topic}". Return JSON: {summary: "paragraph", key_concepts: [{term, definition} x5+], important_definitions: [{term, definition} x4+]}.`,
    detailed: `Generate detailed study materials for "${topic}". Return JSON: {summary, key_concepts: [{term, definition}], important_definitions: [{term, definition}], formula_sheet: [{name, formula, description}], detailed_explanations: [{topic, explanation} x3+], practice_questions: [{question, answer, difficulty} x5+]}.`,
    exam: `Generate exam prep for "${topic}". Return JSON: {summary, key_formulas: [{name, formula}], common_mistakes: [{mistake, correction} x4+], practice_questions: [{question, options, answer, explanation, difficulty} x5+]}.`
  };

  const text = await generateContent(prompts[type] || prompts.basic, SYSTEM_TUTOR);
  const result = parseAIJson(text);
  return result;
};

const generateFlashcards = async (topic, count = 10) => {
  console.log('Gemini Request Started - Flashcard Generation');
  console.log(`Sending prompt for ${count} flashcards about "${topic}"`);

  const text = await generateContent(
    `Generate ${count} flashcards about "${topic}" for STEM students. Mix definitions, formulas, concepts. Return JSON array: [{question, answer, difficulty}] with difficulty as easy/medium/hard.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log(`Gemini Response Received - ${Array.isArray(result) ? result.length : '?'} Flashcards Generated`);
  return result;
};

const generateQuiz = async (topic, type = 'multiple_choice', count = 10) => {
  const typeInstructions = {
    multiple_choice: 'multiple choice questions with 4 options each, include the correct answer',
    identification: 'identification questions where the student provides a short answer',
    true_false: 'true or false questions with boolean answer',
    short_answer: 'short answer questions requiring brief explanations'
  };

  console.log('Gemini Request Started - Quiz Generation');
  console.log(`Sending prompt for ${count} ${type} questions about "${topic}"`);

  const text = await generateContent(
    `Generate ${count} ${typeInstructions[type] || typeInstructions.multiple_choice} about "${topic}". Include difficulty (easy/medium/hard) for each. Return JSON array of question objects.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log(`Gemini Response Received - ${Array.isArray(result) ? result.length : '?'} Questions Generated`);
  return result;
};

const generateFormulaSheet = async (topic) => {
  const text = await generateContent(
    `Generate formula sheet for "${topic}". Return JSON array: [{name, formula, description}]. Only real, accurate formulas.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);
  return result;
};

const generateBreakRecommendation = async (focusLevel, studyTime, quizScore, preferences) => {
  const result = await generateJSON(
    `Student focus: ${focusLevel}, study: ${studyTime}min, score: ${quizScore}%, prefs: ${JSON.stringify(preferences)}. Recommend a break activity. Return JSON: {recommendation, duration, reason, benefits: []}.`,
    SYSTEM_WELLNESS
  );
  return result;
};

const generateAdaptiveQuestions = async (topic, weakTopics, difficulty) => {
  const text = await generateContent(
    `Topic: "${topic}". Weak areas: ${JSON.stringify(weakTopics)}. Difficulty: ${difficulty}. Generate 5 questions targeting weak areas. Return JSON array of question objects.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);
  return result;
};

const generateKeyTerms = async (topic) => {
  const text = await generateContent(
    `Generate key terms and definitions for "${topic}". Return JSON array: [{term, definition}].`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);
  return result;
};

const extractTextFromPDF = async (text) => {
  const truncated = text.substring(0, 15000);
  const result = await generateContent(
    `Organize this text into study format:\n\n${truncated}`,
    'Document processing assistant.'
  );
  return result;
};

const generateCrosswordData = async (topic, difficulty = 'medium', count = 15) => {
  const difficultyConfig = {
    easy: { wordCount: '8-12', wordLength: '3-6 letters mostly', clueStyle: 'simple and straightforward' },
    medium: { wordCount: '12-18', wordLength: '4-8 letters mostly', clueStyle: 'moderate academic level' },
    hard: { wordCount: '15-25', wordLength: '5-10 letters mostly', clueStyle: 'challenging and precise' },
  };
  const config = difficultyConfig[difficulty] || difficultyConfig.medium;

  const prompt = `Create a crossword puzzle. Topic: "${topic}". Difficulty: ${difficulty}. ${config.wordCount} words, ${config.wordLength}, clues ${config.clueStyle}. All answers must be SINGLE UPPERCASE WORDS (A-Z only, no spaces/hyphens). Return JSON: {title, across: [{number, answer, clue}], down: [{number, answer, clue}]}`;

  const systemInstruction = 'STEM educator creating crosswords. Valid JSON only, no markdown.';

  console.log('Gemini Request Started - Crossword Generation');
  console.log(`Sending prompt for topic: "${topic}", difficulty: ${difficulty}`);

  const result = await generateJSON(prompt, systemInstruction);

  if (result && ((result.across && result.across.length > 0) || (result.down && result.down.length > 0))) {
    const allWords = [...(result.across || []), ...(result.down || [])];
    const cleaned = allWords.map(w => ({
      ...w,
      answer: (w.answer || '').toUpperCase().replace(/[^A-Z]/g, ''),
      clue: w.clue || 'STEM concept',
    })).filter(w => w.answer.length >= 2);

    console.log(`Gemini Response Received - Crossword Generated (${cleaned.length} words)`);
    return { title: result.title || topic, across: cleaned.filter(w => w.number), down: [] };
  }

  throw new Error('Gemini returned invalid crossword data');
};

const generateMultiplayerQuestions = async (category, difficulty, count) => {
  const difficultyConfig = {
    easy: 'basic level questions suitable for beginners',
    medium: 'intermediate level questions requiring solid understanding',
    hard: 'advanced level questions for expert students',
  };

  console.log('Gemini Request Started - Multiplayer Quiz Generation');
  console.log(`Sending prompt for ${count} ${difficulty} ${category} questions`);

  const text = await generateContent(
    `Generate ${count} STEM quiz questions in "${category}". Difficulty: ${difficultyConfig[difficulty] || difficultyConfig.medium}. Return JSON array: [{question, options: [4 choices], answer: index 0-3}].`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log(`Gemini Response Received - ${Array.isArray(result) ? result.length : '?'} Multiplayer Questions Generated`);
  return result;
};

const generateAdaptiveCrossword = async (topic, weakTopics = [], difficulty = 'medium') => {
  let targetTopic = topic;
  if (weakTopics && weakTopics.length > 0) {
    targetTopic = `${topic} focusing especially on: ${weakTopics.join(', ')}`;
  }
  return generateCrosswordData(targetTopic, difficulty, difficulty === 'easy' ? 10 : difficulty === 'hard' ? 22 : 15);
};

module.exports = {
  generateReviewer,
  generateFlashcards,
  generateQuiz,
  generateFormulaSheet,
  generateBreakRecommendation,
  generateAdaptiveQuestions,
  generateKeyTerms,
  extractTextFromPDF,
  generateCrosswordData,
  generateAdaptiveCrossword,
  generateMultiplayerQuestions
};
