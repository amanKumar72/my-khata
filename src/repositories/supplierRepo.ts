import { Supplier } from '../types';
import { executeSql, selectAll, selectFirst } from '../db/database';
import { generateId } from './storeRepo';

export const supplierRepo = {
  async getAll(storeId: string): Promise<Supplier[]> {
    const sql = `
      SELECT s.*, 
             (SELECT MAX(created_at) FROM transactions WHERE party_id = s.id) as last_transaction_date
      FROM suppliers s
      WHERE s.store_id = ?
      ORDER BY s.name ASC;
    `;
    return selectAll<Supplier>(sql, [storeId]);
  },

  async getById(id: string): Promise<Supplier | null> {
    const sql = `
      SELECT s.*, 
             (SELECT MAX(created_at) FROM transactions WHERE party_id = s.id) as last_transaction_date
      FROM suppliers s
      WHERE s.id = ?;
    `;
    return selectFirst<Supplier>(sql, [id]);
  },

  async create(storeId: string, name: string, phone?: string, address?: string): Promise<Supplier> {
    const id = generateId();
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO suppliers (id, store_id, name, phone, address, balance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?);
    `;
    await executeSql(sql, [id, storeId, name, phone || null, address || null, now, now]);
    return {
      id,
      store_id: storeId,
      name,
      phone,
      address,
      balance: 0,
      created_at: now,
      updated_at: now,
    };
  },

  async update(id: string, name: string, phone?: string, address?: string): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE suppliers
      SET name = ?, phone = ?, address = ?, updated_at = ?
      WHERE id = ?;
    `;
    await executeSql(sql, [name, phone || null, address || null, now, id]);
  },

  async delete(id: string): Promise<void> {
    const supplier = await this.getById(id);
    if (supplier) {
      // Clean up auto-created expenses for this supplier
      await executeSql(`
        DELETE FROM expenses 
        WHERE (title LIKE ? OR title LIKE ? OR note LIKE ? OR category = ?)
           OR (title LIKE 'Credit Stock%' OR title LIKE 'Payment to%' OR title LIKE 'Stock Purchase%' OR title LIKE 'Payment Made%');
      `, [`%${supplier.name}%`, `%${supplier.phone || 'NON_EXISTENT'}%`, `%${supplier.name}%`, `Supplier Statement`]);
    }
    // Delete associated transactions
    await executeSql('DELETE FROM transactions WHERE party_id = ?;', [id]);
    const sql = 'DELETE FROM suppliers WHERE id = ?;';
    await executeSql(sql, [id]);
  },

  async search(storeId: string, query: string): Promise<Supplier[]> {
    const sql = `
      SELECT s.*, 
             (SELECT MAX(created_at) FROM transactions WHERE party_id = s.id) as last_transaction_date
      FROM suppliers s
      WHERE s.store_id = ? AND (s.name LIKE ? OR s.phone LIKE ?)
      ORDER BY s.name ASC;
    `;
    const searchParam = `%${query}%`;
    return selectAll<Supplier>(sql, [storeId, searchParam, searchParam]);
  },

  async recalculateBalance(supplierId: string): Promise<number> {
    // Sum of credits minus sum of debits
    const creditSql = "SELECT SUM(amount) as total FROM transactions WHERE party_id = ? AND type = 'credit';";
    const debitSql = "SELECT SUM(amount) as total FROM transactions WHERE party_id = ? AND type = 'debit';";
    
    const creditRes = await selectFirst<{ total: number }>(creditSql, [supplierId]);
    const debitRes = await selectFirst<{ total: number }>(debitSql, [supplierId]);
    
    const totalCredit = creditRes?.total || 0;
    const totalDebit = debitRes?.total || 0;
    const newBalance = totalCredit - totalDebit;
    
    const updateSql = 'UPDATE suppliers SET balance = ?, updated_at = ? WHERE id = ?;';
    await executeSql(updateSql, [newBalance, new Date().toISOString(), supplierId]);
    
    return newBalance;
  }
};
