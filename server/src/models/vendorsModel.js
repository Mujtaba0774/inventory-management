import { createSimpleCrudModel } from './crudHelpers.js';
import { query } from '../config/db.js';

const vendorsCrud = createSimpleCrudModel({
  table: 'vendors',
  columns: ['name', 'email', 'phone', 'address'],
  selectColumns: 'id, name, email, phone, address, created_at, updated_at',
});

export const getAllVendors = vendorsCrud.getAll;
export const getVendorById = vendorsCrud.getById;
export const createVendor = vendorsCrud.create;
export const updateVendor = vendorsCrud.update;
export const deleteVendor = vendorsCrud.remove;

export const getVendorByName = async (name) => {
  const result = await query('SELECT id, name, email, phone, address, created_at, updated_at FROM vendors WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);
  return result.rows[0] ?? null;
};

export const ensureVendor = async (name) => {
  if (!name || String(name).trim() === '') {
    return null;
  }

  const existing = await getVendorByName(name);

  if (existing) {
    return existing;
  }

  return createVendor({ name: String(name).trim() });
};

// Transaction methods
export const addVendorTransaction = async (vendorId, transactionData) => {
  const { transaction_type, amount, description = null, notes = null, reference_no = null } = transactionData;

  const result = await query(
    `INSERT INTO vendor_transactions (vendor_id, transaction_type, amount, description, notes, reference_no)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, vendor_id, transaction_type, amount, description, notes, reference_no, transaction_date, created_at, updated_at`,
    [vendorId, transaction_type, amount, description, notes, reference_no]
  );

  return result.rows[0] ?? null;
};

export const getVendorTransactions = async (vendorId) => {
  const result = await query(
    `SELECT id, vendor_id, transaction_type, amount, description, notes, reference_no, transaction_date, created_at, updated_at
     FROM vendor_transactions
     WHERE vendor_id = $1
     ORDER BY transaction_date DESC`,
    [vendorId]
  );

  return result.rows;
};

export const getVendorBalance = async (vendorId) => {
  const result = await query(
    `SELECT 
       COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN amount ELSE 0 END), 0)::NUMERIC as total_purchased,
       COALESCE(SUM(CASE WHEN transaction_type = 'OUT' THEN amount ELSE 0 END), 0)::NUMERIC as total_paid,
       COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN amount ELSE -amount END), 0)::NUMERIC as remaining_amount
     FROM vendor_transactions
     WHERE vendor_id = $1`,
    [vendorId]
  );

  return result.rows[0] ?? { total_purchased: 0, total_paid: 0, remaining_amount: 0 };
};

export const deleteVendorTransaction = async (transactionId) => {
  const result = await query(
    'DELETE FROM vendor_transactions WHERE id = $1 RETURNING id',
    [transactionId]
  );

  return result.rows[0] ?? null;
};

export const deleteVendorTransactionByReference = async (referenceNo) => {
  if (!referenceNo) {
    return null;
  }

  const result = await query(
    'DELETE FROM vendor_transactions WHERE reference_no = $1 RETURNING id',
    [referenceNo]
  );

  return result.rows[0] ?? null;
};
