import express from 'express';
import { format } from 'date-fns';
import http from 'http';
import { Server } from 'socket.io';
import pool from './config/database.js';
import { usersRouter } from './routes/userRoutes.js';
import { corsMiddleware } from './middlewares/cors.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(corsMiddleware());
app.disable('x-powered-by');

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.emit('message', '¡Bienvenido al chat!');

  pool.query('SELECT * FROM messages ORDER BY timestamp DESC')
    .then(([rows]) => socket.emit('previousMessages', rows))
    .catch((error) => console.error('Error al obtener mensajes anteriores:', error));

    socket.on('getPreviousMessages', async () => {
      try {
        const [rows] = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
        socket.emit('previousMessages', rows);
      } catch (error) {
        console.error('Error al obtener mensajes anteriores:', error);
      }
    });

  socket.on('chat message', async (msg) => {
    try {
      const { nickname, message } = msg;
      const timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

      await pool.query('INSERT INTO messages (nickname, message, timestamp) VALUES (?, ?, ?)', [nickname, message, timestamp]);

      socket.broadcast.emit('message', { nickname, message, timestamp });
    } catch (error) {
      console.error('Error al procesar y guardar el mensaje:', error);
    }
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

app.post('/messages', async (req, res) => {
  try {
    const { nickname, message } = req.body;
    const timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    await pool.query('INSERT INTO messages (nickname, message, timestamp) VALUES (?, ?, ?)', [nickname, message, timestamp]);

    io.emit('message', { nickname, message, timestamp });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al procesar y guardar el mensaje:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener mensajes:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use('/users', usersRouter);

const PORT = process.env.PORT || 1234;

server.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
  console.log(`Socket.IO server is running.`);
});

export { io };
