-- Drop the users table and remove the stock_movements attribution column.

ALTER TABLE IF EXISTS public.stock_movements
  DROP CONSTRAINT IF EXISTS fk_stock_movements_user;
ALTER TABLE IF EXISTS public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_user_id_fkey;
ALTER TABLE IF EXISTS public.stock_movements
  DROP COLUMN IF EXISTS user_id;

DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_stock_movements_user_id;
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
DROP TABLE IF EXISTS public.users;
