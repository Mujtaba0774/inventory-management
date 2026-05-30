CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  vendor_id UUID,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2) NOT NULL,
  batch_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_inventory_batches_product FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_batches_vendor FOREIGN KEY (vendor_id)
    REFERENCES vendors (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX idx_inventory_batches_product_id ON inventory_batches (product_id);
CREATE INDEX idx_inventory_batches_vendor_id ON inventory_batches (vendor_id);
CREATE INDEX idx_inventory_batches_batch_date ON inventory_batches (batch_date DESC);

CREATE TRIGGER trigger_inventory_batches_updated_at
BEFORE UPDATE ON inventory_batches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
