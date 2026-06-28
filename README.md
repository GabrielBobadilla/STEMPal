# STEMPal - Smart AI-Powered Study Break Recommender

A comprehensive AI-powered learning platform designed specifically for STEM students. Combines adaptive learning, AI-generated reviewers, quizzes, flashcards, study analytics, Pomodoro-based productivity, and a Smart Break Recommendation Engine.

## 🚀 Features

### 🤖 AI-Powered Learning
- AI-generated study reviewers (Basic, Detailed, Exam)
- Smart quiz generation with adaptive difficulty
- Automatic flashcard creation
- Formula sheet and key terms generation
- PDF processing with OCR support

### 📚 Study Tools
- Interactive flashcards with spaced repetition
- Multiple quiz types (MCQ, Identification, True/False, Short Answer)
- Pomodoro timer with adaptive AI mode
- Smart break recommendations based on focus levels
- Daily streak tracking with achievements

### 📊 Analytics & Tracking
- Study time trends and patterns
- Quiz performance analytics
- Focus score tracking
- Break effectiveness analysis
- Learning progress monitoring

### 🎮 Gamification
- XP points and leveling system
- Achievement badges (Bronze to STEM Master)
- Leaderboards (Weekly/Monthly/All Time)
- Streak rewards and bonuses

### 👤 User Features
- JWT authentication with role-based access
- Profile management with avatar upload
- Dark/Light theme support
- Real-time notifications
- Search across all study materials
- Preferences-based personalization

## 📋 Prerequisites

- Node.js (v16+)
- MySQL (v8+)
- npm or yarn
- Gemini API key (for AI features)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stemPal
```

### 2. Database Setup
```bash
# Create the database
mysql -u root -p < database/schema.sql
```

### 3. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp ../.env.example .env
# Edit .env with your database credentials and OpenAI API key

# Start the server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install

# Start the development server
npm start
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Default Admin: admin@stempal.com / admin123

## 📁 Project Structure

```
stemPal/
├── backend/
│   ├── config/          # Database and API configurations
│   │   ├── db.js        # MySQL connection pool
│   │   └── openai.js    # OpenAI API setup
│   ├── controllers/     # Business logic handlers
│   ├── middleware/       # Auth, upload middleware
│   ├── routes/          # Express API routes
│   ├── utils/           # AI service, PDF processing
│   ├── uploads/         # File upload storage
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   │   ├── layout/  # Layout, sidebar, header
│   │   │   └── ...      # Feature-specific components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts (Auth, Theme)
│   │   ├── services/    # API service layer
│   │   └── utils/       # Helper functions
│   └── package.json
├── database/
│   └── schema.sql       # Complete MySQL schema
├── .env.example         # Environment variables template
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/profile | Get user profile |
| PUT | /api/users/profile | Update profile |
| POST | /api/users/profile/picture | Upload avatar |
| PUT | /api/users/change-password | Change password |
| PUT | /api/users/theme | Toggle theme |
| PUT | /api/users/notifications | Update notification settings |

### AI & Study Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reviewers/generate | Generate AI reviewer |
| POST | /api/flashcards/generate | Generate flashcards |
| POST | /api/quizzes/generate | Generate quiz |
| POST | /api/quizzes/submit | Submit quiz results |
| POST | /api/pdf/upload | Upload PDF |
| POST | /api/pdf/:id/process | Process PDF with OCR |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/dashboard | Dashboard data |
| GET | /api/analytics/study-time | Study time trends |
| GET | /api/analytics/quiz-performance | Quiz performance |
| GET | /api/analytics/focus | Focus trends |
| GET | /api/analytics/metrics | Key metrics |

## 🧪 Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **Chart.js** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **Gemini API** - AI integration (Google Gemini 2.0 Flash)
- **PDFKit** - PDF generation
- **Tesseract.js** - OCR processing

## 🔐 Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stempal
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=http://localhost:3000
```

## 🎯 License

MIT License - see LICENSE file for details.
