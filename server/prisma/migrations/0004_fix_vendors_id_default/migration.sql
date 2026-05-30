-- Add DEFAULT for id column in vendors table
ALTER TABLE vendors ALTER COLUMN id SET DEFAULT gen_random_uuid();
