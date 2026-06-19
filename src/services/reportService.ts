import { selectFirst, selectAll, executeSql } from '../db/database';
import { getStartAndEndDates } from '../utils/date';

export interface DashboardSummary {
  totalReceivable: number;
  customerCount: number;
  totalPayable: number;
  supplierCount: number;
  todayIncome: number;
  todayExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface PeriodicReport {
  income: number;
  expense: number;
  profit: number;
  receivable: number;
  payable: number;
  transactionsCount: number;
}

export const reportService = {
  /**
   * Generates summary data for the Main Dashboard
   */
  async getDashboardSummary(storeId: string): Promise<DashboardSummary> {
    // 0. Database self-healing: Clean up any orphaned transactions and auto-created expenses
    await executeSql(`
      DELETE FROM transactions 
      WHERE (party_type = 'customer' AND party_id NOT IN (SELECT id FROM customers))
         OR (party_type = 'supplier' AND party_id NOT IN (SELECT id FROM suppliers));
    `);

    await executeSql(`
      DELETE FROM expenses 
      WHERE title LIKE 'Credit Sale%' 
         OR title LIKE 'Payment from%' 
         OR title LIKE 'Credit Stock%' 
         OR title LIKE 'Payment to%' 
         OR title LIKE 'Payment Received%' 
         OR title LIKE 'Stock Purchase%' 
         OR title LIKE 'Payment Made%';
    `);

    // 1. Receivables: Sum of customer positive balances
    const receivableSql = 'SELECT SUM(balance) as total, COUNT(*) as count FROM customers WHERE store_id = ? AND balance > 0;';
    const recRes = await selectFirst<{ total: number; count: number }>(receivableSql, [storeId]);
    
    // 2. Payables: Sum of supplier positive balances (we owe them)
    const payableSql = 'SELECT SUM(balance) as total, COUNT(*) as count FROM suppliers WHERE store_id = ? AND balance > 0;';
    const payRes = await selectFirst<{ total: number; count: number }>(payableSql, [storeId]);

    // Total counts
    const totalCustomersSql = 'SELECT COUNT(*) as count FROM customers WHERE store_id = ?;';
    const custCountRes = await selectFirst<{ count: number }>(totalCustomersSql, [storeId]);

    const totalSuppliersSql = 'SELECT COUNT(*) as count FROM suppliers WHERE store_id = ?;';
    const suppCountRes = await selectFirst<{ count: number }>(totalSuppliersSql, [storeId]);

    // 3. Cashflow timespans
    const today = getStartAndEndDates('day');
    const month = getStartAndEndDates('month');

    // Today's Income / Expenses
    const todayIncomeSql = "SELECT SUM(amount) as total FROM expenses WHERE store_id = ? AND type = 'income' AND created_at BETWEEN ? AND ?;";
    const todayExpenseSql = "SELECT SUM(amount) as total FROM expenses WHERE store_id = ? AND type = 'expense' AND created_at BETWEEN ? AND ?;";

    const todayIncRes = await selectFirst<{ total: number }>(todayIncomeSql, [storeId, today.start.toISOString(), today.end.toISOString()]);
    const todayExpRes = await selectFirst<{ total: number }>(todayExpenseSql, [storeId, today.start.toISOString(), today.end.toISOString()]);

    // Monthly Income / Expenses
    const monthIncomeSql = "SELECT SUM(amount) as total FROM expenses WHERE store_id = ? AND type = 'income' AND created_at BETWEEN ? AND ?;";
    const monthExpenseSql = "SELECT SUM(amount) as total FROM expenses WHERE store_id = ? AND type = 'expense' AND created_at BETWEEN ? AND ?;";

    const monthIncRes = await selectFirst<{ total: number }>(monthIncomeSql, [storeId, month.start.toISOString(), month.end.toISOString()]);
    const monthExpRes = await selectFirst<{ total: number }>(monthExpenseSql, [storeId, month.start.toISOString(), month.end.toISOString()]);

    return {
      totalReceivable: recRes?.total || 0,
      customerCount: custCountRes?.count || 0,
      totalPayable: payRes?.total || 0,
      supplierCount: suppCountRes?.count || 0,
      todayIncome: todayIncRes?.total || 0,
      todayExpense: todayExpRes?.total || 0,
      monthlyIncome: monthIncRes?.total || 0,
      monthlyExpense: monthExpRes?.total || 0,
    };
  },

  /**
   * Generates periodic statement reports (Daily, Weekly, Monthly, Yearly)
   */
  async getPeriodicReport(
    storeId: string,
    period: 'day' | 'week' | 'month' | 'year' | 'all',
    refDate?: Date
  ): Promise<PeriodicReport> {
    // Database self-healing: Clean up any orphaned transactions and auto-created expenses
    await executeSql(`
      DELETE FROM transactions 
      WHERE (party_type = 'customer' AND party_id NOT IN (SELECT id FROM customers))
         OR (party_type = 'supplier' AND party_id NOT IN (SELECT id FROM suppliers));
    `);

    await executeSql(`
      DELETE FROM expenses 
      WHERE title LIKE 'Credit Sale%' 
         OR title LIKE 'Payment from%' 
         OR title LIKE 'Credit Stock%' 
         OR title LIKE 'Payment to%' 
         OR title LIKE 'Payment Received%' 
         OR title LIKE 'Stock Purchase%' 
         OR title LIKE 'Payment Made%';
    `);

    const dates = getStartAndEndDates(period, refDate);
    const startStr = dates.start.toISOString();
    const endStr = dates.end.toISOString();

    // 1. Calculate periodic Income and Expense
    const incomeSql = "SELECT SUM(amount) as total FROM expenses WHERE store_id = ? AND type = 'income' AND created_at BETWEEN ? AND ?;";
    const expenseSql = "SELECT SUM(amount) as total FROM expenses WHERE store_id = ? AND type = 'expense' AND created_at BETWEEN ? AND ?;";

    const incRes = await selectFirst<{ total: number }>(incomeSql, [storeId, startStr, endStr]);
    const expRes = await selectFirst<{ total: number }>(expenseSql, [storeId, startStr, endStr]);

    const income = incRes?.total || 0;
    const expense = expRes?.total || 0;
    const profit = income - expense;

    // 2. Aggregate active receivables/payables
    const recSql = 'SELECT SUM(balance) as total FROM customers WHERE store_id = ? AND balance > 0;';
    const paySql = 'SELECT SUM(balance) as total FROM suppliers WHERE store_id = ? AND balance > 0;';

    const recRes = await selectFirst<{ total: number }>(recSql, [storeId]);
    const payRes = await selectFirst<{ total: number }>(paySql, [storeId]);

    // 3. Transactions count in the period
    const txCountSql = 'SELECT COUNT(*) as count FROM transactions WHERE store_id = ? AND created_at BETWEEN ? AND ?;';
    const txCountRes = await selectFirst<{ count: number }>(txCountSql, [storeId, startStr, endStr]);

    return {
      income,
      expense,
      profit,
      receivable: recRes?.total || 0,
      payable: payRes?.total || 0,
      transactionsCount: txCountRes?.count || 0,
    };
  },

  /**
   * Get category-wise breakdowns for report charts
   */
  async getCategoryReport(
    storeId: string,
    type: 'income' | 'expense',
    period: 'day' | 'week' | 'month' | 'year' | 'all',
    refDate?: Date
  ): Promise<{ category: string; amount: number; percentage: number }[]> {
    const dates = getStartAndEndDates(period, refDate);
    const startStr = dates.start.toISOString();
    const endStr = dates.end.toISOString();

    const sql = `
      SELECT category, SUM(amount) as amount
      FROM expenses
      WHERE store_id = ? AND type = ? AND created_at BETWEEN ? AND ?
      GROUP BY category
      ORDER BY amount DESC;
    `;
    const rows = await selectAll<{ category: string; amount: number }>(sql, [storeId, type, startStr, endStr]);

    const totalSum = rows.reduce((sum, row) => sum + row.amount, 0);

    return rows.map(r => ({
      category: r.category,
      amount: r.amount,
      percentage: totalSum > 0 ? Math.round((r.amount / totalSum) * 100) : 0,
    }));
  }
};
