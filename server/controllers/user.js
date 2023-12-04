import { UserModel } from '../models/mysql/user.js';
import { io } from '../index.js'; 

export const UserController = {
  async register(req, res) {
    try {
      const { nickname } = req.body;
      const existingUser = await UserModel.getUserByNickname(nickname);

      if (existingUser) {
        await UserModel.updateUserStatus(nickname, 'active');
        res.json({ success: true });

        
        io.emit('userStatusUpdate', { nickname, state: 'active' });
      } else {
        const newUser = await UserModel.register({ input: { nickname, state: 'active' } });

        res.json({ success: true, user: newUser });

        
        io.emit('userStatusUpdate', { nickname, state: 'active' });
      }
    } catch (error) {
      console.error('Error al registrar el usuario:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async updateUserStatus(req, res) {
    try {
      const { nickname, state } = req.body;

      if (!['active', 'inactive'].includes(state)) {
        return res.status(400).json({
          error: 'Invalid state value',
          message: 'El valor del estado es inválido',
        });
      }

      await UserModel.updateUserStatus(nickname, state);
      res.json({ success: true });

      io.emit('userStatusUpdate', { nickname, state });
    } catch (error) {
      console.error('Error al actualizar el estado del usuario:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async logout(req, res) {
    try {
      const user = req.body;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Usuario no autenticado' });
      }

      await UserModel.updateUserStatus(user.nickname, 'inactive');

      res.json({ success: true });

      io.emit('userStatusUpdate', { nickname: user.nickname, state: 'inactive' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async handleCommand(req, res) {
    try {
      const { nickname, command, args } = req.body;

      switch (command) {
        case 'youtube':
          if (args.length > 0) {
            const youtubeLink = args[0];

            const message = {
              nickname,
              message: `¡${nickname} quiere compartir un enlace de YouTube! Enlace: ${youtubeLink}`,
              timestamp: new Date().toISOString(),
            };

            io.emit('commandReceived', { systemMessage: true, message });

            console.log('Mensaje enviado desde el servidor:', message);

            res.json({ success: true });
          } else {
            res.status(400).json({ error: 'Missing link in the /youtube command' });
          }
          break;

        default:
          res.status(400).json({ error: 'Invalid command' });
      }
    } catch (error) {
      console.error('Error al manejar el comando:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};




