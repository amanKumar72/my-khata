import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (databaseInstance) {
    return databaseInstance;
  }
  
  try {
    const db = await SQLite.openDatabaseAsync('my_khata.db');
    await runMigrations(db);
    databaseInstance = db;
    return db;
  } catch (error) {
    console.error('Failed to open database or run migrations:', error);
    throw error;
  }
};

/**
 * Execute raw transactions securely
 */
export const executeSql = async (
  sql: string,
  params: any[] = []
): Promise<any> => {
  const db = await getDatabase();
  try {
    return await db.runAsync(sql, ...params);
  } catch (error) {
    console.error(`SQL execution error: ${sql}`, error);
    throw error;
  }
};

/**
 * Execute a query that returns multiple rows
 */
export const selectAll = async <T>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const db = await getDatabase();
  try {
    return await db.getAllAsync<T>(sql, ...params);
  } catch (error) {
    console.error(`SQL selectAll error: ${sql}`, error);
    throw error;
  }
};

/**
 * Execute a query that returns a single row
 */
export const selectFirst = async <T>(
  sql: string,
  params: any[] = []
): Promise<T | null> => {
  const db = await getDatabase();
  try {
    return await db.getFirstAsync<T>(sql, ...params);
  } catch (error) {
    console.error(`SQL selectFirst error: ${sql}`, error);
    throw error;
  }
};
