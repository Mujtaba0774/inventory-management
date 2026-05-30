-- Ensure UUID and timestamp defaults are set for key tables
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE categories ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE categories ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE products ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE vendors ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE vendors ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE vendors ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE stock_movements ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE stock_movements ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE stock_movements ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE vendor_transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE vendor_transactions ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE vendor_transactions ALTER COLUMN updated_at SET DEFAULT NOW();
