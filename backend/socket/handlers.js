const pool = require('../config/db');

const rooms = {};
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
