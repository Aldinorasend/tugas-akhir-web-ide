const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('editor-update', (data) => {
        // Stream back or to other collaborators if needed
        socket.broadcast.emit('remote-update', data);
    });

    socket.on('run-code', (data) => {
        console.log('Running code for user:', socket.id);
        // Trigger Docker Sandbox execution here in future phase
        socket.emit('output', 'Sandbox execution not implemented yet.');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
