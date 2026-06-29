const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    profile_picture TEXT DEFAULT 'default.png',
    grade_level TEXT,
    school TEXT,
    stem_strand TEXT,
    theme_preference TEXT DEFAULT 'light',
    notification_enabled INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    subjects TEXT, hobbies TEXT, learning_style TEXT DEFAULT 'mixed',
    study_duration TEXT DEFAULT '1hour', preferred_break TEXT, study_goals TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    title TEXT NOT NULL, content TEXT, category TEXT, source TEXT DEFAULT 'ai',
    difficulty TEXT DEFAULT 'medium', tags TEXT, is_saved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS pdf_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    filename TEXT NOT NULL, original_name TEXT NOT NULL, file_size INTEGER,
    file_path TEXT NOT NULL, extracted_text TEXT, ocr_used INTEGER DEFAULT 0,
    upload_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS generated_reviewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, pdf_id INTEGER,
    title TEXT NOT NULL, topic TEXT, reviewer_type TEXT DEFAULT 'basic', content TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pdf_id) REFERENCES pdf_uploads(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, topic TEXT,
    quiz_type TEXT DEFAULT 'multiple_choice', questions TEXT, answers TEXT,
    score REAL, accuracy REAL, total_questions INTEGER, correct_answers INTEGER,
    time_taken INTEGER, difficulty TEXT DEFAULT 'medium', weak_topics TEXT, strong_topics TEXT,
    date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    question TEXT NOT NULL, answer TEXT NOT NULL, topic TEXT,
    difficulty TEXT DEFAULT 'medium', is_favorite INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0, last_reviewed TEXT, next_review TEXT,
    review_count INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS study_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    activity TEXT NOT NULL, activity_type TEXT NOT NULL, duration INTEGER DEFAULT 0, details TEXT,
    date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS break_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    recommendation TEXT NOT NULL, reason TEXT, benefits TEXT, duration INTEGER NOT NULL,
    study_time INTEGER, focus_level TEXT, is_taken INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0, longest_streak INTEGER DEFAULT 0,
    last_active_date TEXT, weekly_progress TEXT, monthly_calendar TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    badge_name TEXT NOT NULL, badge_type TEXT DEFAULT 'bronze', description TEXT,
    unlocked_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    title TEXT NOT NULL, message TEXT, type TEXT DEFAULT 'study_reminder',
    is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT, level_name TEXT NOT NULL,
    min_xp INTEGER NOT NULL, max_xp INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS xp_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL, reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0, weekly_xp INTEGER DEFAULT 0, monthly_xp INTEGER DEFAULT 0,
    week_start TEXT, month_start TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS focus_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    score REAL, session_type TEXT, date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    study_duration INTEGER NOT NULL, break_duration INTEGER NOT NULL,
    sessions_completed INTEGER DEFAULT 0, mode TEXT DEFAULT 'traditional',
    date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_study_history_user ON study_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_study_history_date ON study_history(date);
CREATE INDEX IF NOT EXISTS idx_quizzes_date ON quizzes(date);
`;

function translateSQL(sql) {
  let s = sql;
  s = s.replace(/`/g, '');
  s = s.replace(/\bCURDATE\(\)/gi, "date('now')");
  s = s.replace(/\bNOW\(\)/gi, "datetime('now')");
  s = s.replace(/DATE_SUB\(CURDATE\(\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "date('now', '-$1 days')");
  s = s.replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "datetime('now', '-$1 days')");
  s = s.replace(/DATE_SUB\(CURDATE\(\),\s*INTERVAL\s*(\d+)\s*WEEK\)/gi, "date('now', '-$1 weeks')");
  s = s.replace(/\bINSERT\s+IGNORE\b/gi, 'INSERT OR IGNORE');
  return s;
}

class MockPool {
  constructor(db) { this.db = db; }

  async query(sql, params) {
    const translated = translateSQL(sql);
    const normalized = translated.trim().toUpperCase();
    if (normalized.startsWith('SELECT') || normalized.startsWith('WITH')) return this._select(translated, params);
    if (normalized.startsWith('INSERT')) return this._insert(translated, params);
    if (normalized.startsWith('UPDATE')) return this._update(translated, params);
    if (normalized.startsWith('DELETE')) return this._delete(translated, params);
    return [[], []];
  }

  _select(sql, params) {
    try {
      const stmt = this.db.prepare(sql);
      if (params) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return [rows, []];
    } catch (e) {
      console.error('MockDB SELECT error:', e.message);
      return [[], []];
    }
  }

  _insert(sql, params) {
    try {
      if (params) { const stmt = this.db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free(); }
      else this.db.exec(sql);
      const r = this.db.exec("SELECT last_insert_rowid() as id, changes() as affected");
      return [{ insertId: r[0]?.values[0]?.[0] || 1, affectedRows: r[0]?.values[0]?.[1] || 1 }, []];
    } catch (e) {
      console.error('MockDB INSERT error:', e.message);
      return [{ insertId: 1, affectedRows: 1 }, []];
    }
  }

  _update(sql, params) {
    try {
      if (params) { const stmt = this.db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free(); }
      else this.db.exec(sql);
      const r = this.db.exec("SELECT changes() as affected");
      return [{ affectedRows: r[0]?.values[0]?.[0] || 1 }, []];
    } catch (e) {
      console.error('MockDB UPDATE error:', e.message);
      return [{ affectedRows: 1 }, []];
    }
  }

  _delete(sql, params) {
    try {
      if (params) { const stmt = this.db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free(); }
      else this.db.exec(sql);
      const r = this.db.exec("SELECT changes() as affected");
      return [{ affectedRows: r[0]?.values[0]?.[0] || 1 }, []];
    } catch (e) {
      console.error('MockDB DELETE error:', e.message);
      return [{ affectedRows: 1 }, []];
    }
  }
}

async function createMockDb() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = OFF');
  db.run('PRAGMA journal_mode = MEMORY');

  const statements = SCHEMA.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try { db.run(stmt + ';'); } catch (e) { console.error('Schema error:', e.message); }
  }

  const hashedAdmin = await bcrypt.hash('stempaladmin', 10);
  const hashedUser = await bcrypt.hash('stempaluser', 10);
  db.run('INSERT INTO users (fullname, email, password, role) VALUES (?,?,?,?)', ['STEMPal Admin', 'admin@stempal.com', hashedAdmin, 'admin']);
  db.run('INSERT INTO users (fullname, email, password, role) VALUES (?,?,?,?)', ['Juan Dela Cruz', 'juan@gmail.com', hashedUser, 'student']);
  db.run('INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES (1,0,0)');
  db.run('INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES (2,0,0)');
  db.run("INSERT INTO levels (level_name, min_xp, max_xp) VALUES ('Beginner',0,99),('Learner',100,299),('Achiever',300,599),('Scholar',600,999),('STEM Expert',1000,1999),('STEM Master',2000,999999)");

  db.run('PRAGMA foreign_keys = ON');
  console.log('Mock DB initialized — credentials: admin@stempal.com / stempaladmin | juan@gmail.com / stempaluser');
  return new MockPool(db);
}

module.exports = { createMockDb };
