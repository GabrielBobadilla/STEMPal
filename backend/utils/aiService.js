const { generateContent, generateJSON } = require('../config/gemini');

const SYSTEM_TUTOR = 'You are an expert STEM tutor creating high-quality study materials for university-level students. Respond with valid JSON only.';
const SYSTEM_WELLNESS = 'You are a study wellness expert focused on student health and productivity.';

function generateMockReviewer(topic, type) {
  const keyConcepts = [
    { term: `${topic} Fundamentals`, definition: `Core principles and foundational concepts of ${topic} that form the basis for advanced study.` },
    { term: `Applications of ${topic}`, definition: `Real-world implementations and practical uses of ${topic} in various fields.` },
    { term: `${topic} Theory`, definition: `Theoretical framework explaining the underlying mechanisms and relationships in ${topic}.` },
    { term: `Advanced ${topic}`, definition: `Higher-level concepts and specialized topics within the broader subject of ${topic}.` },
    { term: `${topic} Methodology`, definition: `Systematic approaches and methods used to study, analyze, and apply ${topic}.` },
  ];

  const definitions = [
    { term: `Definition 1: ${topic}`, definition: `${topic} refers to the systematic study and application of principles governing natural and physical phenomena.` },
    { term: `Definition 2`, definition: `A fundamental concept that describes how different elements of ${topic} interact and relate to one another.` },
    { term: `Definition 3`, definition: `The quantitative and qualitative analysis methods used to measure and evaluate ${topic} related phenomena.` },
    { term: `Definition 4`, definition: `Key terminology and nomenclature used in the field of ${topic} for precise communication.` },
  ];

  const formulas = [
    { name: `Primary ${topic} Formula`, formula: `F = f(${topic.slice(0, 3).toLowerCase()})`, description: `The fundamental equation governing ${topic} relationships.` },
    { name: `${topic} Constant`, formula: `K = k₁ × k₂ / r²`, description: `The proportionality constant used in ${topic} calculations.` },
    { name: `${topic} Rate`, formula: `R = Δ${topic.slice(0, 1).toUpperCase()} / Δt`, description: `Rate of change or transformation in ${topic} systems.` },
    { name: `${topic} Efficiency`, formula: `η = (E_output / E_input) × 100%`, description: `Efficiency metric for ${topic} related processes.` },
  ];

  const practices = [
    { question: `What is the primary principle behind ${topic}?`, answer: `The main principle involves understanding how fundamental components interact to produce observable outcomes in ${topic}.`, difficulty: 'easy' },
    { question: `Explain how ${topic} applies to real-world scenarios.`, answer: `${topic} has numerous applications including technological innovation, scientific research, and practical problem-solving across various industries.`, difficulty: 'medium' },
    { question: `Derive the relationship between key variables in ${topic}.`, answer: `The relationship can be expressed through the fundamental equation where variable A is directly proportional to variable B and inversely proportional to variable C, modified by a constant factor specific to ${topic}.`, difficulty: 'hard' },
    { question: `Analyze the impact of ${topic} on modern science.`, answer: `${topic} has revolutionized modern science by providing new frameworks for understanding complex systems and enabling breakthrough discoveries in multiple disciplines.`, difficulty: 'medium' },
    { question: `Compare and contrast different approaches to ${topic}.`, answer: `There are several methodological approaches to ${topic}, each with unique strengths: the theoretical approach focuses on abstract models, while the experimental approach emphasizes empirical observation and data collection.`, difficulty: 'hard' },
  ];

  const base = {
    summary: `${topic} is a fundamental area of study in STEM that encompasses a wide range of principles, theories, and applications. This reviewer covers the essential concepts, definitions, and practice materials needed to master ${topic}. Understanding ${topic} is crucial for students pursuing careers in science, technology, engineering, and mathematics, as it provides the foundational knowledge required for advanced study and practical application in various fields.`,
    key_concepts: keyConcepts,
    important_definitions: definitions,
  };

  if (type === 'detailed') {
    return {
      ...base,
      formula_sheet: formulas,
      detailed_explanations: [
        { topic: `Introduction to ${topic}`, explanation: `${topic} begins with fundamental principles that govern behavior and interactions at the most basic level. Understanding these core concepts is essential before advancing to more complex topics.` },
        { topic: `${topic} in Practice`, explanation: `Practical applications of ${topic} demonstrate how theoretical knowledge translates into real-world solutions. Case studies and examples help solidify understanding.` },
        { topic: `Advanced ${topic} Concepts`, explanation: `Building upon foundational knowledge, advanced concepts in ${topic} explore more complex interactions, specialized applications, and cutting-edge research directions.` },
      ],
      practice_questions: practices,
    };
  }

  if (type === 'exam') {
    return {
      ...base,
      key_formulas: formulas.slice(0, 3),
      common_mistakes: [
        { mistake: `Confusing correlation with causation in ${topic}`, correction: `Remember that two variables moving together doesn't mean one causes the other. Look for controlled experiments to establish causation in ${topic}.` },
        { mistake: `Applying the wrong ${topic} formula`, correction: `Always identify the given variables and what you're solving for before selecting a formula. Draw a diagram if possible.` },
        { mistake: `Forgetting units in ${topic} calculations`, correction: `Always include units throughout your calculation, not just in the final answer. This helps catch conversion errors early.` },
        { mistake: `Overlooking boundary conditions in ${topic}`, correction: `${topic} problems often have specific conditions or constraints. Always check the valid range of your solution.` },
      ],
      practice_questions: practices.map(p => ({
        ...p,
        options: ['Option A: First possible answer', 'Option B: Second possible answer', 'Option C: Third possible answer', 'Option D: Fourth possible answer'],
        explanation: `This question tests understanding of ${topic}. The correct answer demonstrates comprehension of core principles.`,
      })),
    };
  }

  return base;
}

const generateReviewer = async (topic, type = 'basic') => {
  const prompts = {
    basic: `Create a basic STEM study reviewer about "${topic}". Include these sections as JSON keys: summary, key_concepts (array of {term, definition}), important_definitions (array of {term, definition}).`,
    detailed: `Create a detailed STEM study reviewer about "${topic}". Include these sections: summary, key_concepts, important_definitions, formula_sheet (array of {name, formula, description}), detailed_explanations (array of {topic, explanation}), practice_questions (array of {question, answer, difficulty}). Output as JSON.`,
    exam: `Create an exam-focused STEM reviewer about "${topic}". Include these sections: summary, key_formulas (array of {name, formula}), common_mistakes (array of {mistake, correction}), practice_questions (array of {question, options, answer, explanation, difficulty}). Output as JSON.`
  };

  try {
    return await generateJSON(prompts[type] || prompts.basic, SYSTEM_TUTOR);
  } catch {
    try {
      const text = await generateContent(prompts[type] || prompts.basic, SYSTEM_TUTOR);
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockReviewer(topic, type);
    }
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
  try {
    return await generateContent(
      `Organize the following extracted text into a well-structured study format with clear sections, bullet points, and summaries:\n\n${truncated}`,
      'You are a document processing assistant that organizes educational content.'
    );
  } catch {
    const lines = truncated.split('\n').filter(Boolean);
    const summary = lines.slice(0, Math.min(5, lines.length)).join(' ');
    return `# Extracted Content Summary\n\n${summary}\n\n## Key Points\n${lines.slice(0, 10).map((l, i) => `- ${l}`).join('\n')}\n\n## Full Content\n${truncated}`;
  }
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
