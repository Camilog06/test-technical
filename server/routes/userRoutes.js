import { Router } from 'express';
import { UserController } from '../controllers/user.js';

export const usersRouter = Router();

usersRouter.post('/', UserController.register);
usersRouter.put('/:nickname/state', UserController.updateUserStatus);
usersRouter.post('/logout', UserController.logout);
usersRouter.post('/command', UserController.handleCommand);