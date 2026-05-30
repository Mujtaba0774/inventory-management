import {
  createStockMovement,
  deleteStockMovement,
  getAllStockMovements,
  getStockMovementById,
  updateStockMovement,
} from '../models/stockMovementsModel.js';
import { addVendorTransaction, deleteVendorTransactionByReference, getVendorById } from '../models/vendorsModel.js';
import { getProductById, updateProduct } from '../models/productsModel.js';
import { createBatch } from '../models/inventoryBatchesModel.js';
import { consumeStockFromBatch } from '../models/batchConsumptionModel.js';

const isValidMovementType = (value) => value === 'in' || value === 'out';

const toPositiveInteger = (value) => {
  const numericValue = Number.parseInt(value, 10);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const toNonNegativeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const getVendorTransactionFromMovement = (product, vendorId, movementType, quantity, unitPrice, reason, movementId) => {
  const effectiveVendorId = vendorId || product?.vendor_id;

  if (!effectiveVendorId) {
    return null;
  }

  const normalizedReason = String(reason || '').toLowerCase();
  const fallbackUnitPrice = movementType === 'out'
    ? Number(product.price ?? product.unit_price ?? product.cost ?? product.unit_cost ?? 0)
    : Number(product.cost ?? product.unit_cost ?? product.price ?? product.unit_price ?? 0);
  const effectiveUnitPrice = unitPrice ?? fallbackUnitPrice;
  const amount = Number((quantity * effectiveUnitPrice).toFixed(2));

  if (amount <= 0) {
    return null;
  }

  if (movementType === 'in' && (normalizedReason.includes('purchase') || normalizedReason.includes('restock') || normalizedReason.includes('return'))) {
    return {
      vendorId: effectiveVendorId,
      transaction_type: 'IN',
      amount,
      description: `Purchase: ${product.name} x${quantity}`,
      notes: `Auto-recorded from stock movement ${movementId}`,
      reference_no: `stock-movement:${movementId}`,
    };
  }

  if (movementType === 'out' && (normalizedReason.includes('sale') || normalizedReason.includes('return to vendor'))) {
    return {
      vendorId: effectiveVendorId,
      transaction_type: 'OUT',
      amount,
      description: `Sale: ${product.name} x${quantity}`,
      notes: `Auto-recorded from stock movement ${movementId}`,
      reference_no: `stock-movement:${movementId}`,
    };
  }

  return null;
};

const syncVendorTransaction = async (product, vendorId, movementType, quantity, unitPrice, reason, movementId) => {
  try {
    const transaction = getVendorTransactionFromMovement(product, vendorId, movementType, quantity, unitPrice, reason, movementId);

    if (!transaction) {
      await deleteVendorTransactionByReference(`stock-movement:${movementId}`);
      return;
    }

    await deleteVendorTransactionByReference(transaction.reference_no);
    await addVendorTransaction(transaction.vendorId, transaction);
  } catch (error) {
    console.error('Failed to sync vendor transaction after stock movement:', error);
  }
};

export const listStockMovements = async (req, res, next) => {
  try {
    const stockMovements = await getAllStockMovements();
    res.status(200).json({ stockMovements });
  } catch (error) {
    next(error);
  }
};

export const getStockMovement = async (req, res, next) => {
  try {
    const stockMovement = await getStockMovementById(req.params.id);

    if (!stockMovement) {
      res.status(404).json({ message: 'Stock movement not found' });
      return;
    }

    res.status(200).json({ stockMovement });
  } catch (error) {
    next(error);
  }
};

export const addStockMovement = async (req, res, next) => {
  try {
    const {
      product_id,
      vendor_id = null,
      movement_type,
      quantity,
      batch_id = null,
      product_unit_price = null,
      product_unit_cost = null,
      reason,
      reference = null,
      notes = null,
      movement_date = null,
    } = req.body;

    if (!product_id || !isValidMovementType(movement_type)) {
      res.status(400).json({ message: 'product_id and a valid movement_type are required' });
      return;
    }

    const product = await getProductById(product_id);
    if (!product) {
      res.status(400).json({ message: 'Product not found' });
      return;
    }

    const vendorIdValue = vendor_id || null;

    if (vendorIdValue) {
      const vendor = await getVendorById(vendorIdValue);
      if (!vendor) {
        res.status(400).json({ message: 'vendor_id is invalid' });
        return;
      }
    }

    const quantityValue = toPositiveInteger(quantity);
    if (quantityValue === null) {
      res.status(400).json({ message: 'quantity must be a positive integer' });
      return;
    }

    if (typeof reason !== 'string' || reason.trim() === '') {
      res.status(400).json({ message: 'reason is required' });
      return;
    }

    const salePriceValue = toNonNegativeNumber(product_unit_price);
    const costPriceValue = toNonNegativeNumber(product_unit_cost);
    const movementDateValue = movement_date ? new Date(movement_date) : new Date();
    let batchId = null;
    let finalUnitPrice = null;

    if (movement_type === 'in') {
      finalUnitPrice = costPriceValue ?? Number(product.cost ?? product.unit_cost ?? product.unit_price ?? product.price ?? 0);

      const batch = await createBatch({
        product_id,
        vendor_id: vendorIdValue,
        quantity: quantityValue,
        unit_price: finalUnitPrice,
        batch_date: movementDateValue,
      });

      batchId = batch?.id ?? null;
    }

    if (movement_type === 'out') {
      const consumedBatch = await consumeStockFromBatch(product_id, quantityValue, batch_id || null);
      batchId = consumedBatch?.batchId ?? null;
      finalUnitPrice = salePriceValue ?? Number(product.price ?? product.unit_price ?? product.cost ?? product.unit_cost ?? 0);
    }

    const totalAmount = finalUnitPrice === null ? null : Number((quantityValue * finalUnitPrice).toFixed(2));

    const stockMovement = await createStockMovement({
      product_id,
      batch_id: batchId,
      vendor_id: vendorIdValue,
      movement_type,
      quantity: quantityValue,
      unit_price: finalUnitPrice,
      total_amount: totalAmount,
      reason: reason.trim(),
      reference,
      notes,
      movement_date: movementDateValue,
    });

    try {
      const updates = {};
      if (salePriceValue !== null && salePriceValue !== undefined) {
        updates.unit_price = salePriceValue;
      }
      if (costPriceValue !== null && costPriceValue !== undefined) {
        updates.unit_cost = costPriceValue;
      }

      if (Object.keys(updates).length > 0) {
        await updateProduct(product_id, updates);
      }
    } catch (error) {
      console.error('Failed to update product prices after stock movement:', error);
    }

    await syncVendorTransaction(product, vendorIdValue, movement_type, quantityValue, finalUnitPrice, reason.trim(), stockMovement.id);

    res.status(201).json({ message: 'Stock movement created successfully', stockMovement });
  } catch (error) {
    next(error);
  }
};

export const editStockMovement = async (req, res, next) => {
  try {
    const updates = {};
    const existingMovement = await getStockMovementById(req.params.id);

    if (!existingMovement) {
      res.status(404).json({ message: 'Stock movement not found' });
      return;
    }

    if (req.body.product_id !== undefined) {
      updates.product_id = req.body.product_id;
    }

    if (req.body.vendor_id !== undefined) {
      const nextVendorId = req.body.vendor_id;
      if (nextVendorId === null || nextVendorId === '') {
        updates.vendor_id = null;
      } else {
        const vendor = await getVendorById(nextVendorId);
        if (!vendor) {
          res.status(400).json({ message: 'vendor_id is invalid' });
          return;
        }
        updates.vendor_id = nextVendorId;
      }
    }

    if (req.body.movement_type !== undefined) {
      if (!isValidMovementType(req.body.movement_type)) {
        res.status(400).json({ message: 'movement_type must be in or out' });
        return;
      }
      updates.movement_type = req.body.movement_type;
    }

    if (req.body.quantity !== undefined) {
      const quantityValue = toPositiveInteger(req.body.quantity);
      if (quantityValue === null) {
        res.status(400).json({ message: 'quantity must be a positive integer' });
        return;
      }
      updates.quantity = quantityValue;
    }

    if (req.body.unit_price !== undefined) {
      const unitPriceValue = toNonNegativeNumber(req.body.unit_price);
      if (req.body.unit_price !== null && req.body.unit_price !== '' && unitPriceValue === null) {
        res.status(400).json({ message: 'unit_price must be a non-negative number' });
        return;
      }
      updates.unit_price = unitPriceValue;
    }

    if (req.body.reason !== undefined) {
      if (typeof req.body.reason !== 'string' || req.body.reason.trim() === '') {
        res.status(400).json({ message: 'reason must be a non-empty string' });
        return;
      }
      updates.reason = req.body.reason.trim();
    }

    if (req.body.reference !== undefined) {
      updates.reference = req.body.reference;
    }

    if (req.body.notes !== undefined) {
      updates.notes = req.body.notes;
    }

    if (req.body.movement_date !== undefined) {
      updates.movement_date = req.body.movement_date;
    }

    const quantityForTotal = updates.quantity ?? existingMovement.quantity;
    const unitPriceForTotal = updates.unit_price !== undefined ? updates.unit_price : existingMovement.unit_price;
    if (quantityForTotal !== null && unitPriceForTotal !== null) {
      updates.total_amount = Number((quantityForTotal * unitPriceForTotal).toFixed(2));
    } else if (updates.unit_price !== undefined && updates.unit_price === null) {
      updates.total_amount = null;
    }

    const stockMovement = await updateStockMovement(req.params.id, updates);

    if (!stockMovement) {
      res.status(404).json({ message: 'Stock movement not found or no fields provided' });
      return;
    }

    const product = await getProductById(stockMovement.product_id);
    await syncVendorTransaction(
      product,
      stockMovement.vendor_id,
      stockMovement.movement_type,
      stockMovement.quantity,
      stockMovement.unit_price === null ? null : Number(stockMovement.unit_price),
      stockMovement.reason,
      stockMovement.id,
    );

    res.status(200).json({ message: 'Stock movement updated successfully', stockMovement });
  } catch (error) {
    next(error);
  }
};

export const removeStockMovement = async (req, res, next) => {
  try {
    const deleted = await deleteStockMovement(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Stock movement not found' });
      return;
    }

    await deleteVendorTransactionByReference(`stock-movement:${req.params.id}`);

    res.status(200).json({ message: 'Stock movement deleted successfully' });
  } catch (error) {
    next(error);
  }
};
