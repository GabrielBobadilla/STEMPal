class MemDB {
  constructor() {
    this.tables = {};
  }

  createTable(name, schema) {
    this.tables[name] = { schema, rows: [], nextId: 1 };
  }

  insert(table, data) {
    const t = this.tables[table];
    if (!t) return { insertId: 0, affectedRows: 0 };
    const row = { id: t.nextId++ };
    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      row[keys[i]] = data[keys[i]];
    }
    row.created_at = new Date().toISOString().replace('T', ' ').split('.')[0];
    row.updated_at = row.created_at;
    t.rows.push(row);
    return { insertId: row.id, affectedRows: 1 };
  }

  select(table, fields, whereFn, opts = {}) {
    const t = this.tables[table];
    if (!t) return [];
    let rows = t.rows;
    if (whereFn) rows = rows.filter(whereFn);
    if (opts.orderBy) {
      rows = [...rows].sort((a, b) => {
        for (const { field, dir } of opts.orderBy) {
          if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
          if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
        }
        return 0;
      });
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    if (!fields || fields[0] === '*') return rows.map(r => ({ ...r }));
    return rows.map(r => {
      const obj = {};
      for (const f of fields) obj[f] = r[f];
      return obj;
    });
  }

  update(table, updates, whereFn) {
    const t = this.tables[table];
    if (!t) return { affectedRows: 0 };
    let count = 0;
    for (const row of t.rows) {
      if (whereFn(row)) {
        Object.assign(row, updates);
        row.updated_at = new Date().toISOString().replace('T', ' ').split('.')[0];
        count++;
      }
    }
    return { affectedRows: count };
  }

  delete(table, whereFn) {
    const t = this.tables[table];
    if (!t) return { affectedRows: 0 };
    const before = t.rows.length;
    t.rows = t.rows.filter(r => !whereFn(r));
    return { affectedRows: before - t.rows.length };
  }
}

function parseWhere(sql, params) {
  const match = sql.match(/WHERE\s+(.+?)(?:\s*ORDER\s+BY|\s*LIMIT|\s*$)/i);
  if (!match) return () => true;
  const condition = match[1].trim();
  let pIdx = 0;

  return (row) => {
    const expr = condition.replace(/\?/g, () => {
      const val = params ? params[pIdx++] : undefined;
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      return val;
    });
    try {
      const ctx = { ...row };
      for (const k of Object.keys(ctx)) {
        if (typeof ctx[k] === 'string') ctx[k] = `'${ctx[k]}'`;
      }
      const fn = new Function(...Object.keys(ctx), `return ${expr.replace(/=/g, '===').replace(/<>/g, '!==')}`);
      return fn(...Object.values(ctx));
    } catch { return true; }
  };
}

