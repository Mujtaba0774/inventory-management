import { query } from '../config/db.js';

const batchSelect = `
  ib.id,
  ib.product_id,
  ib.vendor_id,
  ib.quantity,
  ib.unit_price,
  ib.batch_date,
  ib.created_at,
  ib.updated_at,
  p.name AS product_name,
  p.sku AS product_sku,
  v.name AS vendor_name
`;

export const getAllBatchesForProduct = async (productId) => {
  const result = await query(
    `SELECT ${batchSelect}
     FROM inventory_batches ib
     JOIN products p ON p.id = ib.product_id
    LEFT JOIN vendors v ON v.id = ib.vendor_id
     WHERE ib.product_id = $1 AND ib.quantity > 0
     ORDER BY ib.batch_date ASC, ib.created_at ASC`,
    [productId]
  );

  return result.rows;
};

export const getBatchById = async (batchId) => {
  const result = await query(
    `SELECT ${batchSelect}
     FROM inventory_batches ib
     JOIN products p ON p.id = ib.product_id
    LEFT JOIN vendors v ON v.id = ib.vendor_id
     WHERE ib.id = $1`,
    [batchId]
  );

  return result.rows[0] ?? null;
};

export const createBatch = async (batch) => {
  const result = await query(
    `INSERT INTO inventory_batches (product_id, vendor_id, quantity, unit_price, batch_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, product_id, vendor_id, quantity, unit_price, batch_date, created_at, updated_at`,
    [
      batch.product_id,
      batch.vendor_id ?? batch.vendor_id ?? null,
      batch.quantity,
      batch.unit_price,
      batch.batch_date ?? new Date(),
    ]
  );

  return result.rows[0] ?? null;
};

export const updateBatchQuantity = async (batchId, newQuantity) => {
  const result = await query(
    `UPDATE inventory_batches
     SET quantity = $1
     WHERE id = $2
     RETURNING id, product_id, vendor_id, quantity, unit_price, batch_date, created_at, updated_at`,
    [newQuantity, batchId]
  );

  return result.rows[0] ?? null;
};

export const deleteBatch = async (batchId) => {
  const result = await query(
    'DELETE FROM inventory_batches WHERE id = $1 RETURNING id',
    [batchId]
  );

  return (result.rowCount ?? 0) > 0;
};

export const getTotalBatchQuantityForProduct = async (productId) => {
  const result = await query(
    `SELECT COALESCE(SUM(quantity), 0) as total_quantity
     FROM inventory_batches
     WHERE product_id = $1`,
    [productId]
  );

  return Number(result.rows[0]?.total_quantity ?? 0);
};
