ALTER TABLE vendors RENAME TO vendors;

ALTER TABLE vendor_transactions RENAME TO vendor_transactions;

ALTER TABLE products RENAME COLUMN vendor_id TO vendor_id;
ALTER TABLE inventory_batches RENAME COLUMN vendor_id TO vendor_id;
ALTER TABLE stock_movements RENAME COLUMN vendor_id TO vendor_id;
ALTER TABLE vendor_transactions RENAME COLUMN vendor_id TO vendor_id;

ALTER INDEX IF EXISTS idx_products_vendor_id RENAME TO idx_products_vendor_id;
ALTER INDEX IF EXISTS idx_inventory_batches_vendor_id RENAME TO idx_inventory_batches_vendor_id;
ALTER INDEX IF EXISTS idx_stock_movements_vendor_id RENAME TO idx_stock_movements_vendor_id;
ALTER INDEX IF EXISTS idx_vendor_transactions_vendor_id RENAME TO idx_vendor_transactions_vendor_id;