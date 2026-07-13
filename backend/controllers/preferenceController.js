const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const savePreferences = async (req, res) => {
  try {
    const { subjects, hobbies, learning_style, study_duration, preferred_break, study_goals, grade_level, school, stem_strand } = req.body;
    const userId = req.user.id;

    // Check if preferences exist
    const existing = await db.collection('preferences').where('user_id', '==', userId).limit(1).get();

    const prefData = {
      subjects: subjects || [],
      hobbies: hobbies || [],
      learning_style,
      study_duration,
      preferred_break: preferred_break || [],
      study_goals,
      updated_at: FieldValue.serverTimestamp()
    };

    if (!existing.empty) {
      await existing.docs[0].ref.update(prefData);
    } else {
      await db.collection('preferences').add({
        user_id: userId,
        ...prefData,
        created_at: FieldValue.serverTimestamp()
      });
    }

    if (grade_level || school || stem_strand) {
      const updates = { updated_at: FieldValue.serverTimestamp() };
      if (grade_level) updates.grade_level = grade_level;
      if (school) updates.school = school;
      if (stem_strand) updates.stem_strand = stem_strand;
      await db.collection('users').doc(userId).update(updates);
    }

    res.json({ message: 'Preferences saved successfully.' });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPreferences = async (req, res) => {
  try {
    const snap = await db.collection('preferences').where('user_id', '==', req.user.id).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'No preferences found.' });

    const pref = snap.docs[0].data();
    pref.id = snap.docs[0].id;
    // Subjects/hobbies/preferred_break are stored as arrays natively in Firestore
    res.json(pref);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkPreferences = async (req, res) => {
  try {
    const snap = await db.collection('preferences').where('user_id', '==', req.user.id).limit(1).get();
    res.json({ hasPreferences: !snap.empty });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { savePreferences, getPreferences, checkPreferences };
