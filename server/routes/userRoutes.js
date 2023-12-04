import { Router } from 'express';
import { UserController } from '../controllers/user.js';
import { MessageController } from '../controllers/message.js';

export const usersRouter = Router();

usersRouter.get('/messages', MessageController.getMessages);
usersRouter.post('/messages', MessageController.postMessage);

usersRouter.post('/', UserController.register);
usersRouter.put('/:nickname/state', UserController.updateUserStatus);
usersRouter.post('/logout', UserController.logout);
usersRouter.post('/command', UserController.handleCommand);