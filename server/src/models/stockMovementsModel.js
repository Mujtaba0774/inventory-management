import { getPool, query } from '../config/db.js';

const movementSelect = `
  sm.id,
  sm.product_id,
  sm.batch_id,
  sm.vendor_id,
  sm.movement_type,
  sm.quantity,
  sm.unit_price,
  sm.total_amount,
  sm.reason,
  sm.reference,
  sm.notes,
  sm.movement_date,
  sm.created_at,
  sm.updated_at,
  p.name AS product_name,
  p.sku AS product_sku,
  v.name AS vendor_name,
  ib.unit_price AS batch_unit_price,
  ib.batch_date AS batch_date
`;

const getMovementDelta = (movementType, quantity) => (movementType === 'in' ? quantity : -quantity);

const fetchMovementById = async (client, id) => {
  const result = await client.query(
    `SELECT id, product_id, batch_id, vendor_id, movement_type, quantity, unit_price, total_amount, reason, reference, notes, movement_date, created_at, updated_at
     FROM stock_movements
     WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

const adjustProductStock = async (client, productId, delta) => {
  const result = await client.query(
    'SELECT current_stock FROM products WHERE id = $1 FOR UPDATE',
    [productId],
  );

  const product = result.rows[0];
  if (!product) {
    throw new Error('Product not found');
  }

  const nextStock = product.current_stock + delta;

  if (nextStock < 0) {
    throw new Error('Insufficient stock for this movement');
  }

  await client.query(
    'UPDATE products SET current_stock = $1 WHERE id = $2',
    [nextStock, productId],
  );
};

export const getAllStockMovements = async () => {
  const result = await query(
    `SELECT ${movementSelect}
     FROM stock_movements sm
     LEFT JOIN products p ON p.id = sm.product_id
      LEFT JOIN vendors v ON v.id = sm.vendor_id
     LEFT JOIN inventory_batches ib ON ib.id = sm.batch_id
     ORDER BY sm.movement_date DESC, sm.created_at DESC`,
  );

  return result.rows;
};

export const getStockMovementById = async (id) => {
  const result = await query(
    `SELECT ${movementSelect}
     FROM stock_movements sm
     LEFT JOIN products p ON p.id = sm.product_id
     LEFT JOIN vendors v ON v.id = sm.vendor_id
     LEFT JOIN inventory_batches ib ON ib.id = sm.batch_id
     WHERE sm.id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

export const createStockMovement = async (movement) => {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const delta = getMovementDelta(movement.movement_type, movement.quantity);
    await adjustProductStock(client, movement.product_id, delta);

    const result = await client.query(
      `INSERT INTO stock_movements (
        product_id,
        batch_id,
        vendor_id,
        movement_type,
        quantity,
        unit_price,
        total_amount,
        reason,
        reference,
        notes,
        movement_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, NOW()))
      RETURNING id, product_id, batch_id, vendor_id, movement_type, quantity, unit_price, total_amount, reason, reference, notes, movement_date, created_at, updated_at`,
      [
        movement.product_id,
        movement.batch_id ?? null,
        movement.vendor_id ?? movement.vendor_id ?? null,
        movement.movement_type,
        movement.quantity,
        movement.unit_price ?? null,
        movement.total_amount ?? null,
        movement.reason,
        movement.reference ?? null,
        movement.notes ?? null,
        movement.movement_date ?? null,
      ],
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateStockMovement = async (id, updates) => {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const existing = await fetchMovementById(client, id);

    if (!existing) {
      await client.query('ROLLBACK');
      return null;
    }

    const nextMovement = {
      product_id: updates.product_id ?? existing.product_id,
      batch_id: updates.batch_id !== undefined ? updates.batch_id : existing.batch_id,
      vendor_id: updates.vendor_id !== undefined ? updates.vendor_id : (updates.vendor_id !== undefined ? updates.vendor_id : existing.vendor_id),
      movement_type: updates.movement_type ?? existing.movement_type,
      quantity: updates.quantity ?? existing.quantity,
      unit_price: updates.unit_price !== undefined ? updates.unit_price : existing.unit_price,
      total_amount: updates.total_amount !== undefined ? updates.total_amount : existing.total_amount,
      reason: updates.reason ?? existing.reason,
      reference: updates.reference !== undefined ? updates.reference : existing.reference,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      movement_date: updates.movement_date ?? existing.movement_date,
    };

    const oldDelta = getMovementDelta(existing.movement_type, existing.quantity);
    const newDelta = getMovementDelta(nextMovement.movement_type, nextMovement.quantity);

    if (existing.product_id === nextMovement.product_id) {
      await adjustProductStock(client, existing.product_id, -oldDelta + newDelta);
    } else {
      await adjustProductStock(client, existing.product_id, -oldDelta);
      await adjustProductStock(client, nextMovement.product_id, newDelta);
    }

    const result = await client.query(
      `UPDATE stock_movements
       SET product_id = $1,
           batch_id = $2,
           vendor_id = $3,
           movement_type = $4,
           quantity = $5,
           unit_price = $6,
           total_amount = $7,
           reason = $8,
           reference = $9,
           notes = $10,
           movement_date = $11
         WHERE id = $12
         RETURNING id, product_id, batch_id, vendor_id, movement_type, quantity, unit_price, total_amount, reason, reference, notes, movement_date, created_at, updated_at`,
      [
        nextMovement.product_id,
        nextMovement.batch_id,
        nextMovement.vendor_id,
        nextMovement.movement_type,
        nextMovement.quantity,
        nextMovement.unit_price,
        nextMovement.total_amount,
        nextMovement.reason,
        nextMovement.reference,
        nextMovement.notes,
        nextMovement.movement_date,
        id,
      ],
    );

    await client.query('COMMIT');
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteStockMovement = async (id) => {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const existing = await fetchMovementById(client, id);

    if (!existing) {
      await client.query('ROLLBACK');
      return false;
    }

    const delta = getMovementDelta(existing.movement_type, existing.quantity);
    await adjustProductStock(client, existing.product_id, -delta);

    const result = await client.query('DELETE FROM stock_movements WHERE id = $1', [id]);

    await client.query('COMMIT');
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
