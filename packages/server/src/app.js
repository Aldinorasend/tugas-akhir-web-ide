import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import studyCaseRoutes from './api/routes/studyCaseRoutes.js';
import graderRules from './api/routes/graderRules.js';
import authRoutes from './api/routes/authRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Nanti route REST API masuk ke sini
app.use('/api/auth', authRoutes);
app.use('/api/study-cases', studyCaseRoutes);
app.use('/api/grader', graderRules);

// Setup HTTP Server untuk digabungkan dengan Websocket
const httpServer = createServer(app);

export { app, httpServer };