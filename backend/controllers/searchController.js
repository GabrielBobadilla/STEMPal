const db = require('../config/db');

const search = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query is required.' });

    let results = [];
    const queryLower = q.toLowerCase();

    if (!type || type === 'human' || type === 'both') {
      const snap = await db.collection('notes').where('user_id', '==', req.user.id).get();
      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.title && data.title.toLowerCase().includes(queryLower)) ||
            (data.content && data.content.toLowerCase().includes(queryLower))) {
          results.push({
            id: d.id, title: data.title, preview: (data.content || '').substring(0, 200),
            category: data.category, source: data.source, difficulty: data.difficulty,
            created_at: data.created_at, result_type: 'note'
          });
        }
      });
    }

    if (!type || type === 'ai' || type === 'both') {
      const snap = await db.collection('generated_reviewers').where('user_id', '==', req.user.id).get();
      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.title && data.title.toLowerCase().includes(queryLower)) ||
            (data.topic && data.topic.toLowerCase().includes(queryLower))) {
          results.push({
            id: d.id, title: data.title, topic: data.topic, reviewer_type: data.reviewer_type,
            created_at: data.created_at, result_type: 'reviewer'
          });
        }
      });
    }

    if (!type || type === 'both') {
      const snap = await db.collection('flashcards').where('user_id', '==', req.user.id).get();
      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.question && data.question.toLowerCase().includes(queryLower)) ||
            (data.answer && data.answer.toLowerCase().includes(queryLower))) {
          results.push({
            id: d.id, title: data.question, preview: data.answer, topic: data.topic,
            difficulty: data.difficulty, created_at: data.created_at, result_type: 'flashcard'
          });
        }
      });
    }

    results.sort((a, b) => {
      const dateA = a.created_at?.toDate?.() || new Date(a.created_at || 0);
      const dateB = b.created_at?.toDate?.() || new Date(b.created_at || 0);
      return dateB - dateA;
    });

    const offset = (page - 1) * limit;
    results = results.slice(offset, offset + parseInt(limit));

    res.json({ results, total: results.length, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { search };
