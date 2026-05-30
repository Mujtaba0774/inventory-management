-- Create vendor_transactions table
CREATE TABLE vendor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('IN', 'OUT')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description VARCHAR(255),
  notes TEXT,
  reference_no VARCHAR(120),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX idx_vendor_transactions_vendor_id ON vendor_transactions(vendor_id);
CREATE INDEX idx_vendor_transactions_type ON vendor_transactions(transaction_type);
CREATE INDEX idx_vendor_transactions_date ON vendor_transactions(transaction_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_vendor_transactions
BEFORE UPDATE ON vendor_transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
