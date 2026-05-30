import { Router } from 'express';
import {
  addCategory,
  editCategory,
  getCategory,
  listCategories,
  removeCategory,
} from '../controllers/categoriesController.js';

const router = Router();

router.get('/', listCategories);
router.get('/:id', getCategory);
router.post('/', addCategory);
router.put('/:id', editCategory);
router.delete('/:id', removeCategory);

export default router;