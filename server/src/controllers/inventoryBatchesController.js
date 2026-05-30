import {
  createBatch,
  deleteBatch,
  getAllBatchesForProduct,
  getBatchById,
  updateBatchQuantity,
  getTotalBatchQuantityForProduct,
} from '../models/inventoryBatchesModel.js';
import { getProductById } from '../models/productsModel.js';
import { getVendorById } from '../models/vendorsModel.js';

const toPositiveNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

export const listBatchesForProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await getProductById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const batches = await getAllBatchesForProduct(productId);
    res.status(200).json({ batches });
  } catch (error) {
    next(error);
  }
};

export const getBatch = async (req, res, next) => {
  try {
    const batch = await getBatchById(req.params.id);

    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    res.status(200).json({ batch });
  } catch (error) {
    next(error);
  }
};

export const addBatch = async (req, res, next) => {
  try {
    const { product_id, vendor_id = null, quantity, unit_price, batch_date = null } = req.body;

    if (!product_id) {
      res.status(400).json({ message: 'product_id is required' });
      return;
    }

    const product = await getProductById(product_id);
    if (!product) {
      res.status(400).json({ message: 'Product not found' });
      return;
    }

    const vendorId = vendor_id || null;

    if (vendorId) {
      const vendor = await getVendorById(vendorId);
      if (!vendor) {
        res.status(400).json({ message: 'Vendor not found' });
        return;
      }
    }

    const quantityValue = toPositiveNumber(quantity);
    if (quantityValue === null) {
      res.status(400).json({ message: 'quantity must be a positive number' });
      return;
    }

    const unitPriceValue = toPositiveNumber(unit_price);
    if (unitPriceValue === null) {
      res.status(400).json({ message: 'unit_price must be a positive number' });
      return;
    }

    const batch = await createBatch({
      product_id,
      vendor_id: vendorId,
      quantity: quantityValue,
      unit_price: unitPriceValue,
      batch_date: batch_date ? new Date(batch_date) : new Date(),
    });

    res.status(201).json({ message: 'Batch created successfully', batch });
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      res.status(400).json({ message: 'quantity is required' });
      return;
    }

    const quantityValue = toPositiveNumber(quantity);
    if (quantityValue === null) {
      res.status(400).json({ message: 'quantity must be a positive number' });
      return;
    }

    const batch = await updateBatchQuantity(req.params.id, quantityValue);

    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    res.status(200).json({ message: 'Batch updated successfully', batch });
  } catch (error) {
    next(error);
  }
};

export const removeBatch = async (req, res, next) => {
  try {
    const deleted = await deleteBatch(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    res.status(200).json({ message: 'Batch deleted successfully' });
  } catch (error) {
    next(error);
  }
};
