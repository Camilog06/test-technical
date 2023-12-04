import pool from '../config/database.js';

export const MessageController = {
  async getMessages(req, res) {
    try {
      const [rows] = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener mensajes:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async postMessage(req, res) {
    try {
      const { nickname, message } = req.body;
      await pool.query('INSERT INTO messages (nickname, message) VALUES (?, ?)', [nickname, message]);

      wss.clients.forEach((client) => {
        client.send(JSON.stringify({ systemMessage: true, message }));
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error al guardar mensaje:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getPreviousMessages(req, res) {
    try {
      const [rows] = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener mensajes anteriores:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};