import { Router } from 'express';
import { 
  getCategories, getCategoryBySlug, getBanners, 
  createCategory, updateCategory, deleteCategory 
} from '../controllers/categoryController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', getCategories);
router.get('/banners', getBanners);
router.get('/:slug', getCategoryBySlug);

router.post('/', authenticate, authorizeRoles('admin'), createCategory);
router.put('/:id', authenticate, authorizeRoles('admin'), updateCategory);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteCategory);

export default router;
