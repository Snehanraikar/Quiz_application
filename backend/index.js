const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const cors = require("cors");
const questions = require("./questions");

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = {};

io.on("connection", (socket) => {
  socket.on("create-room", (data) => {
    const name = data.name;
    const room = data.room;

    if (!rooms[room]) {
      socket.join(room);

      rooms[room] = {
        players: [],
        length: 1,
        currentQuestion: null,
        currentQuestIndex: 0,
        correctAnswer: null,
        questionTimeout: null,
      };

      rooms[room].players.push({ id: socket.id, name, score: 0 });

      socket.emit("room-entered");
    } else {
      socket.emit("room-error", { message: "Room already exists" });
    }
  });

  socket.on("join-room", (data) => {
    const name = data.name;
    const room = data.room;

    const roomObj = rooms[room];

    if (!roomObj || roomObj.length === 2) {
      // Room doesn't exist or is full
      socket.emit("room-error", {
        message: "Room is full or does not exist",
      });
      return;
    }

    // Room exists and has space for another player
    socket.join(room);
    rooms[room].players.push({ id: socket.id, name, score: 0 });
    rooms[room].length += 1;

    if (rooms[room].length === 2) {
      // Room is now full, notify players and start the game
      socket.emit("room-entered");
      // Start the game immediately after two players join
      askNewQuestion(room);
    } else {
      // Player joined successfully but room is not yet full
      socket.emit("room-entered");
    }
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      const index = rooms[room].players.findIndex(
        (player) => player.id === socket.id
      );
      if (index !== -1) {
        rooms[room].players.splice(index, 1);
        if (rooms[room].players.length === 0) {
          clearTimeout(rooms[room].questionTimeout);
          delete rooms[room];
        }
        break;
      }
    }
  });

  socket.on("submitAnswer", (room, answerIndex) => {
    if (!rooms[room] || !rooms[room].players) {
      console.error(`Room ${room} does not exist or has no players.`);
      return;
    }

    const currentPlayer = rooms[room].players.find(
      (player) => player.id === socket.id
    );
    const msg = currentPlayer.name + " submitted.";
    io.to(room).emit("message", msg);

    if (!currentPlayer) {
      console.error("Current player not found.");
      return;
    }

    const correctAnswer = rooms[room].correctAnswer;
    const isCorrect =
      correctAnswer !== null && correctAnswer === answerIndex;
    currentPlayer.score = isCorrect
      ? (currentPlayer.score || 0) + 1
      : currentPlayer.score || 0;

    currentPlayer.answered = true; // Mark current player as answered

    const allPlayersAnswered = rooms[room].players.every(
      (player) => player.answered
    );

	if (allPlayersAnswered) {
		io.to(room).emit("answerResult", {
		  playerName: currentPlayer.name,
		  isCorrect,
		  correctAnswer,
		  scores: rooms[room].players.map((player) => ({
			name: player.name,
			score: player.score || 0,
		  })),
		});
		proceedToNextQuestion(room);
	  }
	});
  
	function proceedToNextQuestion(room) {
	  clearTimeout(rooms[room].questionTimeout);
	  const totalQuestions = questions.length;
  
	  if (rooms[room].currentQuestIndex >= totalQuestions) {
		isGameOver(room);
	  } else {
		askNewQuestion(room);
	  }
	}
  
	function askNewQuestion(room) {
	  if (rooms[room].players.length === 0) {
		clearTimeout(rooms[room].questionTimeout);
		delete rooms[room];
		return;
	  }
  
	  rooms[room].players.forEach((player) => {
		player.answered = false; // Reset answered state for all players
	  });
  
	  const questIndex = rooms[room].currentQuestIndex;
	  rooms[room].currentQuestIndex++;
	  const question = questions[questIndex];
	  rooms[room].currentQuestion = question;
	  const correctAnswerIndex = question.answers.findIndex(
		(answer) => answer.correct
	  );
  
	  rooms[room].correctAnswer = correctAnswerIndex;
	  io.to(room).emit("newQuestion", {
		question: question.question,
		answers: question.answers.map((answer) => answer.text),
		timer: 10,
	  });
  
	  rooms[room].questionTimeout = setTimeout(() => {
		handleQuestionTimeout(room);
	  }, 30000);
	}
  
	function handleQuestionTimeout(room) {
	  rooms[room].players.forEach((player) => {
		if (!player.answered) {
		  player.answered = true; // Mark player as answered
		  player.score = player.score || 0; // Ensure score is initialized
		}
	  });
  
	  io.to(room).emit("answerResult", {
		playerName: "No one",
		isCorrect: false,
		correctAnswer: rooms[room].correctAnswer,
		scores: rooms[room].players.map((player) => ({
		  name: player.name,
		  score: player.score || 0,
		})),
	  });
  
	  proceedToNextQuestion(room);
	}
  });
  
  function isGameOver(room) {
	let maxScore = -1;
	let winners = [];
	let results = {};
  
	// Find the maximum score
	rooms[room].players.forEach((player) => {
	  if (player.score > maxScore) {
		maxScore = player.score;
		winners = [player];
	  } else if (player.score === maxScore) {
		winners.push(player);
	  }
	});
  
	if (winners.length === 1) {
	  results = {
		winner: winners[0].name,
		tie: false,
		score: rooms[room].players,
	  };
  
	  io.to(room).emit("gameOver", { results });
	} else {
	  results = { winner: null, tie: true, score: rooms[room].players };
  
	  io.to(room).emit("gameOver", { results });
	}
  
	delete rooms[room];
  }
  
  const PORT = process.env.PORT || 5000;
  
  server.listen(PORT, () => console.log(`Backend server started at ${PORT}`));