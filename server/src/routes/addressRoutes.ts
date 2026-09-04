import { Router } from 'express';
import { 
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress 
} from '../controllers/addressController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
