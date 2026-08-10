import { Router } from 'express';
import { getTranslateStatus, translateTexts } from '../controllers/translateController.js';

const router = Router();

router.get('/status', getTranslateStatus);
router.post('/', translateTexts);

export default router;
