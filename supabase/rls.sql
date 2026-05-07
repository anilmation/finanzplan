-- Run this in Supabase SQL Editor after prisma db push

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users: only own row
CREATE POLICY "users_own" ON users
  FOR ALL USING (id = auth.uid()::text);

-- Budget years: only own
CREATE POLICY "years_own" ON budget_years
  FOR ALL USING (user_id = auth.uid()::text);

-- Categories: only own
CREATE POLICY "categories_own" ON categories
  FOR ALL USING (user_id = auth.uid()::text);

-- Expenses: via budget year ownership
CREATE POLICY "expenses_own" ON expenses
  FOR ALL USING (
    year_id IN (
      SELECT id FROM budget_years WHERE user_id = auth.uid()::text
    )
  );

-- Incomes: via budget year ownership
CREATE POLICY "incomes_own" ON incomes
  FOR ALL USING (
    year_id IN (
      SELECT id FROM budget_years WHERE user_id = auth.uid()::text
    )
  );

-- Transactions: via budget year ownership
CREATE POLICY "transactions_own" ON transactions
  FOR ALL USING (
    year_id IN (
      SELECT id FROM budget_years WHERE user_id = auth.uid()::text
    )
  );

-- Default categories (optional seed)
-- INSERT INTO categories (id, user_id, name, color) VALUES ...
