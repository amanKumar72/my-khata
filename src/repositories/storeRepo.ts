import { Store } from '../types';
import { executeSql, selectAll, selectFirst } from '../db/database';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const storeRepo = {
  async getAll(): Promise<Store[]> {
    const sql = 'SELECT * FROM stores ORDER BY name ASC;';
    return selectAll<Store>(sql);
  },

  async getById(id: string): Promise<Store | null> {
    const sql = 'SELECT * FROM stores WHERE id = ?;';
    return selectFirst<Store>(sql, [id]);
  },

  async create(name: string, phone?: string, address?: string): Promise<Store> {
    const id = generateId();
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO stores (id, name, phone, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    await executeSql(sql, [id, name, phone || null, address || null, now, now]);
    
    // Seed default categories for this store
    await this.seedDefaultCategories(id);

    return {
      id,
      name,
      phone,
      address,
      created_at: now,
      updated_at: now,
    };
  },

  async update(id: string, name: string, phone?: string, address?: string): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE stores
      SET name = ?, phone = ?, address = ?, updated_at = ?
      WHERE id = ?;
    `;
    await executeSql(sql, [name, phone || null, address || null, now, id]);
  },

  async delete(id: string): Promise<void> {
    // Delete store - SQLite handles cascade deletion of customers, suppliers, transactions, expenses
    const sql = 'DELETE FROM stores WHERE id = ?;';
    await executeSql(sql, [id]);
  },

  async seedDefaultCategories(storeId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Rent', type: 'expense' },
      { name: 'Salary', type: 'expense' },
      { name: 'Electricity', type: 'expense' },
      { name: 'Transport', type: 'expense' },
      { name: 'Internet', type: 'expense' },
      { name: 'Miscellaneous', type: 'expense' },
      { name: 'Sales', type: 'income' },
      { name: 'Services', type: 'income' },
      { name: 'Commission', type: 'income' },
      { name: 'Other Income', type: 'income' },
    ];

    for (const cat of defaultCategories) {
      const id = generateId();
      const sql = 'INSERT OR IGNORE INTO categories (id, store_id, name, type) VALUES (?, ?, ?, ?);';
      await executeSql(sql, [id, storeId, cat.name, cat.type]);
    }
  }
};
