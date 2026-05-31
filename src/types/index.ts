export interface Store {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number; // positive = customer owes us (receivable/credit), negative = we owe customer (payable/debit)
  created_at: string;
  updated_at: string;
  last_transaction_date?: string;
}

export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number; // positive = we owe supplier (payable/debit), negative = supplier owes us (receivable/credit)
  created_at: string;
  updated_at: string;
  last_transaction_date?: string;
}

export type PartyType = 'customer' | 'supplier';
export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  store_id: string;
  party_id: string;
  party_type: PartyType;
  type: TransactionType; // credit (gave) or debit (got)
  amount: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseType = 'income' | 'expense';

export interface Expense {
  id: string;
  store_id: string;
  category: string;
  title: string;
  amount: number;
  note?: string;
  type: ExpenseType;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  type: ExpenseType;
}

export interface AppSettings {
  selectedStoreId: string;
  theme: 'light' | 'dark';
  currency: string;
  firstLaunch: boolean;
}
