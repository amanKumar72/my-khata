import { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA } from './schema';

export const runMigrations = async (db: SQLiteDatabase): Promise<void> => {
  try {
    // Enable Foreign Keys support in SQLite
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Execute creation tables in sequence
    await db.execAsync(SCHEMA.createStoresTable);
    await db.execAsync(SCHEMA.createCustomersTable);
    await db.execAsync(SCHEMA.createSuppliersTable);
    await db.execAsync(SCHEMA.createTransactionsTable);
    await db.execAsync(SCHEMA.createExpensesTable);
    await db.execAsync(SCHEMA.createCategoriesTable);
    
    // Create indexes
    for (const indexSql of SCHEMA.createIndexes) {
      await db.execAsync(indexSql);
    }

    // Insert some default categories if they don't exist yet
    // Since categories are store-scoped, they will be seeded upon store creation.
    
    // Clean up any orphaned transactions where the customer/supplier was deleted
    await db.execAsync(`
      DELETE FROM transactions 
      WHERE (party_type = 'customer' AND party_id NOT IN (SELECT id FROM customers))
         OR (party_type = 'supplier' AND party_id NOT IN (SELECT id FROM suppliers));
    `);

    // Clean up any auto-created expenses for customer/supplier transactions
    await db.execAsync(`
      DELETE FROM expenses 
      WHERE title LIKE 'Credit Sale%' 
         OR title LIKE 'Payment from%' 
         OR title LIKE 'Credit Stock%' 
         OR title LIKE 'Payment to%' 
         OR title LIKE 'Payment Received%' 
         OR title LIKE 'Stock Purchase%' 
         OR title LIKE 'Payment Made%';
    `);
    
    console.log('Database migrations and cleanup completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
};
