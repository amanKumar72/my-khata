import { Customer } from '../types';
import { executeSql, selectAll, selectFirst } from '../db/database';
import { generateId } from './storeRepo';

export const customerRepo = {
  async getAll(storeId: string): Promise<Customer[]> {
    const sql = `
      SELECT c.*, 
             (SELECT MAX(created_at) FROM transactions WHERE party_id = c.id) as last_transaction_date
      FROM customers c
      WHERE c.store_id = ?
      ORDER BY c.name ASC;
    `;
    return selectAll<Customer>(sql, [storeId]);
  },

  async getById(id: string): Promise<Customer | null> {
    const sql = `
      SELECT c.*, 
             (SELECT MAX(created_at) FROM transactions WHERE party_id = c.id) as last_transaction_date
      FROM customers c
      WHERE c.id = ?;
    `;
    return selectFirst<Customer>(sql, [id]);
  },

  async create(storeId: string, name: string, phone?: string, address?: string): Promise<Customer> {
    const id = generateId();
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO customers (id, store_id, name, phone, address, balance, created_at, updated_at)
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
      UPDATE customers
      SET name = ?, phone = ?, address = ?, updated_at = ?
      WHERE id = ?;
    `;
    await executeSql(sql, [name, phone || null, address || null, now, id]);
  },

  async delete(id: string): Promise<void> {
    const customer = await this.getById(id);
    if (customer) {
      // Clean up auto-created expenses for this customer
      await executeSql(`
        DELETE FROM expenses 
        WHERE (title LIKE ? OR title LIKE ? OR note LIKE ? OR category = ?)
           OR (title LIKE 'Credit Sale%' OR title LIKE 'Payment from%' OR title LIKE 'Payment Received%');
      `, [`%${customer.name}%`, `%${customer.phone || 'NON_EXISTENT'}%`, `%${customer.name}%`, `Customer Statement`]);
    }
    // Delete associated transactions
    await executeSql('DELETE FROM transactions WHERE party_id = ?;', [id]);
    const sql = 'DELETE FROM customers WHERE id = ?;';
    await executeSql(sql, [id]);
  },

  async search(storeId: string, query: string): Promise<Customer[]> {
    const sql = `
      SELECT c.*, 
             (SELECT MAX(created_at) FROM transactions WHERE party_id = c.id) as last_transaction_date
      FROM customers c
      WHERE c.store_id = ? AND (c.name LIKE ? OR c.phone LIKE ?)
      ORDER BY c.name ASC;
    `;
    const searchParam = `%${query}%`;
    return selectAll<Customer>(sql, [storeId, searchParam, searchParam]);
  },

  async recalculateBalance(customerId: string): Promise<number> {
    // Sum of credits minus sum of debits
    const creditSql = "SELECT SUM(amount) as total FROM transactions WHERE party_id = ? AND type = 'credit';";
    const debitSql = "SELECT SUM(amount) as total FROM transactions WHERE party_id = ? AND type = 'debit';";
    
    const creditRes = await selectFirst<{ total: number }>(creditSql, [customerId]);
    const debitRes = await selectFirst<{ total: number }>(debitSql, [customerId]);
    
    const totalCredit = creditRes?.total || 0;
    const totalDebit = debitRes?.total || 0;
    const newBalance = totalCredit - totalDebit;
    
    const updateSql = 'UPDATE customers SET balance = ?, updated_at = ? WHERE id = ?;';
    await executeSql(updateSql, [newBalance, new Date().toISOString(), customerId]);
    
    return newBalance;
  }
};
