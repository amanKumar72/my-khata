export const SCHEMA = {
  createStoresTable: `
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  createCustomersTable: `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `,

  createSuppliersTable: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `,

  createTransactionsTable: `
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      party_id TEXT NOT NULL,
      party_type TEXT NOT NULL CHECK(party_type IN ('customer', 'supplier')),
      type TEXT NOT NULL CHECK(type IN ('credit', 'debit')),
      amount REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `,

  createExpensesTable: `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      type TEXT NOT NULL DEFAULT 'expense' CHECK(type IN ('income', 'expense')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `,

  createCategoriesTable: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `,
  
  // Triggers or indexes for faster retrieval
  createIndexes: [
    `CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);`,
    `CREATE INDEX IF NOT EXISTS idx_suppliers_store ON suppliers(store_id);`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_party ON transactions(party_id);`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_id);`,
    `CREATE INDEX IF NOT EXISTS idx_expenses_store ON expenses(store_id);`
  ]
};
