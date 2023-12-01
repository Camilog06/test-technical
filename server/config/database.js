import mysql from 'mysql2/promise';

const DEFAULT_CONFIG = {
  host: '127.0.0.1',
  user: 'root',
  port: 3306,
  password: '',
  database: 'testdb',
};

const pool = () => {
  const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG;

  try {
    const pool = mysql.createPool(connectionString);
    console.log(`Conexión a la base de datos establecida correctamente. URL: ${connectionString}`);
    return pool;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    throw error;
  }
};

export default pool();
