import { Router } from 'express';
import { validateCoupon, getCoupons, createCoupon, deleteCoupon } from '../controllers/couponController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', getCoupons);
router.post('/validate', validateCoupon);
router.post('/', authenticate, authorizeRoles('admin'), createCoupon);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteCoupon);

export default router;
