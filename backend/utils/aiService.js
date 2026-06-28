const { generateContent, generateJSON } = require('../config/gemini');

const SYSTEM_TUTOR = 'You are an expert STEM tutor creating high-quality study materials for university-level students. Respond with valid JSON only.';
const SYSTEM_WELLNESS = 'You are a study wellness expert focused on student health and productivity.';

const generateReviewer = async (topic, type = 'basic') => {
  const prompts = {
    basic: `Create a basic STEM study reviewer about "${topic}". Include these sections as JSON keys: summary, key_concepts (array of {term, definition}), important_definitions (array of {term, definition}).`,
    detailed: `Create a detailed STEM study reviewer about "${topic}". Include these sections: summary, key_concepts, important_definitions, formula_sheet (array of {name, formula, description}), detailed_explanations (array of {topic, explanation}), practice_questions (array of {question, answer, difficulty}). Output as JSON.`,
    exam: `Create an exam-focused STEM reviewer about "${topic}". Include these sections: summary, key_formulas (array of {name, formula}), common_mistakes (array of {mistake, correction}), practice_questions (array of {question, options, answer, explanation, difficulty}). Output as JSON.`
  };

  try {
    return await generateJSON(prompts[type] || prompts.basic, SYSTEM_TUTOR);
  } catch {
    const text = await generateContent(prompts[type] || prompts.basic, SYSTEM_TUTOR);
    return { content: text };
  }
};

const generateFlashcards = async (topic, count = 10) => {
  try {
    return await generateJSON(
      `Create ${count} flashcards about "${topic}" for STEM students. Include a mix of definitions, formulas, and concepts. Respond with a JSON array of objects each with "question" and "answer" fields.`,
      SYSTEM_TUTOR
    );
  } catch {
    const text = await generateContent(
      `Create ${count} flashcards about "${topic}" for STEM students. Respond with a JSON array of objects with "question" and "answer".`,
      SYSTEM_TUTOR
    );
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return { flashcards: text }; }
  }
};

const generateQuiz = async (topic, type = 'multiple_choice', count = 10) => {
  const typeInstructions = {
    multiple_choice: 'multiple choice questions with 4 options each, include the correct answer index (0-3)',
    identification: 'identification questions where the student provides a short answer',
    true_false: 'true or false questions with boolean answer',
    short_answer: 'short answer questions requiring brief explanations'
  };

  try {
    return await generateJSON(
      `Create ${count} ${typeInstructions[type] || typeInstructions.multiple_choice} about "${topic}" for STEM students. Include difficulty level (easy/medium/hard) for each question. Respond with a JSON array of question objects.`,
      SYSTEM_TUTOR
    );
  } catch {
    const text = await generateContent(
      `Create ${count} ${typeInstructions[type] || typeInstructions.multiple_choice} about "${topic}". Respond with JSON array.`,
      SYSTEM_TUTOR
    );
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return { questions: text }; }
  }
};

const generateFormulaSheet = async (topic) => {
  try {
    return await generateJSON(
      `Create a comprehensive formula sheet for "${topic}" covering all important formulas. Respond with a JSON array of objects each with "name", "formula", and "description" fields.`,
      SYSTEM_TUTOR
    );
  } catch {
    const text = await generateContent(
      `Create formula sheet for "${topic}" as JSON array of {name, formula, description}.`,
      SYSTEM_TUTOR
    );
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return { formulas: text }; }
  }
};

const generateBreakRecommendation = async (focusLevel, studyTime, quizScore, preferences) => {
  try {
    return await generateJSON(
      `Student focus level: ${focusLevel}, study time: ${studyTime}min, quiz score: ${quizScore}%, preferences: ${JSON.stringify(preferences)}. Recommend a break activity. Respond with JSON: { recommendation, duration (in minutes), reason, benefits (array of strings) }`,
      SYSTEM_WELLNESS
    );
  } catch {
    return {
      recommendation: 'Take a short walk',
      duration: 5,
      reason: 'To refresh your mind and improve focus',
      benefits: ['Improved focus', 'Reduced fatigue', 'Better mood']
    };
  }
};

const generateAdaptiveQuestions = async (topic, weakTopics, difficulty) => {
  try {
    return await generateJSON(
      `Topic: "${topic}". Weak areas: ${JSON.stringify(weakTopics)}. Difficulty: ${difficulty}. Create 5 adaptive questions targeting weak areas to improve understanding. Respond with a JSON array of question objects.`,
      SYSTEM_TUTOR
    );
  } catch {
    const text = await generateContent(
      `Create 5 adaptive questions about "${topic}" focusing on: ${JSON.stringify(weakTopics)}. Difficulty: ${difficulty}. Output JSON array.`,
      SYSTEM_TUTOR
    );
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return { questions: text }; }
  }
};

const generateKeyTerms = async (topic) => {
  try {
    return await generateJSON(
      `Generate key terms and definitions for "${topic}" that every STEM student should know. Respond with a JSON array of objects each with "term" and "definition" fields.`,
      SYSTEM_TUTOR
    );
  } catch {
    const text = await generateContent(
      `Generate key terms for "${topic}" as JSON array of {term, definition}.`,
      SYSTEM_TUTOR
    );
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return { terms: text }; }
  }
};

const extractTextFromPDF = async (text) => {
  const truncated = text.substring(0, 15000);
  return await generateContent(
    `Organize the following extracted text into a well-structured study format with clear sections, bullet points, and summaries:\n\n${truncated}`,
    'You are a document processing assistant that organizes educational content.'
  );
};

module.exports = {
  generateReviewer,
  generateFlashcards,
  generateQuiz,
  generateFormulaSheet,
  generateBreakRecommendation,
  generateAdaptiveQuestions,
  generateKeyTerms,
  extractTextFromPDF
};
