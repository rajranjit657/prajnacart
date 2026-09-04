import { Router } from 'express';
import { 
  getSellerDashboard, getSellerProducts, getSellerOrders, updateStoreSettings 
} from '../controllers/sellerController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorizeRoles('seller'));

router.get('/dashboard', getSellerDashboard);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.put('/settings', updateStoreSettings);

export default router;
