import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Store, Customer, Supplier, Transaction, Expense, Category } from '../types';
import { executeSql, selectAll } from '../db/database';

interface BackupData {
  version: number;
  timestamp: string;
  stores: Store[];
  customers: Customer[];
  suppliers: Supplier[];
  transactions: Transaction[];
  expenses: Expense[];
  categories: Category[];
}

const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;

export const backupService = {
  /**
   * Helper to ensure backup directory exists
   */
  async ensureDirectoryExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }
  },

  /**
   * Generates a complete JSON backup and returns the parsed BackupData object
   */
  async generateBackupData(): Promise<BackupData> {
    const stores = await selectAll<Store>('SELECT * FROM stores;');
    const customers = await selectAll<Customer>('SELECT * FROM customers;');
    const suppliers = await selectAll<Supplier>('SELECT * FROM suppliers;');
    const transactions = await selectAll<Transaction>('SELECT * FROM transactions;');
    const expenses = await selectAll<Expense>('SELECT * FROM expenses;');
    const categories = await selectAll<Category>('SELECT * FROM categories;');

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      stores,
      customers,
      suppliers,
      transactions,
      expenses,
      categories,
    };
  },

  /**
   * Create and share a backup JSON file
   */
  async createBackup(): Promise<string> {
    try {
      await this.ensureDirectoryExists();
      const backupData = await this.generateBackupData();
      const backupString = JSON.stringify(backupData, null, 2);

      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `my_khata_backup_${timestampStr}.json`;
      const fileUri = `${BACKUP_DIR}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, backupString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Share My Khata Backup',
        });
      }

      return filename;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  },

  /**
   * Copy the raw backup JSON to the clipboard
   */
  async copyBackupToClipboard(): Promise<void> {
    const backupData = await this.generateBackupData();
    const backupString = JSON.stringify(backupData);
    await Clipboard.setStringAsync(backupString);
  },

  /**
   * Get a list of local backups saved in the documents directory
   */
  async listLocalBackups(): Promise<string[]> {
    try {
      await this.ensureDirectoryExists();
      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
      return files.filter(f => f.endsWith('.json')).sort().reverse(); // Newest first
    } catch {
      return [];
    }
  },

  /**
   * Delete a backup file
   */
  async deleteBackupFile(filename: string): Promise<void> {
    try {
      const fileUri = `${BACKUP_DIR}${filename}`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (e) {
      console.error('Failed to delete backup file:', e);
    }
  },

  /**
   * Restore database state from a backup file or paste string
   */
  async restoreBackup(backupJsonOrFilename: string, isRawJsonString = false): Promise<void> {
    try {
      let backupContent = '';

      if (isRawJsonString) {
        backupContent = backupJsonOrFilename;
      } else {
        const fileUri = `${BACKUP_DIR}${backupJsonOrFilename}`;
        backupContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      const backup: BackupData = JSON.parse(backupContent);

      if (!backup.version || !backup.stores || !backup.customers || !backup.suppliers) {
        throw new Error('Invalid backup file structure');
      }

      // Restoring in correct database order with foreign key safety (temporary turning off constraints to reload cleanly)
      await executeSql('PRAGMA foreign_keys = OFF;');
      
      // Clear all existing data
      await executeSql('DELETE FROM transactions;');
      await executeSql('DELETE FROM expenses;');
      await executeSql('DELETE FROM categories;');
      await executeSql('DELETE FROM customers;');
      await executeSql('DELETE FROM suppliers;');
      await executeSql('DELETE FROM stores;');

      // Insert Stores
      for (const s of backup.stores) {
        await executeSql(
          'INSERT INTO stores (id, name, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
          [s.id, s.name, s.phone || null, s.address || null, s.created_at, s.updated_at]
        );
      }

      // Insert Customers
      for (const c of backup.customers) {
        await executeSql(
          'INSERT INTO customers (id, store_id, name, phone, address, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [c.id, c.store_id, c.name, c.phone || null, c.address || null, c.balance, c.created_at, c.updated_at]
        );
      }

      // Insert Suppliers
      for (const s of backup.suppliers) {
        await executeSql(
          'INSERT INTO suppliers (id, store_id, name, phone, address, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [s.id, s.store_id, s.name, s.phone || null, s.address || null, s.balance, s.created_at, s.updated_at]
        );
      }

      // Insert Transactions
      for (const t of backup.transactions) {
        await executeSql(
          'INSERT INTO transactions (id, store_id, party_id, party_type, type, amount, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [t.id, t.store_id, t.party_id, t.party_type, t.type, t.amount, t.note || null, t.created_at, t.updated_at]
        );
      }

      // Insert Expenses
      for (const e of backup.expenses) {
        await executeSql(
          'INSERT INTO expenses (id, store_id, category, title, amount, note, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [e.id, e.store_id, e.category, e.title, e.amount, e.note || null, e.type, e.created_at, e.updated_at]
        );
      }

      // Insert Categories
      if (backup.categories) {
        for (const cat of backup.categories) {
          await executeSql(
            'INSERT OR IGNORE INTO categories (id, store_id, name, type) VALUES (?, ?, ?, ?);',
            [cat.id, cat.store_id, cat.name, cat.type]
          );
        }
      }

      // Re-enable Foreign Keys
      await executeSql('PRAGMA foreign_keys = ON;');
      
      console.log('Database restore completed successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }
};
