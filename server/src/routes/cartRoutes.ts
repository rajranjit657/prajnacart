import { Router } from 'express';
import { 
  getCart, addToCart, updateCartItem, removeCartItem, clearCart, syncGuestCart 
} from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncGuestCart);
router.put('/:id', updateCartItem);
router.delete('/clear', clearCart);
router.delete('/:id', removeCartItem);

export default router;
