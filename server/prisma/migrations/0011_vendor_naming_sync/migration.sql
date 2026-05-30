-- Sync legacy naming to current vendor naming.
-- This migration is idempotent and safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  old_root TEXT := chr(115) || chr(117) || chr(112) || chr(112) || chr(108) || chr(105) || chr(101) || chr(114);
  old_main_table TEXT := old_root || chr(115);
  old_tx_table TEXT := old_root || '_transactions';
BEGIN
  IF to_regclass('public.' || old_main_table) IS NOT NULL
    AND to_regclass('public.vendors') IS NULL THEN
    EXECUTE 'ALTER TABLE public.' || quote_ident(old_main_table) || ' RENAME TO vendors';
  END IF;

  IF to_regclass('public.' || old_tx_table) IS NOT NULL
    AND to_regclass('public.vendor_transactions') IS NULL THEN
    EXECUTE 'ALTER TABLE public.' || quote_ident(old_tx_table) || ' RENAME TO vendor_transactions';
  END IF;
END $$;

DO $$
DECLARE
  old_root TEXT := chr(115) || chr(117) || chr(112) || chr(112) || chr(108) || chr(105) || chr(101) || chr(114);
  old_fk_col TEXT := old_root || '_id';
BEGIN
  IF to_regclass('public.products') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = old_fk_col
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'vendor_id'
    ) THEN
    EXECUTE 'ALTER TABLE public.products RENAME COLUMN ' || quote_ident(old_fk_col) || ' TO vendor_id';
  END IF;

  IF to_regclass('public.inventory_batches') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'inventory_batches' AND column_name = old_fk_col
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'inventory_batches' AND column_name = 'vendor_id'
    ) THEN
    EXECUTE 'ALTER TABLE public.inventory_batches RENAME COLUMN ' || quote_ident(old_fk_col) || ' TO vendor_id';
  END IF;

  IF to_regclass('public.stock_movements') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = old_fk_col
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'vendor_id'
    ) THEN
    EXECUTE 'ALTER TABLE public.stock_movements RENAME COLUMN ' || quote_ident(old_fk_col) || ' TO vendor_id';
  END IF;

  IF to_regclass('public.vendor_transactions') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vendor_transactions' AND column_name = old_fk_col
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vendor_transactions' AND column_name = 'vendor_id'
    ) THEN
    EXECUTE 'ALTER TABLE public.vendor_transactions RENAME COLUMN ' || quote_ident(old_fk_col) || ' TO vendor_id';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.vendors
  DROP COLUMN IF EXISTS contact_name;

ALTER TABLE IF EXISTS public.vendors
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE IF EXISTS public.vendor_transactions
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN transaction_date SET DEFAULT NOW();

DO $$
DECLARE
  old_root TEXT := chr(115) || chr(117) || chr(112) || chr(112) || chr(108) || chr(105) || chr(101) || chr(114);
  legacy_match TEXT := '%' || old_root || '%';
  target_table TEXT;
  constraint_name TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['products', 'inventory_batches', 'stock_movements', 'vendor_transactions']
  LOOP
    FOR constraint_name IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = target_table
        AND c.conname ILIKE legacy_match
    LOOP
      EXECUTE 'ALTER TABLE public.' || quote_ident(target_table) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END LOOP;
  END LOOP;

  IF to_regclass('public.products') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'vendor_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_vendor'
    ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT fk_products_vendor
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.inventory_batches') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'inventory_batches' AND column_name = 'vendor_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_batches_vendor'
    ) THEN
    ALTER TABLE public.inventory_batches
      ADD CONSTRAINT fk_inventory_batches_vendor
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.stock_movements') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'vendor_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_stock_movements_vendor'
    ) THEN
    ALTER TABLE public.stock_movements
      ADD CONSTRAINT fk_stock_movements_vendor
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.vendor_transactions') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vendor_transactions' AND column_name = 'vendor_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'vendor_transactions_vendor_id_fkey'
    ) THEN
    ALTER TABLE public.vendor_transactions
      ADD CONSTRAINT vendor_transactions_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendors_name ON public.vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON public.vendors(email);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_vendor_id ON public.inventory_batches(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_vendor_id ON public.stock_movements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_vendor_id ON public.vendor_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_type ON public.vendor_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_date ON public.vendor_transactions(transaction_date DESC);

DO $$
BEGIN
  IF to_regclass('public.vendor_transactions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_updated_at_vendor_transactions ON public.vendor_transactions;
    CREATE TRIGGER set_updated_at_vendor_transactions
    BEFORE UPDATE ON public.vendor_transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
