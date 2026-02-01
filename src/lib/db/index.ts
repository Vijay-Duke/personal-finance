import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const databasePath = process.env.DATABASE_URL || './data/finance.db';

// Create SQLite connection
const sqlite = new Database(databasePath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance with schema for relational queries
export const db = drizzle(sqlite, { schema });

// Export types
export type Database = typeof db;
