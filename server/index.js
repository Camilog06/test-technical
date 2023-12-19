import express from 'express';
import { format } from 'date-fns';
import http from 'http';
import giphy from 'giphy-api';
import { Server } from 'socket.io';
import moment from 'moment';
import { google } from 'googleapis';
import pool from './config/database.js';
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

io.on('connection', async (socket) => {
  console.log('Un usuario se ha conectado');

  socket.emit('message', '¡Bienvenido al chat!');

  try {
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
    console.log('Mensajes anteriores enviados al cliente:', rows);
    socket.emit('previousMessages', rows);
  } catch (error) {
    console.error('Error al obtener mensajes anteriores:', error);
  }
  
  socket.on('previousMessages', async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
      socket.emit('previousMessages', rows);
    } catch (error) {
      console.error('Error al obtener mensajes anteriores:', error);
    }
  });

  socket.on('message', (data) => {
    console.log('Mensaje recibido en el servidor:', data);
    const timestamp = moment().format();

    if(data.message.startsWith('/giphy')) {
      const keywordg = data.message.replace('giphy', '').trim();
      searchAndSendGifResults(socket, keywordg);
    } else {
        pool.query(
          'INSERT INTO messages (nickname, message, timestamp) VALUES (?, ?, ?)',
          [data.nickname, data.message, timestamp],
          (err) => {
            if (err) {
              console.error('Error al insertar mensaje en la base de datos:', err);
            } else {
              io.emit('newMessage', {
                nickname: data.nickname,
                message: data.message,
                timestamp: timestamp,
              });           

              console.log('Mensaje emitido exitosamente al cliente');
            }
          }
        );
    }

    socket.on('searchGiphy', (keywordg) => {
      searchAndSendGifResults(socket, keywordg);
    });
    
    if (data.message.startsWith('/youtube')) {
      const keyword = data.message.replace('/youtube', '').trim();
      searchAndSendYouTubeResults(socket, keyword);
    } else {
      pool.query(
        'INSERT INTO messages (nickname, message, timestamp) VALUES (?, ?, ?)',
        [data.nickname, data.message, timestamp],
        (err) => {
          if (err) {
            console.error('Error al insertar mensaje en la base de datos:', err);
          } else {
            io.emit('newMessage', {
              nickname: data.nickname,
              message: data.message,
              timestamp: timestamp,
            });           

            console.log('Mensaje emitido exitosamente al cliente');
          }
        }
      );
    }
  });

  socket.on('searchGiphy', (keywordg) => {
    searchAndSendGifResults(socket, keywordg);
  });

  socket.on('searchYouTube', (keyword) => {
    searchAndSendYouTubeResults(socket, keyword);
  });
});


app.get('/youtube', async (req,res)=> {
  console.log('Recibida solicitud de búsqueda de YouTube');
  const keyword = req.query.keyword || 'dogs'

  try {
    const results = await searchByKeyword(keyword);
    res.json(results);
  } catch (error) {
    console.error('Error al realizar la búsqueda en YouTube:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/giphy', async (req, res) => {
  console.log('Recibida solicitud de búsqueda de Giphy');
  const keywordg = req.query.keywordg || 'hi';

  try {
    const results = await searchGifByKeyword(keywordg);

    if (results.error) {
      console.error('Error in Giphy search:', results.error);
      res.status(500).json({ error: results.error });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error al realizar la búsqueda en Giphy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.use((req, res, next) => {
  req.mysql = pool;
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
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

async function searchAndSendYouTubeResults(socket, keyword) {
  console.log('Buscando y enviando resultados de YouTube para:', keyword);

  try {
    const results = await searchByKeyword(keyword);
    socket.emit('youtubeResults', results);
  } catch (error) {
    console.error('Error al buscar y enviar resultados de YouTube:', error);
  }
}

async function searchAndSendGifResults(socket, keywordg) {
  try {
    searchGifByKeyword(keywordg, (results) => {
      if (results && results.gifUrl) {
        socket.emit('giphyResults', results);
      } else {
        console.error('No gifUrl found in Giphy results.');
        socket.emit('giphyResults', { error: 'No gifUrl found in Giphy results.', results: [] });
      }
    });
  } catch (error) {
    console.error('Error searching and sending Giphy results:', error);
    socket.emit('giphyResults', { error: 'Error searching and sending Giphy results.', results: [] });
  }
}


async function searchGifByKeyword(keyword, callback) {
  const giphyApiKey = 'SS2ADCshcq9mMFHqFMUKQdxg1IXp0Mq6';
  const client = giphy(giphyApiKey);

  try {
    const response = await client.search(keyword, { limit: 1 });

    if (response && response.data && response.data.length > 0) {
      const gifUrl = response.data[0].url;
      if (typeof callback === 'function') {
        callback({ gifUrl });
      } else {
        console.error('Callback is not a function in searchGifByKeyword');
      }
    } else {
      console.error('No se encontraron resultados de Giphy para la palabra clave:', keyword);
      if (typeof callback === 'function') {
        callback({ error: 'No se encontraron resultados de Giphy para la palabra clave.', results: [] });
      } else {
        console.error('Callback is not a function in searchGifByKeyword');
      }
    }
  } catch (error) {
    console.error('Error searching Giphy:', error);
    if (typeof callback === 'function') {
      callback({ error: 'Error searching Giphy.', results: [] });
    } else {
      console.error('Callback is not a function in searchGifByKeyword');
    }
  }
}


async function searchByKeyword(keyword) {
  const youtube = google.youtube({
    version: 'v3',
    auth: 'AIzaSyCAR35DYcWNyegGQWjbxGARPNXHJwl-9cI', 
  });

  const response = await youtube.search.list({
    part: 'id,snippet',
    q: keyword,
    maxResults: 1,
  });

  const results = response.data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
  }));

  return results;
}
const PORT = process.env.PORT || 1234;

server.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
  console.log(`Socket.IO server is running.`);
});

export { io };
