import pool from '../../config/database.js'

export class UserModel {
  static async register({ input }) {
    try {
      const result = await pool.query(
        'INSERT INTO users (nickname, state) VALUES (?, ?);',
        [input.nickname, 'active']
      );

      const newUser = {
        id: result[0].insertId,
        ...input,
        state: 'active',
      };

      return newUser;
    } catch (error) {
      console.error('Error al crear un usuario:', error);
      throw error;
    }
  }

  static async getUserByNickname(nickname) {
    try {
      const [rows] = await pool.query(
        'SELECT id, nickname FROM users WHERE nickname = ?;',
        [nickname]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error al obtener el usuario por nickname:', error);
      throw error;
    }
  }

  static async updateUserStatus(nickname, state) {
    try {
      if (!['active', 'inactive'].includes(state)) {
        throw new Error('Invalid state value');
      }

      const result = await pool.query(
        'UPDATE users SET state = ? WHERE nickname = ?;',
        [state, nickname]
      );

      return result;
    } catch (error) {
      console.error('Error al actualizar el estado del usuario:', error);
      throw error;
    }
  }
}
