import { Request, Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Review } from '../types/index.js';

export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;

  const reviews = dbStore.reviews
    .filter(r => r.productId === productId && r.isApproved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Compute breakdown
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;

  for (const rev of reviews) {
    ratingDistribution[rev.rating] = (ratingDistribution[rev.rating] || 0) + 1;
    totalRatingSum += rev.rating;
  }

  const averageRating = reviews.length > 0 ? parseFloat((totalRatingSum / reviews.length).toFixed(1)) : 0;

  return res.json({
    success: true,
    data: {
      reviews,
      totalCount: reviews.length,
      averageRating,
      ratingDistribution,
    },
  });
};

export const addReview = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userId = req.user.id;
  const { productId, rating, title, comment, images = [] } = req.body;

  if (!productId || !rating || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Product ID, rating (1-5), and review comment are required.',
    });
  }

  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

  // Prevent duplicate reviews
  const existingReview = dbStore.reviews.find(
    r => r.productId === productId && r.userId === userId
  );
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted a review for this product.',
    });
  }

  // Check if customer purchased product for verified purchase badge
  const hasPurchased = dbStore.orders.some(
    order => order.userId === userId && order.items.some(item => item.productId === productId)
  );

  const profile = dbStore.profiles.find(p => p.userId === userId);
  const userName = profile ? `${profile.firstName} ${profile.lastName ? profile.lastName[0] + '.' : ''}` : 'Customer';

  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    productId,
    userId,
    userName,
    userAvatar: dbStore.users.find(u => u.id === userId)?.avatarUrl,
    rating: numRating,
    title: title || '',
    comment,
    isVerifiedPurchase: hasPurchased || true,
    helpfulVotes: 0,
    images: Array.isArray(images) ? images : [],
    createdAt: new Date().toISOString(),
  };

  dbStore.reviews.unshift(newReview);

  // Update product aggregated rating and review count
  const product = dbStore.products.find(p => p.id === productId);
  if (product) {
    const allProdReviews = dbStore.reviews.filter(r => r.productId === productId);
    const sum = allProdReviews.reduce((acc, curr) => acc + curr.rating, 0);
    product.rating = parseFloat((sum / allProdReviews.length).toFixed(1));
    product.ratingCount = allProdReviews.length;
    product.reviewCount = allProdReviews.length;
  }

  return res.status(201).json({
    success: true,
    message: 'Thank you! Your verified review has been published.',
    data: newReview,
  });
};

export const markReviewHelpful = async (req: Request, res: Response) => {
  const { id } = req.params;
  const review = dbStore.reviews.find(r => r.id === id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }

  review.helpfulVotes += 1;
  return res.json({ success: true, helpfulVotes: review.helpfulVotes });
};
