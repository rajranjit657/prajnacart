import { Router } from 'express';
import { 
  getAdminDashboard, getSellers, updateSellerStatus, getUsers, toggleUserStatus, 
  createBanner, deleteBanner 
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/sellers', getSellers);
router.patch('/sellers/:id/status', updateSellerStatus);
router.get('/users', getUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.post('/banners', createBanner);
router.delete('/banners/:id', deleteBanner);

export default router;
