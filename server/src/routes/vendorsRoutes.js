import { Router } from 'express';
import {
  addVendor,
  editVendor,
  getVendor,
  listVendors,
  removeVendor,
  recordVendorTransaction,
  getVendorTransactionHistory,
  getVendorFinancialSummary,
  removeVendorTransaction,
} from '../controllers/vendorsController.js';

const router = Router();

router.get('/', listVendors);
router.get('/:id', getVendor);
router.post('/', addVendor);
router.put('/:id', editVendor);
router.delete('/:id', removeVendor);

// Transaction routes
router.post('/:id/transactions', recordVendorTransaction);
router.get('/:id/transactions', getVendorTransactionHistory);
router.get('/:id/financial-summary', getVendorFinancialSummary);
router.delete('/:id/transactions/:transactionId', removeVendorTransaction);

export default router;