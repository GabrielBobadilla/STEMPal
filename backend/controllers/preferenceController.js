const supabase = require('../config/supabase');

const savePreferences = async (req, res) => {
  try {
    const { subjects, hobbies, learning_style, study_duration, preferred_break, study_goals, grade_level, school, stem_strand } = req.body;
    const userId = req.user.id;

    const { data: existing, error: findError } = await supabase
      .from('preferences')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Find preferences error:', findError);
    }

    const prefData = {
      subjects: subjects || [],
      hobbies: hobbies || [],
      learning_style: learning_style || null,
      study_duration: study_duration || null,
      preferred_break: preferred_break || [],
      study_goals: study_goals || null,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { error } = await supabase.from('preferences').update(prefData).eq('id', existing.id);
      if (error) {
        console.error('Update preferences error:', error);
        return res.status(500).json({ message: 'Failed to update preferences.', detail: error.message });
      }
    } else {
      const { error } = await supabase.from('preferences').insert({
        user_id: userId,
        ...prefData,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.error('Insert preferences error:', error);
        return res.status(500).json({ message: 'Failed to save preferences.', detail: error.message });
      }
    }

    if (grade_level || school || stem_strand) {
      const updates = { updated_at: new Date().toISOString() };
      if (grade_level) updates.grade_level = grade_level;
      if (school) updates.school = school;
      if (stem_strand) updates.stem_strand = stem_strand;
      const { error } = await supabase.from('users').update(updates).eq('id', userId);
      if (error) {
        console.error('Update user prefs error:', error);
      }
    }

    res.json({ message: 'Preferences saved successfully.' });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getPreferences = async (req, res) => {
  try {
    const { data: pref, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Get preferences error:', error);
      return res.status(500).json({ message: 'Server error.' });
    }

    if (!pref) return res.status(404).json({ message: 'No preferences found.' });
    res.json(pref);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkPreferences = async (req, res) => {
  try {
    const { data: pref, error } = await supabase
      .from('preferences')
      .select('id')
      .eq('user_id', req.user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Check preferences error:', error);
    }

    res.json({ hasPreferences: !!pref });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { savePreferences, getPreferences, checkPreferences };
