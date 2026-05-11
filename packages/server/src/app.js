import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import studyCaseRoutes from './api/routes/studyCaseRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Nanti route REST API masuk ke sini
app.get('/api/health', (req, res) => {
  res.json({ status: 'Pathwise Server is running properly.' });
});

// Tambahkan ini di bawah
app.use('/api/study-cases', studyCaseRoutes);

// Setup HTTP Server untuk digabungkan dengan Websocket
const httpServer = createServer(app);

export { app, httpServer };