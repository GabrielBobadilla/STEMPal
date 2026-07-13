const pool = require('../config/db');
const { generateCrosswordData } = require('../utils/aiService');
const { buildCrossword } = require('../utils/crosswordEngine');

const rooms = {};
const crosswordRooms = {};
const quizQuestions = {
  'General': [
    { question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], answer: 0 },
    { question: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
    { question: 'What is the speed of light approximately?', options: ['3×10^6 m/s', '3×10^8 m/s', '3×10^10 m/s', '3×10^4 m/s'], answer: 1 },
    { question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi'], answer: 2 },
    { question: 'What does CPU stand for?', options: ['Central Process Unit', 'Computer Personal Unit', 'Central Processing Unit', 'Core Process Unit'], answer: 2 },
    { question: 'What is the chemical formula for glucose?', options: ['C6H12O6', 'CH4', 'H2SO4', 'NaHCO3'], answer: 0 },
    { question: 'Who developed the theory of relativity?', options: ['Newton', 'Einstein', 'Galileo', 'Hawking'], answer: 1 },
    { question: 'What is the largest organ in the human body?', options: ['Liver', 'Brain', 'Skin', 'Heart'], answer: 2 },
    { question: 'What is the binary representation of 5?', options: ['101', '110', '100', '111'], answer: 0 },
    { question: 'What force keeps planets orbiting the sun?', options: ['Magnetism', 'Gravity', 'Nuclear', 'Friction'], answer: 1 },
  ],
  'Science': [
    { question: 'What is the pH of pure water?', options: ['5', '7', '9', '3'], answer: 1 },
    { question: 'Which element has the atomic number 1?', options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'], answer: 2 },
    { question: 'What type of bond shares electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], answer: 1 },
    { question: 'What is the SI unit of force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], answer: 2 },
    { question: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2 },
  ],
  'Technology': [
    { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Markup Language'], answer: 0 },
    { question: 'What is the brain of a computer?', options: ['RAM', 'Hard Drive', 'CPU', 'GPU'], answer: 2 },
    { question: 'What does API stand for?', options: ['Application Programming Interface', 'Application Process Integration', 'Automated Program Interface', 'Advanced Programming Integration'], answer: 0 },
    { question: 'What is the most common programming language for web?', options: ['Python', 'JavaScript', 'Java', 'C++'], answer: 1 },
    { question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'], answer: 0 },
  ],
  'Mathematics': [
    { question: 'What is the value of Pi (π) to 2 decimal places?', options: ['3.14', '3.16', '3.12', '3.18'], answer: 0 },
    { question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], answer: 2 },
    { question: 'What is the derivative of x²?', options: ['x', '2x', '2', 'x²'], answer: 1 },
    { question: 'What is the integral of 1/x?', options: ['ln(x) + C', 'e^x + C', 'x + C', '1/x² + C'], answer: 0 },
    { question: 'What is 5! (5 factorial)?', options: ['60', '120', '24', '100'], answer: 1 },
  ],
};

function getQuestionsForCategory(category, count) {
  const pool = quizQuestions[category] || quizQuestions['General'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', ({ roomCode, user }) => {
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.user = user;

      if (!rooms[roomCode]) {
        rooms[roomCode] = {
          players: {},
          quizState: 'waiting',
          currentQuestion: 0,
          questions: [],
          timer: null,
          timeLeft: 30,
        };
      }

      const room = rooms[roomCode];
      room.players[socket.id] = {
        id: socket.id,
        userId: user.id,
        fullname: user.fullname,
        score: 0,
        correctAnswers: 0,
        totalAnswers: 0,
      };

      io.to(roomCode).emit('room-update', {
        players: Object.values(room.players),
        quizState: room.quizState,
      });

      console.log(`${user.fullname} joined room ${roomCode}`);
    });

    socket.on('start-game', ({ roomCode, category, difficulty }) => {
      const room = rooms[roomCode];
      if (!room) return;

      const questionCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
      const timePerQuestion = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 15 : 10;

      room.questions = getQuestionsForCategory(category, questionCount);
      room.quizState = 'starting';
      room.currentQuestion = 0;
      Object.keys(room.players).forEach(id => {
        room.players[id].score = 0;
        room.players[id].correctAnswers = 0;
        room.players[id].totalAnswers = 0;
      });

      let countdown = 5;
      io.to(roomCode).emit('countdown', { countdown });

      const countInterval = setInterval(() => {
        countdown--;
        io.to(roomCode).emit('countdown', { countdown });
        if (countdown <= 0) {
          clearInterval(countInterval);
          room.quizState = 'active';
          sendQuestion(io, roomCode, room, timePerQuestion);
        }
      }, 1000);
    });

    socket.on('submit-answer', ({ roomCode, questionIndex, answer }) => {
      const room = rooms[roomCode];
      if (!room || !room.questions[questionIndex]) return;

      const player = room.players[socket.id];
      if (!player) return;

      const correct = room.questions[questionIndex].answer === answer;
      player.totalAnswers++;

      if (correct) {
        const timeBonus = Math.floor(room.timeLeft / 3);
        player.score += 10 + timeBonus;
        player.correctAnswers++;
      }

      socket.emit('answer-result', {
        correct: correct,
        correctAnswer: room.questions[questionIndex].answer,
      });

      io.to(roomCode).emit('score-update', {
        players: Object.values(room.players),
      });
    });

    socket.on('join-crossword-room', ({ roomCode, user }) => {
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.user = user;
      socket.data.roomType = 'crossword';

      if (!crosswordRooms[roomCode]) {
        crosswordRooms[roomCode] = {
          players: {},
          state: 'waiting',
          puzzle: null,
          topic: '',
          difficulty: 'medium',
          timeLimit: 600,
          timeLeft: 600,
          timer: null,
          startedAt: null,
        };
      }

      const room = crosswordRooms[roomCode];
      room.players[socket.id] = {
        id: socket.id,
        userId: user.id,
        fullname: user.fullname,
        score: 0,
        wordsCompleted: 0,
        hintsUsed: 0,
        completedWords: [],
        gridState: null,
      };

      io.to(roomCode).emit('crossword-room-update', {
        players: Object.values(room.players),
        state: room.state,
        puzzle: room.puzzle,
        topic: room.topic,
        difficulty: room.difficulty,
        timeLimit: room.timeLimit,
        timeLeft: room.timeLeft,
      });

      console.log(`${user.fullname} joined crossword room ${roomCode}`);
    });

    socket.on('create-crossword-room', async ({ topic, difficulty, timeLimit, user }) => {
      const roomCode = generateRoomCode();

      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.user = user;
      socket.data.roomType = 'crossword';

      crosswordRooms[roomCode] = {
        players: {},
        state: 'generating',
        puzzle: null,
        topic,
        difficulty: difficulty || 'medium',
        timeLimit: timeLimit || 600,
        timeLeft: timeLimit || 600,
        timer: null,
        startedAt: null,
      };

      crosswordRooms[roomCode].players[socket.id] = {
        id: socket.id,
        userId: user.id,
        fullname: user.fullname,
        score: 0,
        wordsCompleted: 0,
        hintsUsed: 0,
        completedWords: [],
        gridState: null,
      };

      socket.emit('crossword-room-created', { roomCode });

      try {
        const crosswordData = await generateCrosswordData(topic, difficulty || 'medium', difficulty === 'easy' ? 10 : difficulty === 'hard' ? 22 : 15);
        const allWords = [...(crosswordData.across || []), ...(crosswordData.down || [])];
        const gridData = buildCrossword(allWords, 10);

        crosswordRooms[roomCode].puzzle = {
          title: crosswordData.title || topic,
          rows: gridData.rows,
          cols: gridData.cols,
          grid: gridData.grid,
          across: gridData.across,
          down: gridData.down,
          totalWords: gridData.totalWords,
        };
        crosswordRooms[roomCode].state = 'waiting';

        io.to(roomCode).emit('crossword-room-update', {
          players: Object.values(crosswordRooms[roomCode].players),
          state: 'waiting',
          puzzle: crosswordRooms[roomCode].puzzle,
          topic,
          difficulty,
          timeLimit: timeLimit || 600,
          timeLeft: timeLimit || 600,
        });
      } catch (error) {
        console.error('Crossword generation failed in room:', error);
        crosswordRooms[roomCode].state = 'error';
        io.to(roomCode).emit('crossword-error', { message: 'Failed to generate puzzle. Please try again.' });
      }
    });

    socket.on('start-crossword', ({ roomCode }) => {
      const room = crosswordRooms[roomCode];
      if (!room || !room.puzzle) return;

      room.state = 'active';
      room.timeLeft = room.timeLimit;
      room.startedAt = Date.now();

      io.to(roomCode).emit('crossword-started', {
        timeLeft: room.timeLeft,
      });

      clearInterval(room.timer);
      room.timer = setInterval(() => {
        room.timeLeft--;
        io.to(roomCode).emit('crossword-timer', { timeLeft: room.timeLeft });
        if (room.timeLeft <= 0) {
          clearInterval(room.timer);
          endCrosswordGame(io, roomCode, room);
        }
      }, 1000);
    });

    socket.on('crossword-word-completed', ({ roomCode, wordNumber, direction, timeSpent }) => {
      const room = crosswordRooms[roomCode];
      if (!room || room.state !== 'active') return;

      const player = room.players[socket.id];
      if (!player) return;

      const wordKey = `${direction}-${wordNumber}`;
      if (!player.completedWords.includes(wordKey)) {
        player.completedWords.push(wordKey);
        player.wordsCompleted = player.completedWords.length;
        player.score += 10;

        io.to(roomCode).emit('crossword-progress', {
          playerId: socket.id,
          fullname: player.fullname,
          wordsCompleted: player.wordsCompleted,
          score: player.score,
          completedWords: player.completedWords,
        });
      }
    });

    socket.on('crossword-cell-update', ({ roomCode, row, col, letter }) => {
      const room = crosswordRooms[roomCode];
      if (!room || room.state !== 'active') return;

      socket.to(roomCode).emit('crossword-cell-changed', {
        playerId: socket.id,
        row,
        col,
        letter,
      });
    });

    socket.on('crossword-hint-used', ({ roomCode }) => {
      const room = crosswordRooms[roomCode];
      if (!room) return;

      const player = room.players[socket.id];
      if (!player) return;

      player.hintsUsed++;
      io.to(roomCode).emit('crossword-hint-update', {
        playerId: socket.id,
        fullname: player.fullname,
        hintsUsed: player.hintsUsed,
      });
    });

    socket.on('crossword-complete', ({ roomCode }) => {
      const room = crosswordRooms[roomCode];
      if (!room || room.state !== 'active') return;

      const player = room.players[socket.id];
      if (!player) return;

      player.score += 50;
      io.to(roomCode).emit('crossword-player-finished', {
        playerId: socket.id,
        fullname: player.fullname,
        score: player.score,
        wordsCompleted: player.wordsCompleted,
      });

      const allFinished = Object.values(room.players).every(p => p.wordsCompleted >= (room.puzzle?.totalWords || 0));
      if (allFinished) {
        endCrosswordGame(io, roomCode, room);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      const roomCode = socket.data.roomCode;

      if (roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        delete room.players[socket.id];
        io.to(roomCode).emit('room-update', {
          players: Object.values(room.players),
          quizState: room.quizState,
        });
        io.to(roomCode).emit('player-disconnected', {
          playerId: socket.id,
          fullname: socket.data.user?.fullname || 'Unknown',
        });
        if (Object.keys(room.players).length === 0) {
          clearInterval(room.timer);
          delete rooms[roomCode];
        }
      }

      if (roomCode && crosswordRooms[roomCode]) {
        const cRoom = crosswordRooms[roomCode];
        delete cRoom.players[socket.id];
        io.to(roomCode).emit('crossword-room-update', {
          players: Object.values(cRoom.players),
          state: cRoom.state,
          puzzle: cRoom.puzzle,
          topic: cRoom.topic,
          difficulty: cRoom.difficulty,
          timeLimit: cRoom.timeLimit,
          timeLeft: cRoom.timeLeft,
        });
        io.to(roomCode).emit('crossword-player-disconnected', {
          playerId: socket.id,
          fullname: socket.data.user?.fullname || 'Unknown',
        });
        if (Object.keys(cRoom.players).length === 0) {
          clearInterval(cRoom.timer);
          delete crosswordRooms[roomCode];
        }
      }
    });
  });
};

function sendQuestion(io, roomCode, room, timePerQuestion) {
  if (room.currentQuestion >= room.questions.length) {
    endGame(io, roomCode, room);
    return;
  }

  const q = room.questions[room.currentQuestion];
  room.timeLeft = timePerQuestion;

  io.to(roomCode).emit('question', {
    questionIndex: room.currentQuestion,
    total: room.questions.length,
    question: q.question,
    options: q.options,
    timeLeft: timePerQuestion,
  });

  clearInterval(room.timer);
  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(roomCode).emit('timer', { timeLeft: room.timeLeft });
    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      io.to(roomCode).emit('time-up', { questionIndex: room.currentQuestion, correctAnswer: q.answer });
      setTimeout(() => {
        room.currentQuestion++;
        sendQuestion(io, roomCode, room, timePerQuestion);
      }, 1500);
    }
  }, 1000);
}

function endGame(io, roomCode, room) {
  room.quizState = 'finished';
  clearInterval(room.timer);

  const sorted = Object.values(room.players).sort((a, b) => b.score - a.score);
  const leaderboard = sorted.map((p, i) => ({
    rank: i + 1,
    fullname: p.fullname,
    score: p.score,
    correctAnswers: p.correctAnswers,
    totalAnswers: p.totalAnswers,
    userId: p.userId,
  }));

  io.to(roomCode).emit('game-ended', { leaderboard });
}

function endCrosswordGame(io, roomCode, room) {
  room.state = 'finished';
  clearInterval(room.timer);

  const sorted = Object.values(room.players).sort((a, b) => {
    if (b.wordsCompleted !== a.wordsCompleted) return b.wordsCompleted - a.wordsCompleted;
    return b.score - a.score;
  });

  const leaderboard = sorted.map((p, i) => ({
    rank: i + 1,
    fullname: p.fullname,
    score: p.score,
    wordsCompleted: p.wordsCompleted,
    hintsUsed: p.hintsUsed,
    userId: p.userId,
    totalWords: room.puzzle?.totalWords || 0,
  }));

  io.to(roomCode).emit('crossword-game-ended', { leaderboard });
}
