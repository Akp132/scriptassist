import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Migrations
import { CreateInitialSchema1710752400000 } from './migrations/1710752400000-CreateInitialSchema';
import { AddRefreshTokenTable1718400000000 } from './migrations/1718400000000-AddRefreshTokenTable';
import { AddTaskIndexes1718479200000 } from './migrations/1718479200000-AddTaskIndexes';

console.log('Connecting to DB:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  db: process.env.DB_DATABASE,
});

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'taskflow',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [
    CreateInitialSchema1710752400000,
    AddRefreshTokenTable1718400000000,
    AddTaskIndexes1718479200000,
  ],
  migrationsTableName: 'migrations',
  synchronize: false, // Important: never true in production
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
