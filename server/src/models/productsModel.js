import { query } from '../config/db.js';
import { ensureCategory } from './categoriesModel.js';
import { ensureVendor } from './vendorsModel.js';

const productSelect = `
  p.id,
  p.sku,
  p.name,
  p.description,
  p.unit_cost,
  p.unit_price,
  p.current_stock,
  p.reorder_level,
  p.is_active,
  p.created_at,
  p.updated_at,
  c.id AS category_id,
  c.name AS category,
  v.id AS vendor_id,
  v.name AS vendor
`;

const mapProduct = (row) => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  description: row.description,
  category_id: row.category_id,
  category: row.category,
  vendor_id: row.vendor_id,
  vendor: row.vendor,
  vendor_id: row.vendor_id,
  vendor: row.vendor,
  stock: Number(row.current_stock),
  minStock: Number(row.reorder_level),
  price: Number(row.unit_price),
  cost: Number(row.unit_cost),
  is_active: row.is_active,
  dateAdded: new Date(row.created_at).toISOString().split('T')[0],
  lastUpdated: new Date(row.updated_at).toISOString().split('T')[0],
});

const getProductRowById = async (id) => {
  const result = await query(
    `SELECT ${productSelect}
     FROM products p
     JOIN categories c ON c.id = p.category_id
    LEFT JOIN vendors v ON v.id = p.vendor_id
     WHERE p.id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

const resolveCategoryId = async (payload) => {
  if (payload.category_id) {
    return payload.category_id;
  }

  if (payload.category) {
    const category = await ensureCategory(payload.category);
    return category.id;
  }

  return null;
};

const resolveVendorId = async (payload) => {
  if (payload.vendor_id) {
    return payload.vendor_id;
  }

  if (payload.vendor_id) {
    return payload.vendor_id;
  }

  if (payload.vendor) {
    const vendor = await ensureVendor(payload.vendor);
    return vendor?.id ?? null;
  }

  if (payload.vendor) {
    const vendor = await ensureVendor(payload.vendor);
    return vendor?.id ?? null;
  }

  return null;
};

export const getAllProducts = async () => {
  const result = await query(
    `SELECT ${productSelect}
     FROM products p
     JOIN categories c ON c.id = p.category_id
      LEFT JOIN vendors v ON v.id = p.vendor_id
     ORDER BY p.created_at DESC, p.id DESC`,
  );

  return result.rows.map(mapProduct);
};

export const getProductById = async (id) => {
  const row = await getProductRowById(id);
  return row ? mapProduct(row) : null;
};

export const createProduct = async (product) => {
  const categoryId = await resolveCategoryId(product);
  const vendorId = await resolveVendorId(product);

  if (!categoryId) {
    throw new Error('category is required');
  }

  const result = await query(
    `INSERT INTO products (
      category_id,
      vendor_id,
      sku,
      name,
      description,
      unit_cost,
      unit_price,
      current_stock,
      reorder_level,
      is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id`,
    [
      categoryId,
      vendorId,
      product.sku,
      product.name,
      product.description ?? null,
      product.unit_cost,
      product.unit_price,
      product.current_stock,
      product.reorder_level,
      product.is_active ?? true,
    ],
  );

  return getProductById(result.rows[0].id);
};

export const updateProduct = async (id, updates) => {
  const existing = await getProductRowById(id);

  if (!existing) {
    return null;
  }

  const nextPayload = {
    category_id: updates.category_id ?? existing.category_id,
    vendor_id: updates.vendor_id ?? updates.vendor_id ?? existing.vendor_id,
    category: updates.category ?? existing.category,
    vendor: updates.vendor ?? updates.vendor ?? existing.vendor,
    vendor: updates.vendor ?? updates.vendor ?? existing.vendor,
    sku: updates.sku ?? existing.sku,
    name: updates.name ?? existing.name,
    description: updates.description ?? existing.description,
    unit_cost: updates.unit_cost ?? existing.unit_cost,
    unit_price: updates.unit_price ?? existing.unit_price,
    current_stock: updates.current_stock ?? existing.current_stock,
    reorder_level: updates.reorder_level ?? existing.reorder_level,
    is_active: updates.is_active ?? existing.is_active,
  };

  const categoryId = await resolveCategoryId(nextPayload);
  const vendorId = await resolveVendorId(nextPayload);

  await query(
    `UPDATE products SET
      category_id = $1,
      vendor_id = $2,
      sku = $3,
      name = $4,
      description = $5,
      unit_cost = $6,
      unit_price = $7,
      current_stock = $8,
      reorder_level = $9,
      is_active = $10
     WHERE id = $11`,
    [
      categoryId,
      vendorId,
      nextPayload.sku,
      nextPayload.name,
      nextPayload.description ?? null,
      nextPayload.unit_cost,
      nextPayload.unit_price,
      nextPayload.current_stock,
      nextPayload.reorder_level,
      nextPayload.is_active,
      id,
    ],
  );

  return getProductById(id);
};

export const deleteProduct = async (id) => {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};

export const findProductBySku = async (sku) => {
  const result = await query('SELECT id FROM products WHERE sku = $1 LIMIT 1', [sku]);
  return result.rows[0] ?? null;
};
