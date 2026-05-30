import { Router } from 'express';
import {
  addProduct,
  editProduct,
  getProduct,
  listProducts,
  removeProduct,
} from '../controllers/productsController.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', addProduct);
router.put('/:id', editProduct);
router.delete('/:id', removeProduct);

export default router;