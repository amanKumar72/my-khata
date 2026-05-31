import { Transaction, PartyType, TransactionType } from '../types';
import { executeSql, selectAll, selectFirst } from '../db/database';
import { generateId } from './storeRepo';
import { customerRepo } from './customerRepo';
import { supplierRepo } from './supplierRepo';

export const transactionRepo = {
  async getAll(storeId: string): Promise<Transaction[]> {
    const sql = 'SELECT * FROM transactions WHERE store_id = ? ORDER BY created_at DESC;';
    return selectAll<Transaction>(sql, [storeId]);
  },

  async getByPartyId(partyId: string): Promise<Transaction[]> {
    const sql = 'SELECT * FROM transactions WHERE party_id = ? ORDER BY created_at DESC;';
    return selectAll<Transaction>(sql, [partyId]);
  },

  async getById(id: string): Promise<Transaction | null> {
    const sql = 'SELECT * FROM transactions WHERE id = ?;';
    return selectFirst<Transaction>(sql, [id]);
  },

  async create(
    storeId: string,
    partyId: string,
    partyType: PartyType,
    type: TransactionType,
    amount: number,
    note?: string,
    createdAt?: string
  ): Promise<Transaction> {
    const id = generateId();
    const now = createdAt || new Date().toISOString();
    const sql = `
      INSERT INTO transactions (id, store_id, party_id, party_type, type, amount, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await executeSql(sql, [id, storeId, partyId, partyType, type, amount, note || null, now, now]);

    // Recalculate and update party balance
    if (partyType === 'customer') {
      await customerRepo.recalculateBalance(partyId);
    } else {
      await supplierRepo.recalculateBalance(partyId);
    }

    return {
      id,
      store_id: storeId,
      party_id: partyId,
      party_type: partyType,
      type,
      amount,
      note,
      created_at: now,
      updated_at: now,
    };
  },

  async update(
    id: string,
    amount: number,
    note?: string,
    type?: TransactionType,
    createdAt?: string
  ): Promise<void> {
    const tx = await this.getById(id);
    if (!tx) throw new Error('Transaction not found');

    const now = new Date().toISOString();
    const dateToUse = createdAt || tx.created_at;
    const typeToUse = type || tx.type;

    const sql = `
      UPDATE transactions
      SET amount = ?, note = ?, type = ?, created_at = ?, updated_at = ?
      WHERE id = ?;
    `;
    await executeSql(sql, [amount, note || null, typeToUse, dateToUse, now, id]);

    // Recalculate balance for the party
    if (tx.party_type === 'customer') {
      await customerRepo.recalculateBalance(tx.party_id);
    } else {
      await supplierRepo.recalculateBalance(tx.party_id);
    }
  },

  async delete(id: string): Promise<void> {
    const tx = await this.getById(id);
    if (!tx) return;

    const sql = 'DELETE FROM transactions WHERE id = ?;';
    await executeSql(sql, [id]);

    // Recalculate balance for the party
    if (tx.party_type === 'customer') {
      await customerRepo.recalculateBalance(tx.party_id);
    } else {
      await supplierRepo.recalculateBalance(tx.party_id);
    }
  },

  async search(storeId: string, query: string): Promise<Transaction[]> {
    const sql = `
      SELECT t.* 
      FROM transactions t
      WHERE t.store_id = ? AND (t.note LIKE ? OR CAST(t.amount AS TEXT) LIKE ?)
      ORDER BY t.created_at DESC;
    `;
    const searchParam = `%${query}%`;
    return selectAll<Transaction>(sql, [storeId, searchParam, searchParam]);
  }
};
