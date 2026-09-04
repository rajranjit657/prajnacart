import { Router } from 'express';
import { validateCheckout } from '../controllers/checkoutController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/validate', authenticate, validateCheckout);

export default router;
