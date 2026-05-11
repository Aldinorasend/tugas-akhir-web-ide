import 'dotenv/config';
import { httpServer } from './src/app.js';
import { initWebSocket } from './src/ws/server.js';

const PORT = process.env.PORT || 4000;

// Inisialisasi Websocket
initWebSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`🚀 Pathwise Core Processing Engine is alive on http://localhost:${PORT}`);
});