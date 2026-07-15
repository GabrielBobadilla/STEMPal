const { generateContent, generateJSON } = require('../config/gemini');

const SYSTEM_TUTOR = 'You are an expert STEM tutor creating high-quality study materials for university-level students. Generate completely original educational content. Do not reuse previous questions or generic templates. Create unique, topic-specific content every request. Respond with valid JSON only.';
const SYSTEM_WELLNESS = 'You are a study wellness expert focused on student health and productivity. Generate completely original personalized recommendations every time. Respond with valid JSON only.';

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
    basic: `Generate completely original study materials for "${topic}". Create a unique reviewer with accurate, topic-specific content. Do not use generic templates. Return valid JSON with keys: summary (detailed paragraph about ${topic}), key_concepts (array of {term, definition} with 5+ real concepts), important_definitions (array of {term, definition} with 4+ real definitions).`,
    detailed: `Generate completely original detailed study materials for "${topic}". Create unique, comprehensive content specific to this topic. Return valid JSON with keys: summary, key_concepts (array of {term, definition}), important_definitions (array of {term, definition}), formula_sheet (array of {name, formula, description} with real formulas if applicable), detailed_explanations (array of {topic, explanation} with 3+ detailed explanations), practice_questions (array of {question, answer, difficulty} with 5+ questions).`,
    exam: `Generate completely original exam-focused study materials for "${topic}". Create unique exam prep content. Return valid JSON with keys: summary, key_formulas (array of {name, formula} with real formulas if applicable), common_mistakes (array of {mistake, correction} with 4+ real common errors), practice_questions (array of {question, options, answer, explanation, difficulty} with 5+ questions with 4 options each).`
  };

  console.log('Gemini Request Started - Reviewer Generation');
  console.log(`Sending prompt for topic: "${topic}", type: ${type}`);

  const text = await generateContent(prompts[type] || prompts.basic, SYSTEM_TUTOR);
  const result = parseAIJson(text);

  console.log('Gemini Response Received - Reviewer Generated');
  return result;
};

