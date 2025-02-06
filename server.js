const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

let firstResponder = null;
let gameActive = false; // ✅ Controla si los jugadores pueden presionar

// Ruta base
app.get('/', (req, res) => {
    res.send("El servidor de Socket.io está en ejecución");
});

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Cuando el moderador inicia la pregunta con cuenta regresiva
    socket.on('start_question', () => {
        console.log("⏳ Moderador inició la pregunta, enviando cuenta regresiva...");
        firstResponder = null;
        gameActive = false; // Asegurar que los jugadores no puedan presionar hasta que termine la cuenta regresiva
        io.emit('countdown_start'); // Enviar evento a los jugadores para mostrar la cuenta regresiva

        setTimeout(() => {
            gameActive = true;
            io.emit('question_started'); // Notifica que pueden presionar después de la cuenta regresiva
            console.log("🚀 Pregunta iniciada, botones activados.");
        }, 4000); // Espera 4 segundos (3, 2, 1, ¡YA!)
    });

    // Cuando un jugador presiona el botón
    socket.on('buzz', (username) => {
        if (gameActive && !firstResponder) {
            firstResponder = username;
            io.emit('first_buzzer', username); // Enviar a todos quién fue el primero en presionar
            gameActive = false; // Bloquea nuevos intentos solo después de que alguien presione
            console.log(`🎉 ${username} presionó primero, desactivando los botones.`);
        }
    });

    // Reiniciar el juego sin perder los nombres de los jugadores
    socket.on('reset', () => {
        firstResponder = null;
        gameActive = false;
        io.emit('reset_buzzer');
        console.log("🔄 Juego reiniciado.");
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('Servidor ejecutándose en http://localhost:3001');
});
