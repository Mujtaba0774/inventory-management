import { Router } from 'express';
import {
  addBatch,
  getBatch,
  listBatchesForProduct,
  removeBatch,
  updateBatch,
} from '../controllers/inventoryBatchesController.js';

const router = Router();

router.get('/product/:productId', listBatchesForProduct);
router.get('/:id', getBatch);
router.post('/', addBatch);
router.put('/:id', updateBatch);
router.delete('/:id', removeBatch);

export default router;
