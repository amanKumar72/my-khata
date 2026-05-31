import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Customer, Supplier, Expense, Transaction } from '../types';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';

export const exportService = {
  /**
   * Share a text ledger statement for a customer or supplier
   */
  async shareLedgerStatement(
    name: string,
    partyType: 'Customer' | 'Supplier',
    transactions: Transaction[],
    balance: number,
    currencySymbol: string = '₹'
  ): Promise<void> {
    try {
      let content = `========================================\n`;
      content += `LEDGER STATEMENT: ${partyType.toUpperCase()}\n`;
      content += `Name: ${name}\n`;
      content += `Date Generated: ${new Date().toLocaleDateString()}\n`;
      content += `========================================\n\n`;
      
      content += `Date        Type      Amount      Note\n`;
      content += `----------------------------------------\n`;
      
      // Sort chronologically (oldest first)
      const sortedTxs = [...transactions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      for (const tx of sortedTxs) {
        const dateStr = formatDate(tx.created_at).substring(0, 11).padEnd(12);
        const typeStr = (tx.type === 'credit' ? 'Credit' : 'Debit').padEnd(10);
        const amountStr = formatCurrency(tx.amount, currencySymbol).padEnd(12);
        const noteStr = tx.note || '';
        content += `${dateStr}${typeStr}${amountStr}${noteStr}\n`;
      }
      
      content += `----------------------------------------\n`;
      content += `Net Balance: ${formatCurrency(balance, currencySymbol)}\n`;
      content += `(${balance > 0 ? `${partyType} owes you` : balance < 0 ? `You owe ${partyType}` : 'Settled'})\n`;
      content += `========================================\n`;
      content += `Generated using My Khata`;

      const filename = `${name.replace(/\s+/g, '_')}_statement.txt`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: `Share ${name}'s Ledger Statement`,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export ledger statement:', error);
      throw error;
    }
  },

  /**
   * Export database tables to CSV format and share
   */
  async exportCustomersToCSV(customers: Customer[], currencySymbol: string = '₹'): Promise<void> {
    let csv = 'ID,Name,Phone,Address,Balance,Last Transaction Date,Created At\n';
    for (const c of customers) {
      csv += `"${c.id}","${c.name}","${c.phone || ''}","${c.address || ''}",${c.balance},"${c.last_transaction_date || ''}","${c.created_at}"\n`;
    }
    await this.shareCSV(csv, 'customers_export.csv');
  },

  async exportSuppliersToCSV(suppliers: Supplier[], currencySymbol: string = '₹'): Promise<void> {
    let csv = 'ID,Name,Phone,Address,Balance,Last Transaction Date,Created At\n';
    for (const s of suppliers) {
      csv += `"${s.id}","${s.name}","${s.phone || ''}","${s.address || ''}",${s.balance},"${s.last_transaction_date || ''}","${s.created_at}"\n`;
    }
    await this.shareCSV(csv, 'suppliers_export.csv');
  },

  async exportExpensesToCSV(expenses: Expense[]): Promise<void> {
    let csv = 'ID,Title,Category,Amount,Type,Note,Created At\n';
    for (const e of expenses) {
      csv += `"${e.id}","${e.title}","${e.category}",${e.amount},"${e.type}","${e.note || ''}","${e.created_at}"\n`;
    }
    await this.shareCSV(csv, 'expenses_export.csv');
  },

  async exportTransactionsToCSV(transactions: Transaction[]): Promise<void> {
    let csv = 'ID,Party ID,Party Type,Type,Amount,Note,Created At\n';
    for (const t of transactions) {
      csv += `"${t.id}","${t.party_id}","${t.party_type}","${t.type}",${t.amount},"${t.note || ''}","${t.created_at}"\n`;
    }
    await this.shareCSV(csv, 'ledger_transactions_export.csv');
  },

  async shareCSV(csvContent: string, filename: string): Promise<void> {
    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Share ${filename}`,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error(`Failed to export CSV: ${filename}`, error);
      throw error;
    }
  }
};
