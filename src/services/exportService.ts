import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Customer, Supplier, Expense, Transaction } from '../types';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';

const PDF_STYLES = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 30px;
    font-size: 11px;
    line-height: 1.5;
  }
  .header {
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 15px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-left h1 {
    font-size: 22px;
    font-weight: 800;
    color: #4f46e5;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }
  .header-left p {
    margin: 0;
    color: #64748b;
    font-size: 10px;
    font-weight: 500;
  }
  .header-right {
    text-align: right;
  }
  .header-right h2 {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .header-right p {
    margin: 0;
    color: #64748b;
    font-size: 10px;
  }
  .meta-grid {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  .meta-card {
    flex: 1;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 16px;
  }
  .meta-card h3 {
    margin: 0 0 8px 0;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  .meta-card p {
    margin: 4px 0;
    font-size: 11px;
    color: #334155;
  }
  .meta-card p span {
    color: #64748b;
    font-weight: 500;
    display: inline-block;
    width: 90px;
  }
  .summary-row {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }
  .summary-card {
    flex: 1;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 14px;
    text-align: center;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
  }
  .summary-card.primary {
    border-top: 4px solid #4f46e5;
  }
  .summary-card.success {
    border-top: 4px solid #10b981;
  }
  .summary-card.danger {
    border-top: 4px solid #ef4444;
  }
  .summary-card.secondary {
    border-top: 4px solid #64748b;
  }
  .summary-card h4 {
    margin: 0 0 4px 0;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    font-weight: 600;
  }
  .summary-card .value {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
  }
  .summary-card.success .value {
    color: #10b981;
  }
  .summary-card.danger .value {
    color: #ef4444;
  }
  .table-container {
    margin-bottom: 24px;
  }
  .table-container h3 {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 10px 0;
    letter-spacing: -0.2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 700;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 10px;
    text-align: left;
    border-bottom: 2px solid #cbd5e1;
  }
  td {
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 10.5px;
    color: #334155;
    vertical-align: middle;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .badge.success {
    background-color: #d1fae5;
    color: #065f46;
  }
  .badge.danger {
    background-color: #fee2e2;
    color: #991b1b;
  }
  .badge.secondary {
    background-color: #f1f5f9;
    color: #475569;
  }
  .text-right {
    text-align: right;
  }
  .text-success {
    color: #10b981;
    font-weight: 600;
  }
  .text-danger {
    color: #ef4444;
    font-weight: 600;
  }
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    margin-top: 30px;
    text-align: center;
    color: #94a3b8;
    font-size: 9px;
  }
</style>
`;

const getHeaderHTML = (title: string, storeName: string) => `
  <div class="header">
    <div class="header-left">
      <h1>${storeName}</h1>
      <p>My Khata Premium Ledger Statements</p>
    </div>
    <div class="header-right">
      <h2>${title}</h2>
      <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
`;

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
   * Share generated PDF through system sharing
   */
  async sharePDF(htmlContent: string, filename: string): Promise<void> {
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const targetUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: targetUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${filename}`,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error(`Failed to export PDF statement: ${filename}`, error);
      throw error;
    }
  },

  /**
   * Export Customer Ledger Timeline to PDF
   */
  async exportCustomerLedgerToPDF(
    storeName: string,
    customer: Customer,
    transactions: Transaction[],
    currencySymbol: string = '₹'
  ): Promise<void> {
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningBalance = 0;
    const tableRows = sortedTxs.map((tx) => {
      const isCredit = tx.type === 'credit';
      if (isCredit) {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      return `
        <tr>
          <td>${formatDate(tx.created_at)}</td>
          <td>
            <span class="badge ${isCredit ? 'danger' : 'success'}">
              ${isCredit ? 'Credit Given' : 'Payment Recv'}
            </span>
          </td>
          <td>${tx.note || '<span style="color: #94a3b8; font-style: italic;">No notes</span>'}</td>
          <td class="text-right ${isCredit ? 'text-danger' : 'text-success'}">
            ${isCredit ? '+' : '-'}${formatCurrency(tx.amount, currencySymbol)}
          </td>
          <td class="text-right" style="font-weight: 600; color: #1e293b;">
            ${formatCurrency(runningBalance, currencySymbol)}
          </td>
        </tr>
      `;
    }).join('');

    const totalGiven = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalReceived = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const balanceStatus = customer.balance > 0 
      ? 'Customer owes you' 
      : customer.balance < 0 
      ? 'You owe customer' 
      : 'Settled';
    const statusClass = customer.balance > 0 ? 'danger' : customer.balance < 0 ? 'success' : 'secondary';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Customer Statement - ${customer.name}</title>
        ${PDF_STYLES}
      </head>
      <body>
        ${getHeaderHTML('Customer Ledger Statement', storeName)}
        
        <div class="meta-grid">
          <div class="meta-card">
            <h3>Customer Profile</h3>
            <p><span>Name:</span> <strong>${customer.name}</strong></p>
            ${customer.phone ? `<p><span>Phone:</span> ${customer.phone}</p>` : ''}
            ${customer.address ? `<p><span>Address:</span> ${customer.address}</p>` : ''}
          </div>
          <div class="meta-card">
            <h3>Ledger Summary</h3>
            <p><span>Total Credit:</span> <span class="text-danger">${formatCurrency(totalGiven, currencySymbol)}</span></p>
            <p><span>Total Paid:</span> <span class="text-success">${formatCurrency(totalReceived, currencySymbol)}</span></p>
            <p><span>Net Balance:</span> <strong>${formatCurrency(Math.abs(customer.balance), currencySymbol)}</strong> (${balanceStatus})</p>
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-card primary">
            <h4>Total Given</h4>
            <div class="value">${formatCurrency(totalGiven, currencySymbol)}</div>
          </div>
          <div class="summary-card success">
            <h4>Total Received</h4>
            <div class="value">${formatCurrency(totalReceived, currencySymbol)}</div>
          </div>
          <div class="summary-card ${statusClass}">
            <h4>Net Outstanding</h4>
            <div class="value">${formatCurrency(Math.abs(customer.balance), currencySymbol)}</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 3px; font-weight: bold; text-transform: uppercase;">
              ${balanceStatus}
            </div>
          </div>
        </div>

        <div class="table-container">
          <h3>Ledger Timeline</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Notes / Details</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">No ledger transactions recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>My Khata Premium Offline Ledger System • Secure, Automated & Verified Statements</p>
        </div>
      </body>
      </html>
    `;

    const filename = `${customer.name.replace(/\s+/g, '_')}_statement.pdf`;
    await this.sharePDF(htmlContent, filename);
  },

  /**
   * Export Supplier Ledger Timeline to PDF
   */
  async exportSupplierLedgerToPDF(
    storeName: string,
    supplier: Supplier,
    transactions: Transaction[],
    currencySymbol: string = '₹'
  ): Promise<void> {
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningBalance = 0;
    const tableRows = sortedTxs.map((tx) => {
      const isCredit = tx.type === 'credit';
      if (isCredit) {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      return `
        <tr>
          <td>${formatDate(tx.created_at)}</td>
          <td>
            <span class="badge ${isCredit ? 'danger' : 'success'}">
              ${isCredit ? 'Purchase Credit' : 'Payment Made'}
            </span>
          </td>
          <td>${tx.note || '<span style="color: #94a3b8; font-style: italic;">No notes</span>'}</td>
          <td class="text-right ${isCredit ? 'text-danger' : 'text-success'}">
            ${isCredit ? '+' : '-'}${formatCurrency(tx.amount, currencySymbol)}
          </td>
          <td class="text-right" style="font-weight: 600; color: #1e293b;">
            ${formatCurrency(runningBalance, currencySymbol)}
          </td>
        </tr>
      `;
    }).join('');

    const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalPaid = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const balanceStatus = supplier.balance > 0 
      ? 'You owe supplier' 
      : supplier.balance < 0 
      ? 'Supplier owes you' 
      : 'Settled';
    const statusClass = supplier.balance > 0 ? 'danger' : supplier.balance < 0 ? 'success' : 'secondary';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Supplier Statement - ${supplier.name}</title>
        ${PDF_STYLES}
      </head>
      <body>
        ${getHeaderHTML('Supplier Ledger Statement', storeName)}
        
        <div class="meta-grid">
          <div class="meta-card">
            <h3>Supplier Profile</h3>
            <p><span>Name:</span> <strong>${supplier.name}</strong></p>
            ${supplier.phone ? `<p><span>Phone:</span> ${supplier.phone}</p>` : ''}
            ${supplier.address ? `<p><span>Address:</span> ${supplier.address}</p>` : ''}
          </div>
          <div class="meta-card">
            <h3>Ledger Summary</h3>
            <p><span>Total Purchases:</span> <span class="text-danger">${formatCurrency(totalCredit, currencySymbol)}</span></p>
            <p><span>Total Paid:</span> <span class="text-success">${formatCurrency(totalPaid, currencySymbol)}</span></p>
            <p><span>Net Balance:</span> <strong>${formatCurrency(Math.abs(supplier.balance), currencySymbol)}</strong> (${balanceStatus})</p>
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-card primary">
            <h4>Total Purchases</h4>
            <div class="value">${formatCurrency(totalCredit, currencySymbol)}</div>
          </div>
          <div class="summary-card success">
            <h4>Total Paid</h4>
            <div class="value">${formatCurrency(totalPaid, currencySymbol)}</div>
          </div>
          <div class="summary-card ${statusClass}">
            <h4>Net Outstanding</h4>
            <div class="value">${formatCurrency(Math.abs(supplier.balance), currencySymbol)}</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 3px; font-weight: bold; text-transform: uppercase;">
              ${balanceStatus}
            </div>
          </div>
        </div>

        <div class="table-container">
          <h3>Ledger Timeline</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Notes / Details</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">No ledger transactions recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>My Khata Premium Offline Ledger System • Secure, Automated & Verified Statements</p>
        </div>
      </body>
      </html>
    `;

    const filename = `${supplier.name.replace(/\s+/g, '_')}_statement.pdf`;
    await this.sharePDF(htmlContent, filename);
  },

  /**
   * Export Expenses Cash Book flow report to PDF
   */
  async exportCashBookToPDF(
    storeName: string,
    expenses: Expense[],
    currencySymbol: string = '₹',
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    const sortedExpenses = [...expenses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Category aggregations
    const catMap: { [cat: string]: { income: number; expense: number; count: number } } = {};
    expenses.forEach((e) => {
      if (!catMap[e.category]) {
        catMap[e.category] = { income: 0, expense: 0, count: 0 };
      }
      catMap[e.category].count += 1;
      if (e.type === 'income') {
        catMap[e.category].income += e.amount;
      } else {
        catMap[e.category].expense += e.amount;
      }
    });

    const categoryRows = Object.keys(catMap).map((catName) => {
      const { income, expense, count } = catMap[catName];
      return `
        <tr>
          <td><strong>${catName}</strong></td>
          <td>${count} entries</td>
          <td class="text-success text-right">${formatCurrency(income, currencySymbol)}</td>
          <td class="text-danger text-right">${formatCurrency(expense, currencySymbol)}</td>
          <td class="text-right" style="font-weight: bold; color: ${income - expense >= 0 ? '#10b981' : '#ef4444'};">
            ${income - expense >= 0 ? '+' : ''}${formatCurrency(income - expense, currencySymbol)}
          </td>
        </tr>
      `;
    }).join('');

    const tableRows = sortedExpenses.map((e) => {
      const isIncome = e.type === 'income';
      return `
        <tr>
          <td>${formatDate(e.created_at)}</td>
          <td>
            <span class="badge ${isIncome ? 'success' : 'danger'}">
              ${isIncome ? 'Cash In' : 'Cash Out'}
            </span>
          </td>
          <td><strong>${e.title}</strong><br/><span style="font-size: 8.5px; color: #64748b;">Category: ${e.category}</span></td>
          <td>${e.note || '<span style="color: #94a3b8; font-style: italic;">No notes</span>'}</td>
          <td class="text-right ${isIncome ? 'text-success' : 'text-danger'}" style="font-weight: 600;">
            ${isIncome ? '+' : '-'}${formatCurrency(e.amount, currencySymbol)}
          </td>
        </tr>
      `;
    }).join('');

    const timeFrameLabel = startDate && endDate 
      ? `Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` 
      : 'Full Chronological History';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cash Book Statement</title>
        ${PDF_STYLES}
      </head>
      <body>
        ${getHeaderHTML('Cash Book Statement', storeName)}
        
        <div class="meta-grid">
          <div class="meta-card">
            <h3>Statement Range</h3>
            <p><span>Timeframe:</span> <strong>${timeFrameLabel}</strong></p>
            <p><span>Total Entries:</span> ${expenses.length} records</p>
          </div>
          <div class="meta-card">
            <h3>Cash Summary</h3>
            <p><span>Total Cash In:</span> <span class="text-success">${formatCurrency(totalIncome, currencySymbol)}</span></p>
            <p><span>Total Cash Out:</span> <span class="text-danger">${formatCurrency(totalExpense, currencySymbol)}</span></p>
            <p><span>Net Cash Flow:</span> <strong style="color: ${netBalance >= 0 ? '#10b981' : '#ef4444'};">${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, currencySymbol)}</strong></p>
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-card success">
            <h4>Total Cash In</h4>
            <div class="value">${formatCurrency(totalIncome, currencySymbol)}</div>
          </div>
          <div class="summary-card danger">
            <h4>Total Cash Out</h4>
            <div class="value">${formatCurrency(totalExpense, currencySymbol)}</div>
          </div>
          <div class="summary-card primary" style="border-top-color: ${netBalance >= 0 ? '#10b981' : '#ef4444'};">
            <h4>Net Book Balance</h4>
            <div class="value" style="color: ${netBalance >= 0 ? '#10b981' : '#ef4444'};">
              ${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, currencySymbol)}
            </div>
          </div>
        </div>

        <div class="table-container">
          <h3>Category Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Volume</th>
                <th class="text-right">Cash In</th>
                <th class="text-right">Cash Out</th>
                <th class="text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">No categories loaded.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="table-container">
          <h3>Transaction Records</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Notes</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">No records found.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>My Khata Premium Offline Ledger System • Secure, Automated & Verified Statements</p>
        </div>
      </body>
      </html>
    `;

    const filename = `Cashbook_Statement_${new Date().toISOString().substring(0, 10)}.pdf`;
    await this.sharePDF(htmlContent, filename);
  },

  /**
   * Export All Customers summary table to PDF
   */
  async exportAllCustomersToPDF(
    storeName: string,
    customers: Customer[],
    currencySymbol: string = '₹'
  ): Promise<void> {
    const activeDebits = customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0);
    const activeCredits = customers.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);
    const countOweUs = customers.filter(c => c.balance > 0).length;

    const tableRows = customers.map((c) => {
      const balanceVal = Math.abs(c.balance);
      const isOwed = c.balance > 0;
      const isOwe = c.balance < 0;
      const balanceText = isOwed 
        ? `<span class="text-danger">${formatCurrency(balanceVal, currencySymbol)} (Get)</span>`
        : isOwe 
        ? `<span class="text-success">${formatCurrency(balanceVal, currencySymbol)} (Give)</span>`
        : `<span style="color: #94a3b8;">${formatCurrency(0, currencySymbol)}</span>`;

      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.phone || '<span style="color: #94a3b8; font-style: italic;">No Phone</span>'}</td>
          <td>${c.address || '<span style="color: #94a3b8; font-style: italic;">No Address</span>'}</td>
          <td>${c.last_transaction_date ? formatDate(c.last_transaction_date).substring(0, 11) : 'No transactions'}</td>
          <td class="text-right" style="font-weight: 600;">${balanceText}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Customer Ledgers Summary</title>
        ${PDF_STYLES}
      </head>
      <body>
        ${getHeaderHTML('Customers Ledger Summary', storeName)}
        
        <div class="meta-grid">
          <div class="meta-card">
            <h3>Overview Metrics</h3>
            <p><span>Total Customers:</span> ${customers.length} profiles</p>
            <p><span>Accounts Owed:</span> ${countOweUs} customers owe you money</p>
          </div>
          <div class="meta-card">
            <h3>Accounts Receivables</h3>
            <p><span>You Will Get:</span> <strong class="text-danger">${formatCurrency(activeDebits, currencySymbol)}</strong></p>
            <p><span>You Will Give:</span> <strong class="text-success">${formatCurrency(activeCredits, currencySymbol)}</strong></p>
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-card danger">
            <h4>Total Outstanding (You will Get)</h4>
            <div class="value">${formatCurrency(activeDebits, currencySymbol)}</div>
          </div>
          <div class="summary-card success">
            <h4>Advance Payments (You will Give)</h4>
            <div class="value">${formatCurrency(activeCredits, currencySymbol)}</div>
          </div>
          <div class="summary-card primary">
            <h4>Total Profiles</h4>
            <div class="value">${customers.length}</div>
          </div>
        </div>

        <div class="table-container">
          <h3>Customer Ledgers</h3>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Last Active</th>
                <th class="text-right">Ledger Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">No customers registered.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>My Khata Premium Offline Ledger System • Secure, Automated & Verified Statements</p>
        </div>
      </body>
      </html>
    `;

    const filename = `Customers_Summary_${new Date().toISOString().substring(0, 10)}.pdf`;
    await this.sharePDF(htmlContent, filename);
  },

  /**
   * Export All Suppliers summary table to PDF
   */
  async exportAllSuppliersToPDF(
    storeName: string,
    suppliers: Supplier[],
    currencySymbol: string = '₹'
  ): Promise<void> {
    const activePayables = suppliers.filter(s => s.balance > 0).reduce((sum, s) => sum + s.balance, 0);
    const activeReceivables = suppliers.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);
    const countOweThem = suppliers.filter(s => s.balance > 0).length;

    const tableRows = suppliers.map((s) => {
      const balanceVal = Math.abs(s.balance);
      const isOwed = s.balance > 0;
      const isOwe = s.balance < 0;
      const balanceText = isOwed 
        ? `<span class="text-danger">${formatCurrency(balanceVal, currencySymbol)} (Give)</span>`
        : isOwe 
        ? `<span class="text-success">${formatCurrency(balanceVal, currencySymbol)} (Get)</span>`
        : `<span style="color: #94a3b8;">${formatCurrency(0, currencySymbol)}</span>`;

      return `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.phone || '<span style="color: #94a3b8; font-style: italic;">No Phone</span>'}</td>
          <td>${s.address || '<span style="color: #94a3b8; font-style: italic;">No Address</span>'}</td>
          <td>${s.last_transaction_date ? formatDate(s.last_transaction_date).substring(0, 11) : 'No transactions'}</td>
          <td class="text-right" style="font-weight: 600;">${balanceText}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Suppliers Summary Report</title>
        ${PDF_STYLES}
      </head>
      <body>
        ${getHeaderHTML('Suppliers Ledger Summary', storeName)}
        
        <div class="meta-grid">
          <div class="meta-card">
            <h3>Overview Metrics</h3>
            <p><span>Total Suppliers:</span> ${suppliers.length} profiles</p>
            <p><span>Accounts Owed:</span> ${countOweThem} suppliers you owe</p>
          </div>
          <div class="meta-card">
            <h3>Accounts Payables</h3>
            <p><span>You Will Give:</span> <strong class="text-danger">${formatCurrency(activePayables, currencySymbol)}</strong></p>
            <p><span>You Will Get:</span> <strong class="text-success">${formatCurrency(activeReceivables, currencySymbol)}</strong></p>
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-card danger">
            <h4>Total Outstanding (You will Give)</h4>
            <div class="value">${formatCurrency(activePayables, currencySymbol)}</div>
          </div>
          <div class="summary-card success">
            <h4>Advance Payments (You will Get)</h4>
            <div class="value">${formatCurrency(activeReceivables, currencySymbol)}</div>
          </div>
          <div class="summary-card primary">
            <h4>Total Profiles</h4>
            <div class="value">${suppliers.length}</div>
          </div>
        </div>

        <div class="table-container">
          <h3>Supplier Ledgers</h3>
          <table>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Last Active</th>
                <th class="text-right">Ledger Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">No suppliers registered.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>My Khata Premium Offline Ledger System • Secure, Automated & Verified Statements</p>
        </div>
      </body>
      </html>
    `;

    const filename = `Suppliers_Summary_${new Date().toISOString().substring(0, 10)}.pdf`;
    await this.sharePDF(htmlContent, filename);
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
