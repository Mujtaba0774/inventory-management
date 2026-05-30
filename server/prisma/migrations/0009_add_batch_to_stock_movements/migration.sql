ALTER TABLE stock_movements
ADD COLUMN batch_id UUID,
ADD CONSTRAINT fk_stock_movements_batch FOREIGN KEY (batch_id)
  REFERENCES inventory_batches (id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

CREATE INDEX idx_stock_movements_batch_id ON stock_movements (batch_id);
