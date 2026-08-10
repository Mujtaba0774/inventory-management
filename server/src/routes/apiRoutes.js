import { Router } from 'express';
import { query } from '../config/db.js';
import categoryRoutes from './categoriesRoutes.js';
import vendorRoutes from './vendorsRoutes.js';
import productRoutes from './productsRoutes.js';
import stockMovementRoutes from './stockMovementsRoutes.js';
import inventoryBatchRoutes from './inventoryBatchesRoutes.js';
import translateRoutes from './translateRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
  });
});

// Database health check
router.get('/health/db', async (_req, res, next) => {
  try {
    const result = await query('SELECT NOW()');
    res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error('[DB HEALTH CHECK] Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

router.use('/categories', categoryRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', productRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/inventory-batches', inventoryBatchRoutes);
router.use('/translate', translateRoutes);

export default router;