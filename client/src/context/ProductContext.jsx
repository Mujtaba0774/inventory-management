import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductContext } from './productContextValue';
import { mockProducts, mockStockMovements, mockVendors } from '../data/mockData';

const useMockData = globalThis.__USE_MOCK_DATA__ === true;
const MOCK_VENDOR_TRANSACTIONS_STORAGE_KEY = 'wms.mockVendorTransactions';

const mockVendorNameById = new Map(mockVendors.map((vendor) => [String(vendor.id), vendor.name]));

const getPersistedMockVendorTransactions = () => {
  try {
    const stored = localStorage.getItem(MOCK_VENDOR_TRANSACTIONS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const setPersistedMockVendorTransactions = (transactions) => {
  try {
    localStorage.setItem(MOCK_VENDOR_TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    window.dispatchEvent(new Event('wms:mockVendorTransactionsUpdated'));
  } catch (error) {
    // Ignore storage failures in mock mode.
  }
};

const syncMockVendorTransaction = ({ product, vendorId, movementType, quantity, unitPrice, reason, movementId }) => {
  const effectiveVendorId = vendorId || product?.vendor_id || null;

  if (!effectiveVendorId) {
    return;
  }

  const normalizedReason = String(reason || '').toLowerCase();
  const shouldCreateTransaction = movementType === 'in'
    ? (normalizedReason.includes('purchase') || normalizedReason.includes('restock') || normalizedReason.includes('return'))
    : (normalizedReason.includes('sale') || normalizedReason.includes('return to vendor'));

  const referenceNo = `stock-movement:${movementId}`;
  const nextTransactions = getPersistedMockVendorTransactions().filter(
    (transaction) => transaction.reference_no !== referenceNo
  );

  if (!shouldCreateTransaction) {
    setPersistedMockVendorTransactions(nextTransactions);
    return;
  }

  const amount = Number((Number(quantity ?? 0) * Number(unitPrice ?? 0)).toFixed(2));

  if (amount <= 0) {
    setPersistedMockVendorTransactions(nextTransactions);
    return;
  }

  nextTransactions.unshift({
    id: `STX-${Date.now()}`,
    vendor_id: String(effectiveVendorId),
    transaction_type: movementType === 'in' ? 'IN' : 'OUT',
    amount,
    description: movementType === 'in'
      ? `Purchase: ${product.name} x${quantity}`
      : `Sale: ${product.name} x${quantity}`,
    notes: `Auto-recorded from stock movement ${movementId}`,
    reference_no: referenceNo,
    transaction_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  setPersistedMockVendorTransactions(nextTransactions);
};

const sortBatchesByDate = (batches) => [...batches].sort((left, right) => {
  const leftDate = new Date(left.batch_date ?? left.created_at ?? 0).getTime();
  const rightDate = new Date(right.batch_date ?? right.created_at ?? 0).getTime();

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  return new Date(left.created_at ?? 0).getTime() - new Date(right.created_at ?? 0).getTime();
});

const buildMockBatch = (movement, batchId) => ({
  id: batchId,
  product_id: String(movement.productId),
  vendor_id: movement.vendorId ?? null,
  vendor_name: movement.vendorId ? mockVendorNameById.get(String(movement.vendorId)) ?? null : null,
  quantity: Number(movement.quantity ?? 0),
  unit_price: movement.unit_price === null || movement.unit_price === undefined ? null : Number(movement.unit_price),
  batch_date: movement.date,
  created_at: movement.date,
  updated_at: movement.date,
});

const buildMockBatchesFromMovements = (movements) => sortBatchesByDate(
  movements
    .filter((movement) => movement.type === 'in')
    .map((movement) => buildMockBatch(movement, movement.batch_id ?? movement.id))
);

const consumeMockBatches = (sourceBatches, productId, quantityNeeded, batchId = null) => {
  const productBatches = sortBatchesByDate(
    sourceBatches.filter((batch) => String(batch.product_id) === String(productId) && Number(batch.quantity) > 0)
  );

  if (productBatches.length === 0) {
    throw new Error(`No stock batches available for product ${productId}`);
  }

  const nowIso = new Date().toISOString();

  let remainingQty = quantityNeeded;
  let primaryBatch = null;
  const nextBatches = sourceBatches.map((batch) => ({ ...batch }));
  const selectedBatch = batchId
    ? productBatches.find((batch) => String(batch.id) === String(batchId))
    : null;

  if (batchId && !selectedBatch) {
    throw new Error('Selected batch was not found for this product');
  }

  const batchesToConsume = selectedBatch
    ? [selectedBatch, ...productBatches.filter((batch) => String(batch.id) !== String(selectedBatch.id))]
    : productBatches;

  for (const batch of batchesToConsume) {
    if (remainingQty <= 0) break;

    const batchQty = Number(batch.quantity);
    const quantityToConsume = Math.min(remainingQty, batchQty);
    const nextQuantity = batchQty - quantityToConsume;

    if (!primaryBatch) {
      primaryBatch = {
        batchId: batch.id,
        quantity: quantityToConsume,
        unitPrice: batch.unit_price === null || batch.unit_price === undefined ? null : Number(batch.unit_price),
      };
    }

    const batchPosition = nextBatches.findIndex((item) => String(item.id) === String(batch.id));
    if (batchPosition !== -1) {
      if (nextQuantity > 0) {
        nextBatches[batchPosition] = { ...batch, quantity: nextQuantity, updated_at: nowIso };
      } else {
        nextBatches.splice(batchPosition, 1);
      }
    }

    remainingQty -= quantityToConsume;
  }

  if (remainingQty > 0) {
    throw new Error(`Insufficient stock in batches. Missing ${remainingQty} units.`);
  }

  return {
    nextBatches,
    consumedBatch: primaryBatch,
  };
};

const mapMockStockMovement = (movement) => ({
  id: movement.id,
  productId: movement.productId,
  vendorId: movement.vendorId ?? null,
  type: movement.type,
  quantity: movement.quantity,
  unit_price: movement.unit_price ?? null,
  total_amount: movement.total_amount ?? null,
  date: movement.date,
  reason: movement.reason,
  reference: movement.reference,
  notes: movement.notes ?? null,
  product_name: movement.product_name ?? null,
  product_sku: movement.product_sku ?? null,
  vendor_name: movement.vendor_name ?? null,
  user_name: movement.user_name ?? null,
});

const normalizeProductUpdate = (updates) => ({
  ...updates,
  price: updates.price ?? updates.unit_price,
  cost: updates.cost ?? updates.unit_cost,
});

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [batches, setBatches] = useState([]);

  const loadData = useCallback(async () => {
    if (useMockData) {
      setProducts(mockProducts.map((product) => ({
        ...product,
        price: Number(product.price ?? product.unit_price ?? 0),
        cost: Number(product.cost ?? product.unit_cost ?? 0),
      })));
      setStockMovements(mockStockMovements.map(mapMockStockMovement));
      setBatches(buildMockBatchesFromMovements(mockStockMovements));
      return;
    }

    const [productsResponse, movementsResponse] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/stock-movements'),
    ]);

    if (!productsResponse.ok) {
      throw new Error('Failed to load products');
    }

    if (!movementsResponse.ok) {
      throw new Error('Failed to load stock movements');
    }

    const productsData = await productsResponse.json();
    const movementsData = await movementsResponse.json();

    setProducts(productsData.products ?? []);
    setBatches([]);
    setStockMovements((movementsData.stockMovements ?? []).map((movement) => ({
      id: movement.id,
      productId: movement.product_id,
      vendorId: movement.vendor_id,
      batch_id: movement.batch_id ?? null,
      type: movement.movement_type,
      quantity: movement.quantity,
      unit_price: movement.unit_price === null ? null : Number(movement.unit_price),
      total_amount: movement.total_amount === null ? null : Number(movement.total_amount),
      date: movement.movement_date,
      reason: movement.reason,
      reference: movement.reference,
      notes: movement.notes,
      product_name: movement.product_name,
      product_sku: movement.product_sku,
      vendor_name: movement.vendor_name,
      user_name: movement.user_name,
    })));
  }, []);

  useEffect(() => {
    loadData().catch((error) => {
      console.error('Product load failed:', error);
    });
  }, [loadData]);

  const addProduct = useCallback(async (product) => {
    if (useMockData) {
      const nextProduct = {
        id: String(Date.now()),
        ...product,
        stock: Number(product.stock ?? 0),
        minStock: Number(product.minStock ?? 0),
        price: Number(product.price ?? 0),
        cost: Number(product.cost ?? 0),
        dateAdded: new Date().toISOString().slice(0, 10),
        lastUpdated: new Date().toISOString().slice(0, 10),
      };

      setProducts((current) => [...current, nextProduct]);

      // If initial stock provided, create an initial batch for this product
      if (Number(nextProduct.stock ?? 0) > 0) {
        try {
          await createBatch({
            product_id: nextProduct.id,
            vendor_id: null,
            quantity: Number(nextProduct.stock),
            unit_price: Number(nextProduct.cost ?? 0),
            batch_date: new Date().toISOString(),
          });

          // Keep product.stock in sync with batch totals
          await syncProductStockFromBatches(nextProduct.id);
        } catch (err) {
          // swallow mock batch creation errors
          console.error('Failed to create initial batch (mock):', err);
        }
      }

      return;
    }
    
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add product');
    }

    await loadData();
  }, [loadData]);

  const updateProduct = useCallback(async (id, updates) => {
    if (useMockData) {
      const normalizedUpdates = normalizeProductUpdate(updates);
      delete normalizedUpdates.unit_price;
      delete normalizedUpdates.unit_cost;

      setProducts((current) => current.map((product) => (
        String(product.id) === String(id)
          ? {
            ...product,
            ...normalizedUpdates,
            price: normalizedUpdates.price !== undefined && normalizedUpdates.price !== null
              ? Number(normalizedUpdates.price)
              : Number(product.price ?? 0),
            cost: normalizedUpdates.cost !== undefined && normalizedUpdates.cost !== null
              ? Number(normalizedUpdates.cost)
              : Number(product.cost ?? 0),
            lastUpdated: new Date().toISOString().slice(0, 10),
          }
          : product
      )));
      return;
    }

    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update product');
    }

    await loadData();
  }, [loadData]);

  const deleteProduct = useCallback(async (id) => {
    if (useMockData) {
      setProducts((current) => current.filter((product) => String(product.id) !== String(id)));
      setStockMovements((current) => current.filter((movement) => String(movement.productId) !== String(id)));
      return;
    }

    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete product');
    }

    await loadData();
  }, [loadData]);

  const updateStock = useCallback(async (productId, quantity, type, reason, options = {}) => {
    const product = products.find((item) => String(item.id) === String(productId));

    if (!product) {
      throw new Error('Product not found');
    }

    const movementType = type === 'in' ? 'in' : 'out';
    const updatedStock = movementType === 'in' ? product.stock + quantity : product.stock - quantity;

    if (updatedStock < 0) {
      throw new Error('Insufficient stock for this movement');
    }

    if (useMockData) {
      const movementDate = options.movementDateTime || new Date().toISOString();
      const selectedBatchId = options.batchId ? String(options.batchId) : null;
      let nextBatchId = null;
      let nextUnitPrice = options.unitPrice ?? null;

      if (movementType === 'in') {
        const costPrice = options.productUnitCost !== undefined && options.productUnitCost !== null
          ? Number(options.productUnitCost)
          : Number(product.cost ?? product.unit_cost ?? product.unit_price ?? product.price ?? 0);

        const createdBatch = await createBatch({
          product_id: product.id,
          vendor_id: options.vendorId || null,
          quantity,
          unit_price: costPrice,
          batch_date: movementDate,
        });

        nextBatchId = createdBatch.id;
        nextUnitPrice = createdBatch.unit_price === null || createdBatch.unit_price === undefined
          ? null
          : Number(createdBatch.unit_price);
      }

      if (movementType === 'out') {
        const consumed = consumeMockBatches(batches, product.id, quantity, selectedBatchId);
        setBatches(consumed.nextBatches);
        nextBatchId = consumed.consumedBatch?.batchId ?? null;
        nextUnitPrice = options.productUnitPrice !== undefined && options.productUnitPrice !== null
          ? Number(options.productUnitPrice)
          : Number(product.price ?? product.unit_price ?? product.unit_cost ?? product.cost ?? 0);
      }

      const nextMovement = {
        id: `MOCK-${Date.now()}`,
        productId: String(product.id),
        vendorId: options.vendorId || null,
        batch_id: nextBatchId,
        type: movementType,
        quantity,
        unit_price: nextUnitPrice,
        total_amount: nextUnitPrice == null ? null : Number((Number(nextUnitPrice) * quantity).toFixed(2)),
        date: movementDate,
        reason,
        reference: `MOCK-${Date.now()}`,
        notes: options.notes ?? null,
        product_name: product.name,
        product_sku: product.sku,
        vendor_name: null,
        user_name: null,
      };

      setProducts((current) => current.map((item) => (
        String(item.id) === String(productId)
          ? {
            ...item,
            stock: updatedStock,
            lastUpdated: new Date().toISOString().slice(0, 10),
            price: options.productUnitPrice !== undefined && options.productUnitPrice !== null ? Number(options.productUnitPrice) : item.price,
            cost: options.productUnitCost !== undefined && options.productUnitCost !== null ? Number(options.productUnitCost) : item.cost,
          }
          : item
      )));
      setStockMovements((current) => [nextMovement, ...current]);
      syncMockVendorTransaction({
        product,
        vendorId: options.vendorId || null,
        movementType,
        quantity,
        unitPrice: nextUnitPrice,
        reason,
        movementId: nextMovement.id,
      });

      return;
    }

    const response = await fetch('/api/stock-movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: product.id,
        vendor_id: options.vendorId || null,
        movement_type: movementType,
        quantity,
        unit_price: options.unitPrice ?? null,
        reason,
        batch_id: options.batchId || null,
        product_unit_price: options.productUnitPrice ?? null,
        product_unit_cost: options.productUnitCost ?? null,
        movement_date: options.movementDateTime || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create stock movement');
    }

    await loadData();
  }, [batches, loadData, products]);

  const getLowStockProducts = useCallback(() => {
    return products.filter(product => product.stock <= product.minStock);
  }, [products]);

  const getTotalValue = useCallback(() => {
    return products.reduce((total, product) => total + (Number(product.stock ?? 0) * Number(product.price ?? 0)), 0);
  }, [products]);

  const getTopSellingProducts = useCallback(() => {
    // Mock implementation - in real app would be based on actual sales data
    return products.slice(0, 3);
  }, [products]);

  const updateStockMovement = useCallback(async (id, updates) => {
    if (useMockData) {
      setStockMovements((current) => current.map((movement) => (
        String(movement.id) === String(id)
          ? { ...movement, ...updates }
          : movement
      )));
      return;
    }

    const response = await fetch(`/api/stock-movements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update stock movement');
    }

    await loadData();
  }, [loadData]);

  const deleteStockMovement = useCallback(async (id) => {
    if (useMockData) {
      setStockMovements((current) => current.filter((movement) => String(movement.id) !== String(id)));
      return;
    }

    const response = await fetch(`/api/stock-movements/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete stock movement');
    }

    await loadData();
  }, [loadData]);

  const getBatchesForProduct = useCallback(async (productId) => {
    if (useMockData) {
      return sortBatchesByDate(
        batches
          .filter((batch) => String(batch.product_id) === String(productId) && Number(batch.quantity) > 0)
          .map((batch, index) => ({
            ...batch,
            batch_number: index + 1,
          }))
      );
    }

    try {
      const response = await fetch(`/api/inventory-batches/product/${productId}`);

      if (!response.ok) {
        throw new Error('Failed to load batches');
      }

      const data = await response.json();
      return data.batches ?? [];
    } catch (error) {
      console.error('Error loading batches:', error);
      return [];
    }
  }, [batches]);

  const createBatch = useCallback(async (batchData) => {
    if (useMockData) {
      const createdBatch = {
        id: `MOCK-BATCH-${Date.now()}`,
        product_id: batchData.product_id,
        vendor_id: batchData.vendor_id ?? null,
        vendor_name: batchData.vendor_id ? mockVendorNameById.get(String(batchData.vendor_id)) ?? null : null,
        quantity: Number(batchData.quantity ?? 0),
        unit_price: batchData.unit_price === null || batchData.unit_price === undefined ? null : Number(batchData.unit_price),
        batch_date: batchData.batch_date,
        created_at: batchData.batch_date,
        updated_at: batchData.batch_date,
      };

      setBatches((current) => sortBatchesByDate([...current, createdBatch]));
      return createdBatch;
    }

    const response = await fetch('/api/inventory-batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create batch');
    }

    const data = await response.json();
    return data.batch;
  }, []);

  const createBatchOnStockIn = useCallback(async (productId, quantity, unitPrice, vendorId, batchDate) => {
    return await createBatch({
      product_id: productId,
      vendor_id: vendorId || null,
      quantity,
      unit_price: unitPrice,
      batch_date: batchDate,
    });
  }, [createBatch]);

  const syncProductStockFromBatches = useCallback(async (productId) => {
    if (!productId) return;

    if (useMockData) {
      const totalQuantity = batches
        .filter((batch) => String(batch.product_id) === String(productId))
        .reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0);

      await updateProduct(productId, {
        stock: totalQuantity,
        current_stock: totalQuantity,
      });
      return;
    }

    const productBatches = await getBatchesForProduct(productId);
    const totalQuantity = productBatches.reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0);

    await updateProduct(productId, {
      stock: totalQuantity,
      current_stock: totalQuantity,
    });
  }, [batches, getBatchesForProduct, updateProduct]);

  const updateBatch = useCallback(async (batchId, updates) => {
    if (useMockData) {
      let productId = null;

      setBatches((current) => current.map((batch) => {
        if (String(batch.id) === String(batchId)) {
          productId = batch.product_id;
          return { ...batch, ...updates, updated_at: new Date().toISOString() };
        }
        return batch;
      }));

      if (productId) {
        await syncProductStockFromBatches(productId);
      }
      return;
    }

    try {
      const beforeResponse = await fetch(`/api/inventory-batches/${batchId}`);
      const beforeData = await beforeResponse.json().catch(() => ({}));
      const productId = beforeData.batch?.product_id ?? null;

      const response = await fetch(`/api/inventory-batches/${batchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update batch');
      }

      await loadData();

      if (productId) {
        await syncProductStockFromBatches(productId);
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  }, [loadData, syncProductStockFromBatches]);

  const deleteBatch = useCallback(async (batchId) => {
    if (useMockData) {
      let productId = null;

      setBatches((current) => {
        const batchToDelete = current.find((batch) => String(batch.id) === String(batchId));
        productId = batchToDelete?.product_id ?? null;
        return current.filter((batch) => String(batch.id) !== String(batchId));
      });

      if (productId) {
        await syncProductStockFromBatches(productId);
      }
      return;
    }

    try {
      const beforeResponse = await fetch(`/api/inventory-batches/${batchId}`);
      const beforeData = await beforeResponse.json().catch(() => ({}));
      const productId = beforeData.batch?.product_id ?? null;

      const response = await fetch(`/api/inventory-batches/${batchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete batch');
      }

      await loadData();

      if (productId) {
        await syncProductStockFromBatches(productId);
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }, [loadData, syncProductStockFromBatches]);

  const value = useMemo(() => ({
    products,
    stockMovements,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    updateStockMovement,
    deleteStockMovement,
    getBatchesForProduct,
    createBatch,
    createBatchOnStockIn,
    updateBatch,
    deleteBatch,
    getLowStockProducts,
    getTotalValue,
    getTopSellingProducts
  }), [
    addProduct,
    createBatch,
    createBatchOnStockIn,
    updateBatch,
    deleteBatch,
    deleteProduct,
    deleteStockMovement,
    getBatchesForProduct,
    getLowStockProducts,
    getTopSellingProducts,
    getTotalValue,
    products,
    stockMovements,
    updateProduct,
    updateStock,
    updateStockMovement,
  ]);

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};