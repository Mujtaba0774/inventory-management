import { useEffect, useMemo, useState } from 'react';
import { useProducts } from './useProducts';

export const useBatchSummary = (productIds) => {
  const { getBatchesForProduct } = useProducts();
  const [batchSummaryByProduct, setBatchSummaryByProduct] = useState({});

  const normalizedIds = useMemo(
    () => [...new Set((productIds ?? []).map((id) => String(id)).filter(Boolean))],
    [productIds]
  );

  const idsKey = normalizedIds.join('|');

  useEffect(() => {
    let isCancelled = false;

    if (!idsKey) {
      setBatchSummaryByProduct({});
      return undefined;
    }

    const loadBatchSummaries = async () => {
      const entries = await Promise.all(
        normalizedIds.map(async (productId) => {
          const batches = await getBatchesForProduct(productId);
          return [
            productId,
            {
              count: batches.length,
              totalQuantity: batches.reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0),
              oldestPrice: batches[0]?.unit_price ?? null,
              batches: batches.map((batch, index) => ({
                id: batch.id,
                batchNumber: batch.batch_number ?? index + 1,
                quantity: Number(batch.quantity ?? 0),
                unitPrice: batch.unit_price ?? null,
                vendorName: batch.vendor_name ?? null,
                batchDate: batch.batch_date ?? null,
              })),
            },
          ];
        })
      );

      if (!isCancelled) {
        setBatchSummaryByProduct(Object.fromEntries(entries));
      }
    };

    loadBatchSummaries().catch(() => {
      if (!isCancelled) {
        setBatchSummaryByProduct({});
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [getBatchesForProduct, idsKey, normalizedIds]);

  return batchSummaryByProduct;
};
