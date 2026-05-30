ALTER TABLE stock_movements
ADD COLUMN vendor_id UUID;

ALTER TABLE stock_movements
ADD CONSTRAINT fk_stock_movements_vendor
FOREIGN KEY (vendor_id)
REFERENCES vendors (id)
ON UPDATE CASCADE
ON DELETE SET NULL;

CREATE INDEX idx_stock_movements_vendor_id ON stock_movements (vendor_id);
