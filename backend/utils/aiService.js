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
    try {
      const text = await generateContent(
        `Create ${count} flashcards about "${topic}" for STEM students. Respond with a JSON array of objects with "question" and "answer".`,
        SYSTEM_TUTOR
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockFlashcards(topic, count);
    }
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
    try {
      const text = await generateContent(
        `Create ${count} ${typeInstructions[type] || typeInstructions.multiple_choice} about "${topic}". Respond with JSON array.`,
        SYSTEM_TUTOR
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return generateMockQuiz(topic, type, count);
    }
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

function generateMockFlashcards(topic, count = 10) {
  const topicShort = topic.slice(0, 20);
  const cards = [
    { question: `What is the fundamental principle of ${topicShort}?`, answer: `The fundamental principle involves understanding how core components interact to produce the observed phenomena in ${topicShort}.` },
    { question: `Define the key terminology used in ${topicShort}.`, answer: `${topicShort} uses specific terminology to describe its concepts, including terms that define relationships, quantities, and processes within the subject.` },
    { question: `What are the main applications of ${topicShort}?`, answer: `${topicShort} has applications in research, industry, education, and technology development, providing solutions to complex problems.` },
    { question: `Explain the primary formula used in ${topicShort}.`, answer: `The primary formula relates the key variables: F = f(${topicShort.slice(0, 3).toLowerCase()}), where each variable represents a measurable quantity.` },
    { question: `How does ${topicShort} relate to other STEM fields?`, answer: `${topicShort} intersects with mathematics, physics, engineering, and other sciences, creating a multidisciplinary approach to problem-solving.` },
    { question: `What are common misconceptions about ${topicShort}?`, answer: `A common misconception is that ${topicShort} only applies to theoretical contexts, when in fact it has many practical real-world applications.` },
    { question: `Describe the historical development of ${topicShort}.`, answer: `${topicShort} evolved through contributions from many scientists, with key discoveries building upon earlier work to form our current understanding.` },
    { question: `What problem-solving strategies work best for ${topicShort}?`, answer: `Breaking down complex problems into smaller parts, identifying known and unknown variables, and applying relevant formulas are effective strategies.` },
    { question: `How is ${topicShort} tested in academic settings?`, answer: `Assessment typically includes conceptual questions, quantitative problem-solving, lab practicals, and application-based scenarios.` },
    { question: `What advanced topics build on ${topicShort}?`, answer: `Advanced study extends into specialized subfields, research methodologies, and cutting-edge applications that push the boundaries of current knowledge.` },
  ];
  return cards.slice(0, count);
}

function generateMockQuiz(topic, type = 'multiple_choice', count = 10) {
  const topicShort = topic.slice(0, 25);
  const mc = [
    { question: `What is the core principle behind ${topicShort}?`, options: ['Law of thermodynamics', `Fundamental theorem of ${topicShort.slice(0, 10)}`, 'Principle of superposition', 'Theory of relativity'], correct_answer: 1, type: 'multiple_choice', difficulty: 'easy' },
    { question: `Which of the following best describes ${topicShort}?`, options: ['A mathematical model', `A scientific theory about ${topicShort.slice(0, 10)}`, 'An experimental observation', 'A computational algorithm'], correct_answer: 1, type: 'multiple_choice', difficulty: 'easy' },
    { question: `What is the primary application of ${topicShort} in modern technology?`, options: ['Data processing', `${topicShort.slice(0, 10)}-based systems`, 'Signal analysis', 'Quantum computing'], correct_answer: 1, type: 'multiple_choice', difficulty: 'medium' },
    { question: `How does ${topicShort} relate to other STEM disciplines?`, options: ['It is completely isolated', 'It provides foundational principles', 'It only applies to mathematics', 'It has no real-world relevance'], correct_answer: 1, type: 'multiple_choice', difficulty: 'medium' },
    { question: `What experimental method is commonly used to study ${topicShort}?`, options: ['Random sampling', `Controlled ${topicShort.slice(0, 10)} experiments`, 'Double-blind testing', 'Computational modeling'], correct_answer: 1, type: 'multiple_choice', difficulty: 'hard' },
    { question: `What advanced theory builds upon the concepts of ${topicShort}?`, options: ['String theory', `Advanced ${topicShort.slice(0, 10)} dynamics`, 'Quantum field theory', 'General relativity'], correct_answer: 1, type: 'multiple_choice', difficulty: 'hard' },
  ];
  const tf = [
    { question: `${topicShort} is a fundamental concept in STEM education.`, correct_answer: 'True', type: 'true_false', difficulty: 'easy' },
    { question: `The principles of ${topicShort} have no practical applications.`, correct_answer: 'False', type: 'true_false', difficulty: 'easy' },
    { question: `${topicShort} can be used to solve complex real-world problems.`, correct_answer: 'True', type: 'true_false', difficulty: 'medium' },
    { question: `Understanding ${topicShort} requires knowledge of advanced mathematics only.`, correct_answer: 'False', type: 'true_false', difficulty: 'medium' },
    { question: `${topicShort} is constantly evolving with new research and discoveries.`, correct_answer: 'True', type: 'true_false', difficulty: 'hard' },
  ];
  const ident = [
    { question: `Define the term "${topicShort}" in your own words.`, correct_answer: `${topicShort} refers to the systematic study of principles governing natural phenomena.`, type: 'identification', difficulty: 'easy' },
    { question: `What is the main formula associated with ${topicShort}?`, correct_answer: `The main formula is F = f(${topicShort.slice(0, 3).toLowerCase()}) where variables represent key measurable quantities.`, type: 'identification', difficulty: 'medium' },
    { question: `Explain one real-world application of ${topicShort}.`, correct_answer: `${topicShort} is applied in various fields including engineering, medicine, and technology development.`, type: 'identification', difficulty: 'medium' },
    { question: `Describe a key experiment that demonstrates principles of ${topicShort}.`, correct_answer: `Controlled experiments measuring the relationship between key variables demonstrate the core principles of ${topicShort}.`, type: 'identification', difficulty: 'hard' },
  ];

  if (type === 'true_false') return tf.slice(0, count);
  if (type === 'identification') return ident.slice(0, count);
  if (type === 'short_answer') return ident.slice(0, count);
  return mc.slice(0, count);
}

const generateCrosswordData = async (topic, difficulty = 'medium', count = 15) => {
  const difficultyConfig = {
    easy: { wordCount: '8-12', wordLength: '3-6 letters mostly', clueStyle: 'simple and straightforward' },
    medium: { wordCount: '12-18', wordLength: '4-8 letters mostly', clueStyle: 'moderate academic level' },
    hard: { wordCount: '15-25', wordLength: '5-10 letters mostly', clueStyle: 'challenging and precise' },
  };
  const config = difficultyConfig[difficulty] || difficultyConfig.medium;

  const prompt = `Generate a crossword puzzle for Senior High School STEM students.

Topic: ${topic}
Difficulty: ${difficulty}
Number of words: ${count}

Requirements:
- Create ${config.wordCount} words related to "${topic}"
- All answers must be SINGLE WORDS (no spaces, no hyphens, no multi-word answers)
- Words should be ${config.wordLength}
- Clues should be ${config.clueStyle}
- Use educational STEM vocabulary
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

  const systemInstruction = 'You are an expert STEM educator creating crossword puzzles for high school students. You respond with valid JSON only, no markdown, no code blocks.';

  try {
    const result = await generateJSON(prompt, systemInstruction);
    if (result && ((result.across && result.across.length > 0) || (result.down && result.down.length > 0))) {
      const allWords = [...(result.across || []), ...(result.down || [])];
      const cleaned = allWords.map(w => ({
        ...w,
        answer: (w.answer || '').toUpperCase().replace(/[^A-Z]/g, ''),
        clue: w.clue || 'STEM concept',
      })).filter(w => w.answer.length >= 2);
      return { title: result.title || topic, across: cleaned.filter(w => w.number), down: [] };
    }
  } catch (err) {
    console.error('Gemini crossword generation failed:', err.message);
  }

  return generateMockCrossword(topic, difficulty, count);
};

function generateMockCrossword(topic, difficulty = 'medium', count = 15) {
  const topicWords = {
    'Biology': {
      across: [
        { number: 1, answer: 'MITOSIS', clue: 'Cell division producing two identical cells' },
        { number: 4, answer: 'NUCLEUS', clue: 'Control center of a cell' },
        { number: 7, answer: 'RIBOSOME', clue: 'Site of protein synthesis' },
        { number: 10, answer: 'ENZYME', clue: 'Biological catalyst that speeds up reactions' },
        { number: 12, answer: 'CHROMOSOME', clue: 'DNA-containing structure in cells' },
      ],
      down: [
        { number: 2, answer: 'DNA', clue: 'Molecule carrying genetic instructions' },
        { number: 3, answer: 'RNA', clue: 'Messenger molecule in protein synthesis' },
        { number: 5, answer: 'CYTOPLASM', clue: 'Jelly-like substance inside a cell' },
        { number: 8, answer: 'GENE', clue: 'Unit of heredity' },
        { number: 11, answer: 'MEMBRANE', clue: 'Phospholipid bilayer surrounding cells' },
      ],
    },
    'Physics': {
      across: [
        { number: 1, answer: 'VELOCITY', clue: 'Speed in a given direction' },
        { number: 4, answer: 'FORCE', clue: 'Push or pull on an object' },
        { number: 7, answer: 'ENERGY', clue: 'Capacity to do work' },
        { number: 10, answer: 'GRAVITY', clue: 'Force attracting objects with mass' },
      ],
      down: [
        { number: 2, answer: 'MASS', clue: 'Amount of matter in an object' },
        { number: 3, answer: 'WAVE', clue: 'Oscillation that transfers energy' },
        { number: 5, answer: 'TORQUE', clue: 'Rotational equivalent of force' },
        { number: 8, answer: 'POWER', clue: 'Rate of doing work' },
        { number: 11, answer: 'PHOTON', clue: 'Particle of light' },
      ],
    },
    'Chemistry': {
      across: [
        { number: 1, answer: 'PROTON', clue: 'Positively charged subatomic particle' },
        { number: 4, answer: 'MOLECULE', clue: 'Group of bonded atoms' },
        { number: 7, answer: 'ELEMENT', clue: 'Pure substance of one atom type' },
        { number: 10, answer: 'BOND', clue: 'Chemical force holding atoms together' },
      ],
      down: [
        { number: 2, answer: 'ACID', clue: 'Substance with pH below 7' },
        { number: 3, answer: 'ATOM', clue: 'Smallest unit of an element' },
        { number: 5, answer: 'ISOTOPE', clue: 'Atoms with same protons different neutrons' },
        { number: 8, answer: 'SOLVENT', clue: 'Substance that dissolves a solute' },
      ],
    },
  };

  const allTopics = Object.keys(topicWords);
  const matchedTopic = allTopics.find(t => topic.toLowerCase().includes(t.toLowerCase())) || allTopics[0];
  const data = topicWords[matchedTopic] || topicWords['Biology'];

  return {
    title: topic || matchedTopic,
    across: data.across,
    down: data.down,
  };
}

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
  generateAdaptiveCrossword
};
