import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'app',
  password: process.env.DB_PASSWORD ?? 'change-me',
  database: process.env.DB_DATABASE ?? 'app_db',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
