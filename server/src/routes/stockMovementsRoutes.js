import { Router } from 'express';
import {
  addStockMovement,
  editStockMovement,
  getStockMovement,
  listStockMovements,
  removeStockMovement,
} from '../controllers/stockMovementsController.js';

const router = Router();

router.get('/', listStockMovements);
router.get('/:id', getStockMovement);
router.post('/', addStockMovement);
router.put('/:id', editStockMovement);
router.delete('/:id', removeStockMovement);

export default router;