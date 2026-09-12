import { Request, Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Review } from '../types/index.js';

// ============================================================
// GET PRODUCT REVIEWS
// ============================================================

export const getProductReviews = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.product_id,
        r.user_id,
        r.order_id,
        r.rating,
        r.title,
        r.comment,
        r.is_verified_purchase,
        r.is_approved,
        r.helpful_votes,
        r.created_at,

        p.first_name,
        p.last_name,

        u.avatar_url AS user_avatar,

        COALESCE(
          (
            SELECT json_agg(
              ri.image_url
              ORDER BY ri.created_at ASC
            )
            FROM review_images ri
            WHERE ri.review_id = r.id
          ),
          '[]'::json
        ) AS images

      FROM reviews r

      LEFT JOIN profiles p
        ON p.user_id = r.user_id

      LEFT JOIN users u
        ON u.id = r.user_id

      WHERE r.product_id = $1
        AND COALESCE(r.is_approved, TRUE) = TRUE

      ORDER BY r.created_at DESC
      `,
      [productId]
    );

    const reviews: Review[] = result.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      userId: row.user_id,

      userName:
        [row.first_name, row.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Customer',

      userAvatar:
        row.user_avatar ?? undefined,

      orderId:
        row.order_id ?? undefined,

      rating: Number(row.rating),

      title:
        row.title ?? undefined,

      comment: row.comment,

      isVerifiedPurchase:
        Boolean(row.is_verified_purchase),

      isApproved:
        row.is_approved === null
          ? true
          : Boolean(row.is_approved),

      helpfulVotes:
        Number(row.helpful_votes || 0),

      images:
        Array.isArray(row.images)
          ? row.images
          : [],

      createdAt:
        new Date(row.created_at).toISOString(),
    }));

    const ratingDistribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRatingSum = 0;

    for (const review of reviews) {
      ratingDistribution[review.rating] =
        (ratingDistribution[review.rating] || 0) + 1;

      totalRatingSum += review.rating;
    }

    const averageRating =
      reviews.length > 0
        ? parseFloat(
            (
              totalRatingSum / reviews.length
            ).toFixed(1)
          )
        : 0;

    return res.json({
      success: true,
      data: {
        reviews,
        totalCount: reviews.length,
        averageRating,
        ratingDistribution,
      },
    });
  } catch (error: any) {
    console.error(
      'Get product reviews error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load product reviews.',
    });
  }
};

// ============================================================
// ADD REVIEW
// ============================================================

export const addReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const userId = req.user.id;

  const {
    productId,
    rating,
    title,
    comment,
    images = [],
  } = req.body;

  if (!productId || rating === undefined || !comment) {
    return res.status(400).json({
      success: false,
      message:
        'Product ID, rating (1-5), and review comment are required.',
    });
  }

  const parsedRating = parseInt(
    String(rating),
    10
  );

  if (
    Number.isNaN(parsedRating) ||
    parsedRating < 1 ||
    parsedRating > 5
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Rating must be between 1 and 5.',
    });
  }

  const numRating = parsedRating;

  try {
    // ----------------------------------------------------------
    // 1. Verify product exists and is active
    // ----------------------------------------------------------

    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [productId]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Product not found or inactive.',
      });
    }

    // ----------------------------------------------------------
    // 2. Prevent duplicate review
    // ----------------------------------------------------------

    const existingReviewResult =
      await pool.query(
        `
        SELECT id
        FROM reviews
        WHERE product_id = $1
          AND user_id = $2
        LIMIT 1
        `,
        [productId, userId]
      );

    if ((existingReviewResult.rowCount ?? 0) > 0) {
      return res.status(400).json({
        success: false,
        message:
          'You have already submitted a review for this product.',
      });
    }

    // ----------------------------------------------------------
    // 3. Check verified purchase
    // ----------------------------------------------------------

    const purchaseResult = await pool.query(
      `
      SELECT
        o.id AS order_id

      FROM orders o

      INNER JOIN order_items oi
        ON oi.order_id = o.id

      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND LOWER(o.payment_status) = 'paid'
        AND LOWER(o.order_status) IN (
          'placed',
          'confirmed',
          'processing',
          'packed',
          'shipped',
          'out_for_delivery',
          'delivered'
        )

      ORDER BY o.placed_at DESC
      LIMIT 1
      `,
      [userId, productId]
    );

    const isVerifiedPurchase =
  (purchaseResult.rowCount ?? 0) > 0;

    const orderId =
      purchaseResult.rows[0]?.order_id ?? null;

    // ----------------------------------------------------------
    // 4. Get user profile
    // ----------------------------------------------------------

    const userResult = await pool.query(
      `
      SELECT
        u.avatar_url,
        p.first_name,
        p.last_name

      FROM users u

      LEFT JOIN profiles p
        ON p.user_id = u.id

      WHERE u.id = $1
      LIMIT 1
      `,
      [userId]
    );

    const userRow = userResult.rows[0];

    const userName =
      userRow
        ? [userRow.first_name, userRow.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Customer'
        : 'Customer';

    const userAvatar =
      userRow?.avatar_url || undefined;

    // ----------------------------------------------------------
    // 5. Normalize review data
    // ----------------------------------------------------------

    const reviewId =
      `rev_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}`;

    const reviewTitle =
      typeof title === 'string'
        ? title.trim()
        : '';

    const reviewComment =
      String(comment).trim();

    if (!reviewComment) {
      return res.status(400).json({
        success: false,
        message:
          'Review comment cannot be empty.',
      });
    }

    const reviewImages: string[] =
      Array.isArray(images)
        ? images.filter(
            (image): image is string =>
              typeof image === 'string' &&
              image.trim().length > 0
          )
        : [];

    // ----------------------------------------------------------
    // 6. Transaction
    // ----------------------------------------------------------

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // --------------------------------------------------------
      // Insert review
      // --------------------------------------------------------

      const reviewResult =
        await client.query(
          `
          INSERT INTO reviews (
            id,
            product_id,
            user_id,
            order_id,
            rating,
            title,
            comment,
            is_verified_purchase,
            is_approved,
            helpful_votes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            TRUE,
            0
          )
          RETURNING
            id,
            product_id,
            user_id,
            order_id,
            rating,
            title,
            comment,
            is_verified_purchase,
            is_approved,
            helpful_votes,
            created_at
          `,
          [
            reviewId,
            productId,
            userId,
            orderId,
            numRating,
            reviewTitle,
            reviewComment,
            isVerifiedPurchase,
          ]
        );

      // --------------------------------------------------------
      // Insert review images
      // --------------------------------------------------------

      for (const imageUrl of reviewImages) {
        await client.query(
          `
          INSERT INTO review_images (
            id,
            review_id,
            image_url
          )
          VALUES (
            $1,
            $2,
            $3
          )
          `,
          [
            `revimg_${Date.now()}_${Math.floor(
              Math.random() * 100000
            )}`,
            reviewId,
            imageUrl,
          ]
        );
      }

      // --------------------------------------------------------
      // Recalculate product rating/counts
      // --------------------------------------------------------

      const aggregateResult =
        await client.query(
          `
          SELECT
            COUNT(*)::int AS review_count,
            COALESCE(
              AVG(rating),
              0
            ) AS average_rating

          FROM reviews

          WHERE product_id = $1
            AND COALESCE(
              is_approved,
              TRUE
            ) = TRUE
          `,
          [productId]
        );

      const reviewCount =
        Number(
          aggregateResult.rows[0]
            ?.review_count || 0
        );

      const averageRating =
        Number(
          Number(
            aggregateResult.rows[0]
              ?.average_rating || 0
          ).toFixed(1)
        );

      await client.query(
        `
        UPDATE products
        SET
          rating = $1,
          rating_count = $2,
          review_count = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [
          averageRating,
          reviewCount,
          productId,
        ]
      );

      await client.query('COMMIT');

      // --------------------------------------------------------
      // Build API response
      // --------------------------------------------------------

      const inserted =
        reviewResult.rows[0];

      const newReview: Review = {
        id: inserted.id,
        productId:
          inserted.product_id,
        userId:
          inserted.user_id,

        userName,

        userAvatar,

        orderId:
          inserted.order_id ||
          undefined,

        rating:
          Number(inserted.rating),

        title:
          inserted.title ||
          undefined,

        comment:
          inserted.comment,

        isVerifiedPurchase:
          Boolean(
            inserted.is_verified_purchase
          ),

        isApproved:
          inserted.is_approved === null
            ? true
            : Boolean(
                inserted.is_approved
              ),

        helpfulVotes:
          Number(
            inserted.helpful_votes || 0
          ),

        images:
          reviewImages,

        createdAt:
          new Date(
            inserted.created_at
          ).toISOString(),
      };

      return res.status(201).json({
        success: true,

        message: isVerifiedPurchase
          ? 'Thank you! Your verified purchase review has been published.'
          : 'Thank you! Your review has been submitted.',

        data: newReview,
      });
    } catch (error) {
      await client.query(
        'ROLLBACK'
      );

      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(
      'Add review error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to submit review.',
    });
  }
};

// ============================================================
// MARK REVIEW HELPFUL
// ============================================================

export const markReviewHelpful = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE reviews
      SET
        helpful_votes =
          helpful_votes + 1
      WHERE id = $1
      RETURNING
        id,
        helpful_votes
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    return res.json({
      success: true,
      helpfulVotes: Number(
        result.rows[0].helpful_votes
      ),
    });
  } catch (error: any) {
    console.error(
      'Mark review helpful error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to mark review as helpful.',
    });
  }
};