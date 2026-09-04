import { Router } from 'express';
import { getProductReviews, addReview, markReviewHelpful } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, addReview);
router.post('/:id/helpful', markReviewHelpful);

export default router;
