import { updateBatchQuantity, getAllBatchesForProduct, getBatchById } from './inventoryBatchesModel.js';

export const consumeStockFromBatch = async (productId, quantityNeeded, batchId = null) => {
  const batches = await getAllBatchesForProduct(productId);

  if (batches.length === 0) {
    throw new Error(`No stock batches available for product ${productId}`);
  }

  let remainingQty = quantityNeeded;
  const consumedBatches = [];
  const selectedBatch = batchId ? await getBatchById(batchId) : null;

  if (batchId && (!selectedBatch || String(selectedBatch.product_id) !== String(productId))) {
    throw new Error('Selected batch was not found for this product');
  }

  const batchesToConsume = selectedBatch
    ? [selectedBatch, ...batches.filter((batch) => String(batch.id) !== String(selectedBatch.id))]
    : batches;

  for (const batch of batchesToConsume) {
    if (remainingQty <= 0) break;

    const batchQty = batch.quantity;
    const qtToConsume = Math.min(remainingQty, batchQty);
    const newBatchQty = batchQty - qtToConsume;

    await updateBatchQuantity(batch.id, newBatchQty);

    consumedBatches.push({
      batchId: batch.id,
      quantity: qtToConsume,
      unitPrice: batch.unit_price,
    });

    remainingQty -= qtToConsume;
  }

  if (remainingQty > 0) {
    throw new Error(`Insufficient stock in batches. Missing ${remainingQty} units.`);
  }

  return consumedBatches[0];
};

export const getEffectiveUnitPriceFromBatch = async (batchId) => {
  if (!batchId) return null;

  const batch = await getBatchById(batchId);
  return batch ? Number(batch.unit_price) : null;
};
