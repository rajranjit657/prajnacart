import { Router } from 'express';
import { 
  createOrder, verifyPayment, getMyOrders, getOrderById, cancelOrder, updateOrderStatus 
} from '../controllers/orderController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createOrder);
router.post('/verify-payment', authenticate, verifyPayment);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/cancel', authenticate, cancelOrder);
router.patch('/:id/status', authenticate, authorizeRoles('seller', 'admin'), updateOrderStatus);

export default router;
