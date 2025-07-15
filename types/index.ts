export interface User {
  id: string;
  email: string;
  displayName: string;
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: Date;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Income {
  id: string;
  userId: string;
  source: string;
  amount: number;
  currency: string;
  date: Date;
  notes?: string;
  category?: string;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  currency: string;
  month: string; // YYYY-MM format
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  rollover?: boolean;
  alertThreshold?: number; // percentage (e.g., 80 for 80%)
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  id: string;
  email: string;
  displayName: string;
  status: 'pending' | 'accepted';
}

export interface Group {
  id: string;
  name: string;
  creatorId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Split {
  id: string;
  expenseId: string;
  creatorId: string;
  participants: {
    userId: string;
    amount: number;
    paid: boolean;
    settled: boolean;
  }[];
  type: 'equal' | 'amount' | 'percentage';
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  dueDate: Date;
  completed: boolean;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  amount: number;
  category: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  userId: string;
  budgetId: string;
  type: 'threshold' | 'exceeded' | 'rollover';
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface SpendingInsight {
  id: string;
  userId: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
}

export interface ExportData {
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
  dateRange: {
    from: Date;
    to: Date;
  };
  summary: {
    totalExpenses: number;
    totalIncome: number;
    netSavings: number;
    topCategories: { category: string; amount: number }[];
  };
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Business',
  'Groceries',
  'Gas & Fuel',
  'Insurance',
  'Rent & Mortgage',
  'Subscriptions',
  'Gifts & Donations',
  'Personal Care',
  'Home & Garden',
  'Sports & Fitness',
  'Technology',
  'Other'
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental',
  'Bonus',
  'Gift',
  'Refund',
  'Side Hustle',
  'Pension',
  'Social Security',
  'Unemployment',
  'Other'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
];

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const RECURRING_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];