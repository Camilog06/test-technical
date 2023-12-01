import express from 'express';
import pool from './config/database.js'
import http from 'http';
import WebSocket from 'ws';
import { usersRouter } from './routes/userRoutes.js';
import { corsMiddleware } from './middlewares/cors.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

app.use(express.json());
app.use(corsMiddleware());
app.disable('x-powered-by');

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ message: '¡Conexión establecida!' }));
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.use((req, res, next) => {
  req.mysql = pool;
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.use('/users', usersRouter);

const PORT = process.env.PORT || 1234;

server.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});

export { wss };