function extractFields(sql) {
  const m = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (!m) return ['*'];
  return m[1].split(',').map(s => s.trim().split(' AS ')[0].trim().replace(/`/g, ''));
}

function extractTable(sql) {
  const m = sql.match(/FROM\s+(\w+)/i);
  return m ? m[1].toLowerCase() : '';
}

function extractOrderBy(sql) {
  const m = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|\s*$)/i);
  if (!m) return [];
  return m[1].split(',').map(s => {
    const parts = s.trim().split(/\s+/);
    return { field: parts[0], dir: (parts[1] || '').toLowerCase() === 'desc' ? 'desc' : 'asc' };
  });
}

function extractLimit(sql) {
  const m = sql.match(/LIMIT\s+(\d+)/i);
  return m ? parseInt(m[1]) : undefined;
}

function extractInsert(sql) {
  const m = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES?\s*\(([^)]+)\)/i);
  return m ? { table: m[1].toLowerCase(), fields: m[2].split(',').map(s => s.trim()), values: m[3].split(',').map(s => s.trim()) } : null;
}

function extractUpdate(sql) {
  const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE|\s*$)/i);
  return m ? { table: m[1].toLowerCase(), sets: m[2] } : null;
}

function extractDelete(sql) {
  const m = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  return m ? m[1].toLowerCase() : '';
}

const db = new MemDB();

db.createTable('users', {});
db.createTable('preferences', {});
db.createTable('notes', {});
db.createTable('pdf_uploads', {});
db.createTable('generated_reviewers', {});
db.createTable('quizzes', {});
db.createTable('flashcards', {});
db.createTable('study_history', {});
db.createTable('break_recommendations', {});
db.createTable('streaks', {});
db.createTable('achievements', {});
db.createTable('notifications', {});
db.createTable('levels', {});
db.createTable('xp_log', {});
db.createTable('leaderboard', {});
db.createTable('focus_scores', {});
db.createTable('pomodoro_sessions', {});

db.insert('users', { fullname: 'STEMPal Admin', email: 'admin@stempal.com', password: '$2a$10$eSI3tD37goN17fRe9ZoES.BlOys8uHUUVJa6HVHUax.PWFCr2jh92', role: 'admin', profile_picture: 'default.png', notification_enabled: 1, total_xp: 0, level: 1, theme_preference: 'light' });
db.insert('users', { fullname: 'Juan Dela Cruz', email: 'juan@gmail.com', password: '$2a$10$wr033wFhp9Tl46/RJq/wH.tYc0KAWSkxP/.pqseRAr.ThTH5JewNO', role: 'student', profile_picture: 'default.png', notification_enabled: 1, total_xp: 0, level: 1, theme_preference: 'light' });
db.insert('streaks', { user_id: 1, current_streak: 0, longest_streak: 0 });
db.insert('streaks', { user_id: 2, current_streak: 0, longest_streak: 0 });
db.insert('levels', { level_name: 'Beginner', min_xp: 0, max_xp: 99 });
db.insert('levels', { level_name: 'Learner', min_xp: 100, max_xp: 299 });
db.insert('levels', { level_name: 'Achiever', min_xp: 300, max_xp: 599 });
db.insert('levels', { level_name: 'Scholar', min_xp: 600, max_xp: 999 });
db.insert('levels', { level_name: 'STEM Expert', min_xp: 1000, max_xp: 1999 });
db.insert('levels', { level_name: 'STEM Master', min_xp: 2000, max_xp: 999999 });

function buildParams(params, values) {
  if (!params || !values) return {};
  const obj = {};
  for (let i = 0; i < params.length; i++) {
    obj[params[i]] = values[i] !== undefined ? values[i] : null;
  }
  return obj;
}

async function query(sql, params) {
  const normalized = sql.trim().toUpperCase();
  try {
    if (normalized.startsWith('SELECT') || normalized.startsWith('WITH')) {
      const table = extractTable(sql);
      const fields = extractFields(sql);
      const whereFn = parseWhere(sql, params);
      const orderBy = extractOrderBy(sql);
      const limit = extractLimit(sql);
      const rows = db.select(table, fields, whereFn, { orderBy, limit });
      return [rows, []];
    }

    if (normalized.startsWith('INSERT')) {
      const info = extractInsert(sql);
      if (info) {
        const values = info.values.map((v, i) => {
          if (v === '?') return params ? params[i] : null;
          return v.replace(/^'(.*)'$/, '$1');
        });
        const data = {};
        for (let i = 0; i < info.fields.length; i++) {
          data[info.fields[i]] = values[i];
        }
        const result = db.insert(info.table, data);
        return [{ insertId: result.insertId, affectedRows: result.affectedRows }, []];
      }
      return [{ insertId: 1, affectedRows: 1 }, []];
    }

    if (normalized.startsWith('UPDATE')) {
      const info = extractUpdate(sql);
      if (info) {
        const setMatch = info.sets.match(/(\w+)\s*=\s*(?:\?|'[^']*'|(\d+))/g);
        const updates = {};
        if (setMatch) {
          let pIdx = 0;
          for (const s of setMatch) {
            const [, field, val] = s.match(/(\w+)\s*=\s*(.+)/);
            if (val === '?') updates[field] = params ? params[pIdx++] : null;
            else updates[field] = val.replace(/^'(.*)'$/, '$1');
          }
        }
        const whereFn = parseWhere(sql, params ? params.slice(Object.keys(updates).length) : []);
        const result = db.update(info.table, updates, whereFn);
        return [{ affectedRows: result.affectedRows }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    if (normalized.startsWith('DELETE')) {
      const table = extractDelete(sql);
      const whereFn = parseWhere(sql, params);
      const result = db.delete(table, whereFn);
      return [{ affectedRows: result.affectedRows }, []];
    }

    return [[], []];
  } catch (e) {
    console.error('MockDB error:', e.message);
    return [[], []];
  }
}

class MockPool {
  async query(sql, params) { return query(sql, params); }
  async execute(sql, params) { return query(sql, params); }
}

async function createMockDb() {
  console.log('Mock DB initialized — credentials: admin@stempal.com / adminstempal | juan@gmail.com / userstempal');
  return new MockPool();
}

module.exports = { createMockDb };
