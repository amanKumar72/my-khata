import { Expense, ExpenseType, Category } from '../types';
import { executeSql, selectAll, selectFirst } from '../db/database';
import { generateId } from './storeRepo';

export const expenseRepo = {
  async getAll(storeId: string): Promise<Expense[]> {
    const sql = 'SELECT * FROM expenses WHERE store_id = ? ORDER BY created_at DESC;';
    return selectAll<Expense>(sql, [storeId]);
  },

  async getByType(storeId: string, type: ExpenseType): Promise<Expense[]> {
    const sql = 'SELECT * FROM expenses WHERE store_id = ? AND type = ? ORDER BY created_at DESC;';
    return selectAll<Expense>(sql, [storeId, type]);
  },

  async getById(id: string): Promise<Expense | null> {
    const sql = 'SELECT * FROM expenses WHERE id = ?;';
    return selectFirst<Expense>(sql, [id]);
  },

  async create(
    storeId: string,
    category: string,
    title: string,
    amount: number,
    type: ExpenseType,
    note?: string,
    createdAt?: string
  ): Promise<Expense> {
    const id = generateId();
    const now = createdAt || new Date().toISOString();
    const sql = `
      INSERT INTO expenses (id, store_id, category, title, amount, note, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await executeSql(sql, [id, storeId, category, title, amount, note || null, type, now, now]);
    return {
      id,
      store_id: storeId,
      category,
      title,
      amount,
      note,
      type,
      created_at: now,
      updated_at: now,
    };
  },

  async update(
    id: string,
    category: string,
    title: string,
    amount: number,
    type: ExpenseType,
    note?: string,
    createdAt?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE expenses
      SET category = ?, title = ?, amount = ?, note = ?, type = ?, created_at = ?, updated_at = ?
      WHERE id = ?;
    `;
    await executeSql(sql, [category, title, amount, note || null, type, createdAt || now, now, id]);
  },

  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM expenses WHERE id = ?;';
    await executeSql(sql, [id]);
  },

  async getCategories(storeId: string, type: ExpenseType): Promise<Category[]> {
    const sql = 'SELECT * FROM categories WHERE store_id = ? AND type = ? ORDER BY name ASC;';
    return selectAll<Category>(sql, [storeId, type]);
  },

  async createCategory(storeId: string, name: string, type: ExpenseType): Promise<Category> {
    const id = generateId();
    const sql = 'INSERT INTO categories (id, store_id, name, type) VALUES (?, ?, ?, ?);';
    await executeSql(sql, [id, storeId, name, type]);
    return {
      id,
      store_id: storeId,
      name,
      type,
    };
  },

  async getCategoryTotals(storeId: string, type: ExpenseType, startDate: string, endDate: string): Promise<{ category: string, total: number }[]> {
    const sql = `
      SELECT category, SUM(amount) as total 
      FROM expenses 
      WHERE store_id = ? AND type = ? AND created_at >= ? AND created_at <= ?
      GROUP BY category
      ORDER BY total DESC;
    `;
    return selectAll<{ category: string, total: number }>(sql, [storeId, type, startDate, endDate]);
  }
};
