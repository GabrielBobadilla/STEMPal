-- ================================================
-- STEMPal Database Schema
-- Smart AI-Powered Study Break Recommender
-- ================================================

CREATE DATABASE IF NOT EXISTS stempal;
USE stempal;

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    profile_picture VARCHAR(255) DEFAULT 'default.png',
    grade_level VARCHAR(50),
    school VARCHAR(100),
    stem_strand VARCHAR(100),
    theme_preference ENUM('light', 'dark') DEFAULT 'light',
    notification_enabled BOOLEAN DEFAULT TRUE,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================================================
-- USER PREFERENCES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    subjects JSON,
    hobbies JSON,
    learning_style ENUM('visual', 'reading', 'practice', 'mixed') DEFAULT 'mixed',
    study_duration ENUM('30min', '1hour', '2hours', '3plus') DEFAULT '1hour',
    preferred_break JSON,
    study_goals TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- NOTES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    source ENUM('human', 'ai', 'both') DEFAULT 'ai',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    tags JSON,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- PDF UPLOADS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS pdf_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT,
    file_path VARCHAR(500) NOT NULL,
    extracted_text LONGTEXT,
    ocr_used BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- GENERATED REVIEWERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS generated_reviewers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pdf_id INT,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    reviewer_type ENUM('basic', 'detailed', 'exam') DEFAULT 'basic',
    content JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pdf_id) REFERENCES pdf_uploads(id) ON DELETE SET NULL
);

-- ================================================
-- QUIZZES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    topic VARCHAR(255),
    quiz_type ENUM('multiple_choice', 'identification', 'true_false', 'short_answer') DEFAULT 'multiple_choice',
    questions JSON,
    answers JSON,
    score DECIMAL(5,2),
    accuracy DECIMAL(5,2),
    total_questions INT,
    correct_answers INT,
    time_taken INT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    weak_topics JSON,
    strong_topics JSON,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- FLASHCARDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS flashcards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    topic VARCHAR(255),
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    is_favorite BOOLEAN DEFAULT FALSE,
    mastery_level INT DEFAULT 0,
    last_reviewed TIMESTAMP NULL,
    next_review TIMESTAMP NULL,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- STUDY HISTORY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS study_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity VARCHAR(255) NOT NULL,
    activity_type ENUM('study', 'quiz', 'flashcard', 'pdf_review', 'break', 'reviewer') NOT NULL,
    duration INT DEFAULT 0,
    details JSON,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- BREAK RECOMMENDATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS break_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recommendation VARCHAR(255) NOT NULL,
    reason TEXT,
    benefits JSON,
    duration INT NOT NULL,
    study_time INT,
    focus_level VARCHAR(20),
    is_taken BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- STREAKS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    weekly_progress JSON,
    monthly_calendar JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- ACHIEVEMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_type ENUM('bronze', 'silver', 'gold', 'platinum', 'master') DEFAULT 'bronze',
    description TEXT,
    unlocked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- NOTIFICATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('study_reminder', 'break_reminder', 'streak', 'goal', 'quiz', 'reviewer', 'achievement') DEFAULT 'study_reminder',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- LEVELS CONFIGURATION TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(50) NOT NULL,
    min_xp INT NOT NULL,
    max_xp INT NOT NULL
);

-- ================================================
-- GAMIFICATION LOG TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS xp_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    xp_earned INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- LEADERBOARD (Materialized View for performance)
-- ================================================
CREATE TABLE IF NOT EXISTS leaderboard (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    total_xp INT DEFAULT 0,
    weekly_xp INT DEFAULT 0,
    monthly_xp INT DEFAULT 0,
    week_start DATE,
    month_start DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- CROSSWORD PUZZLES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS crossword_puzzles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    puzzle_data JSON NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    score INT DEFAULT 0,
    total_words INT DEFAULT 0,
    completed_words INT DEFAULT 0,
    hints_used INT DEFAULT 0,
    time_taken INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- MULTIPLAYER ROOMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(10) UNIQUE NOT NULL,
    host_id INT NOT NULL,
    category VARCHAR(100),
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    status ENUM('waiting', 'starting', 'active', 'finished') DEFAULT 'waiting',
    max_players INT DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- MULTIPLAYER PARTICIPANTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS multiplayer_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_answers INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- MULTIPLAYER QUIZ HISTORY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS multiplayer_quiz_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_code VARCHAR(10),
    category VARCHAR(100),
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    score INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    rank INT DEFAULT 0,
    total_players INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- SCANNED DOCUMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS scanned_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type ENUM('pdf', 'image') DEFAULT 'pdf',
    page_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- FOCUS SCORES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS focus_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    score DECIMAL(5,2),
    session_type VARCHAR(50),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- POMODORO SESSIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    study_duration INT NOT NULL,
    break_duration INT NOT NULL,
    sessions_completed INT DEFAULT 0,
    mode ENUM('traditional', 'adaptive') DEFAULT 'traditional',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_quizzes_user ON quizzes(user_id);
CREATE INDEX idx_flashcards_user ON flashcards(user_id);
CREATE INDEX idx_study_history_user ON study_history(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_study_history_date ON study_history(date);
CREATE INDEX idx_quizzes_date ON quizzes(date);

-- ================================================
-- INSERT DEFAULT LEVELS
-- ================================================
INSERT INTO levels (level_name, min_xp, max_xp) VALUES
('Beginner', 0, 99),
('Learner', 100, 299),
('Achiever', 300, 599),
('Scholar', 600, 999),
('STEM Expert', 1000, 1999),
('STEM Master', 2000, 999999);

-- ================================================
-- INSERT DEFAULT USERS
-- ================================================
INSERT INTO users (fullname, email, password, role) VALUES
('STEMPal Admin', 'admin@stempal.com', '$2a$10$Fyy7rHPQQQ3H6P.PBcvT7Omyd4WbrmHylN2dpvJEE2O9Zsru2Lm3q', 'admin'),
('Juan Dela Cruz', 'juan@gmail.com', '$2a$10$DfWekcLsJkMyyWJcRQrrD.S8DCkta1s27sf8cMmlRZAS1mrmaHzWi', 'student');
