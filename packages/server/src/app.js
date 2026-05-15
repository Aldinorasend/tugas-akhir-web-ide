import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import studyCaseRoutes from './api/routes/studyCaseRoutes.js';
import projectRoutes from './api/routes/projectRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Nanti route REST API masuk ke sini


// Tambahkan ini di bawah
app.use('/api/study-cases', studyCaseRoutes);
app.use('/api/projects', projectRoutes);

// Setup HTTP Server untuk digabungkan dengan Websocket
const httpServer = createServer(app);

export { app, httpServer };