const generateFlashcards = async (topic, count = 10) => {
  console.log('Gemini Request Started - Flashcard Generation');
  console.log(`Sending prompt for ${count} flashcards about "${topic}"`);

  const text = await generateContent(
    `Generate ${count} completely unique and original flashcards about "${topic}" for STEM students. Each flashcard must be different and specific to ${topic}. Do not create generic flashcards. Include a mix of definitions, formulas, and concepts. Create a new question set every request. Return a JSON array of objects with "question", "answer", and "difficulty" (easy/medium/hard) fields.`,
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
    `Generate ${count} completely unique and original ${typeInstructions[type] || typeInstructions.multiple_choice} about "${topic}" for STEM students. Each question must be different and specific to ${topic}. Avoid duplicate questions. Create a new question set every request. Include difficulty level (easy/medium/hard) for each question. Return a JSON array of question objects.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log(`Gemini Response Received - ${Array.isArray(result) ? result.length : '?'} Questions Generated`);
  return result;
};

const generateFormulaSheet = async (topic) => {
  console.log('Gemini Request Started - Formula Sheet Generation');
  console.log(`Sending prompt for formulas about "${topic}"`);

  const text = await generateContent(
    `Generate a comprehensive formula sheet for "${topic}" covering all important formulas. Only include real, accurate formulas that are actually used in ${topic}. Return a JSON array of objects with "name", "formula", and "description" fields.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log('Gemini Response Received - Formula Sheet Generated');
  return result;
};

const generateBreakRecommendation = async (focusLevel, studyTime, quizScore, preferences) => {
  console.log('Gemini Request Started - Break Recommendation');
  console.log(`Sending prompt for focus: ${focusLevel}, study: ${studyTime}min, score: ${quizScore}%`);

  const result = await generateJSON(
    `Student focus level: ${focusLevel}, study time: ${studyTime}min, quiz score: ${quizScore}%, preferences: ${JSON.stringify(preferences)}. Generate a completely unique and personalized break activity recommendation. Return JSON with keys: recommendation, duration (in minutes), reason, benefits (array of strings).`,
    SYSTEM_WELLNESS
  );

  console.log('Gemini Response Received - Break Recommendation Generated');
  return result;
};

const generateAdaptiveQuestions = async (topic, weakTopics, difficulty) => {
  console.log('Gemini Request Started - Adaptive Question Generation');
  console.log(`Sending prompt for topic: "${topic}", weak areas: ${JSON.stringify(weakTopics)}`);

  const text = await generateContent(
    `Topic: "${topic}". Weak areas: ${JSON.stringify(weakTopics)}. Difficulty: ${difficulty}. Generate 5 completely unique adaptive questions targeting the weak areas to improve understanding. Each question must be specific and different. Return a JSON array of question objects.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log(`Gemini Response Received - ${Array.isArray(result) ? result.length : '?'} Adaptive Questions Generated`);
  return result;
};

const generateKeyTerms = async (topic) => {
  console.log('Gemini Request Started - Key Terms Generation');
  console.log(`Sending prompt for key terms about "${topic}"`);

  const text = await generateContent(
    `Generate key terms and definitions for "${topic}" that every STEM student should know. Only include real, accurate terms used in ${topic}. Return a JSON array of objects with "term" and "definition" fields.`,
    SYSTEM_TUTOR
  );
  const result = parseAIJson(text);

  console.log('Gemini Response Received - Key Terms Generated');
  return result;
};

const extractTextFromPDF = async (text) => {
  const truncated = text.substring(0, 15000);

  console.log('Gemini Request Started - PDF Text Processing');

  const result = await generateContent(
    `Organize the following extracted text into a well-structured study format with clear sections, bullet points, and summaries:\n\n${truncated}`,
    'You are a document processing assistant that organizes educational content.'
  );

  console.log('Gemini Response Received - PDF Text Processed');
  return result;
};

const generateCrosswordData = async (topic, difficulty = 'medium', count = 15) => {
  const difficultyConfig = {
    easy: { wordCount: '8-12', wordLength: '3-6 letters mostly', clueStyle: 'simple and straightforward' },
    medium: { wordCount: '12-18', wordLength: '4-8 letters mostly', clueStyle: 'moderate academic level' },
    hard: { wordCount: '15-25', wordLength: '5-10 letters mostly', clueStyle: 'challenging and precise' },
  };
  const config = difficultyConfig[difficulty] || difficultyConfig.medium;

  const prompt = `Generate a completely original crossword puzzle for Senior High School STEM students.

Topic: ${topic}
Difficulty: ${difficulty}
Number of words: ${count}

Requirements:
- Create ${config.wordCount} UNIQUE words related to "${topic}"
- Generate completely new words every time - never reuse previous puzzles
- All answers must be SINGLE WORDS (no spaces, no hyphens, no multi-word answers)
- Words should be ${config.wordLength}
- Clues should be ${config.clueStyle}
- Use educational STEM vocabulary specific to ${topic}
- Every word must be a real English word related to ${topic}
- Answers should be UPPERCASE letters only (A-Z)
- Mix shorter words (3-4 letters) with longer words (6-10 letters) for good grid density

Return ONLY valid JSON in this exact format:
{
  "title": "Topic Name",
  "across": [
    {
      "number": 1,
      "answer": "WORD",
      "clue": "Clue text here"
    }
  ],
  "down": [
    {
      "number": 2,
      "answer": "WORD",
      "clue": "Clue text here"
    }
  ]
}

IMPORTANT: All answers must be single uppercase words with only letters A-Z. No spaces, hyphens, or special characters.`;

  const systemInstruction = 'You are an expert STEM educator creating crossword puzzles for high school students. Generate completely original puzzles every time. Respond with valid JSON only, no markdown, no code blocks.';

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
    `Generate ${count} completely unique and original STEM quiz questions in the "${category}" category. Difficulty: ${difficultyConfig[difficulty] || difficultyConfig.medium}. Each question must be different and factually accurate. Create a new question set every request. Avoid duplicate questions.

Return a JSON array of objects with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0
  }
]

The "answer" field must be the index (0-3) of the correct option. All questions must have exactly 4 options.`,
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
