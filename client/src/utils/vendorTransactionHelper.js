import { useNotification } from '../hooks/useNotification';

const API_URL = 'http://localhost:5000/api';
const useMockData = globalThis.__USE_MOCK_DATA__ === true;

/**
 * Auto-record vendor transaction when a product stock movement happens
 * @param {Object} product - Product data from stock movement
 * @param {string} movementType - 'in' or 'out'
 * @param {number} quantity - Quantity moved
 * @param {string} reason - Reason for movement (e.g., 'Sale', 'Purchase', 'Damage')
 */
export const autoRecordVendorTransaction = async (product, movementType, quantity, reason) => {
  if (useMockData) {
    return;
  }

  // Only process if product has a vendor
  if (!product.vendor_id && !product.vendorId) {
    return;
  }

  const vendorId = product.vendor_id || product.vendorId;
  
  try {
    // Determine transaction type based on movement and reason
    let transactionType = null;
    let transactionAmount = 0;
    let description = '';

    if (movementType === 'in' && reason.toLowerCase().includes('purchase')) {
      // Stock in from purchase: record as purchase (cash in)
      transactionType = 'IN';
      // Calculate amount as quantity * product cost
      transactionAmount = quantity * (product.cost || product.unit_cost || product.price || product.unit_price || 0);
      description = `Purchase: ${product.name} x${quantity}`;
    } else if (movementType === 'out' && reason.toLowerCase().includes('sale')) {
      // Stock out from sale: optionally record what we owe vendor
      // For now, we'll skip this as sales don't directly affect vendor debt
      return;
    }

    // Record the transaction if applicable
    if (transactionType && transactionAmount > 0) {
      const response = await fetch(`${API_URL}/vendors/${vendorId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_type: transactionType,
          amount: transactionAmount,
          description,
          reference_no: `${movementType.toUpperCase()}-${Date.now()}`,
          notes: `Auto-recorded from ${reason}`,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to auto-record vendor transaction');
      }
    }
  } catch (error) {
    console.warn('Error auto-recording vendor transaction:', error);
  }
};

/**
 * Format vendor balance for display
 */
export const formatVendorBalance = (balance) => {
  return {
    totalPurchased: Number(balance.total_purchased || 0).toFixed(2),
    totalPaid: Number(balance.total_paid || 0).toFixed(2),
    remainingAmount: Number(balance.remaining_amount || 0).toFixed(2),
    isDebt: Number(balance.remaining_amount || 0) >= 0, // positive = we owe them, negative = they owe us
  };
};

export const autoRecordVendorTransaction = autoRecordVendorTransaction;
export const formatVendorBalance = formatVendorBalance;
