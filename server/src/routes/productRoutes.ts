import { Router } from 'express';
import { 
  getProducts, getProductByIdOrSlug, createProduct, updateProduct, deleteProduct 
} from '../controllers/productController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.get('/:identifier', getProductByIdOrSlug);
router.post('/', authenticate, authorizeRoles('seller', 'admin'), createProduct);
router.put('/:id', authenticate, authorizeRoles('seller', 'admin'), updateProduct);
router.delete('/:id', authenticate, authorizeRoles('seller', 'admin'), deleteProduct);

export default router;
