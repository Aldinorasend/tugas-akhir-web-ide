import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import studyCaseRoutes from './api/routes/studyCaseRoutes.js';
import graderRules from './api/routes/graderRules.js';
import authRoutes from './api/routes/authRoutes.js';
import lecturerDashboardRoutes from './api/routes/lecturerDashboardRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route REST API
app.use('/api/auth', authRoutes);
app.use('/api/study-cases', studyCaseRoutes);
app.use('/api/grader', graderRules);
app.use('/api/lecturer/dashboard', lecturerDashboardRoutes);

// =================================================================
// PENYESUAIAN SERVERLESS VERCEL
// =================================================================

// Jika di lokal (development), kita tetap buat httpServer untuk listen port
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    const httpServer = createServer(app);
    
    httpServer.listen(PORT, () => {
        console.log(`[Lokal] Server Pathwise berjalan di port ${PORT}`);
    });
}

// WAJIB: Export default app agar Vercel Serverless bisa mengeksekusi routing-nya
export default app;