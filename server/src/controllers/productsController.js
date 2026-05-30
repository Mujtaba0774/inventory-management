import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from '../models/productsModel.js';
import { createBatch } from '../models/inventoryBatchesModel.js';

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeProductPayload = (body) => ({
  sku: body.sku,
  name: body.name,
  category: body.category,
  vendor: body.vendor ?? body.vendor,
  vendor: body.vendor ?? body.vendor,
  description: body.description ?? null,
  unit_cost: toNumber(body.cost ?? body.unit_cost),
  unit_price: toNumber(body.price ?? body.unit_price),
  current_stock: Number(body.stock ?? body.current_stock ?? 0),
  reorder_level: Number(body.minStock ?? body.reorder_level ?? 0),
  is_active: body.is_active ?? true,
});

export const listProducts = async (req, res, next) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const payload = normalizeProductPayload(req.body);

    if (!payload.category || !payload.sku || !payload.name) {
      res.status(400).json({ message: 'category, sku, and name are required' });
      return;
    }

    const product = await createProduct({
      ...payload,
      sku: String(payload.sku).trim(),
      name: String(payload.name).trim(),
      category: String(payload.category).trim(),
      vendor: payload.vendor ? String(payload.vendor).trim() : null,
      vendor: payload.vendor ? String(payload.vendor).trim() : null,
    });

    const initialStock = Number(product?.stock ?? payload.current_stock ?? 0);
    if (product?.id && initialStock > 0) {
      const initialUnitPrice = Number(product?.cost ?? payload.unit_cost ?? 0);

      if (Number.isFinite(initialUnitPrice) && initialUnitPrice > 0) {
        await createBatch({
          product_id: product.id,
          vendor_id: product.vendor_id ?? null,
          quantity: initialStock,
          unit_price: initialUnitPrice,
          batch_date: new Date(),
        });
      }
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

export const editProduct = async (req, res, next) => {
  try {
    const updates = normalizeProductPayload(req.body);

    if (updates.sku !== undefined) updates.sku = String(updates.sku).trim();
    if (updates.name !== undefined) updates.name = String(updates.name).trim();
    if (updates.category !== undefined) updates.category = String(updates.category).trim();
    if (updates.vendor !== undefined && updates.vendor !== null) updates.vendor = String(updates.vendor).trim();
    if (updates.vendor !== undefined && updates.vendor !== null) updates.vendor = String(updates.vendor).trim();

    const product = await updateProduct(req.params.id, updates);

    if (!product) {
      res.status(404).json({ message: 'Product not found or no fields provided' });
      return;
    }

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

export const removeProduct = async (req, res, next) => {
  try {
    const deleted = await deleteProduct(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
