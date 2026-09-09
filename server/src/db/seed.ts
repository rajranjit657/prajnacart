import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import pg from 'pg';
import {
  seedUsers,
  seedProfiles,
  seedSellers,
  seedAddresses,
  seedCategories,
  seedBrands,
  seedBanners,
  seedCoupons,
  seedProducts,
  seedReviews,
  seedOrders,
} from './seedData.js';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the PostgreSQL seed script.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : undefined,
});

const json = (value: unknown) => JSON.stringify(value ?? null);

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting PRAJNACART PostgreSQL seed...');

    // 1. USERS
    for (const u of seedUsers) {
      await client.query(
        `INSERT INTO users
          (id, email, password_hash, phone, role, is_active, is_email_verified, avatar_url, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           email=EXCLUDED.email,
           password_hash=EXCLUDED.password_hash,
           phone=EXCLUDED.phone,
           role=EXCLUDED.role,
           is_active=EXCLUDED.is_active,
           is_email_verified=EXCLUDED.is_email_verified,
           avatar_url=EXCLUDED.avatar_url,
           updated_at=EXCLUDED.updated_at`,
        [u.id, u.email, u.passwordHash, u.phone ?? null, u.role, u.isActive, u.isEmailVerified, u.avatarUrl ?? null, u.createdAt, u.updatedAt]
      );
    }

    // 2. PROFILES
    for (const p of seedProfiles) {
      await client.query(
        `INSERT INTO profiles
          (id, user_id, first_name, last_name, gender, date_of_birth, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           user_id=EXCLUDED.user_id,
           first_name=EXCLUDED.first_name,
           last_name=EXCLUDED.last_name,
           gender=EXCLUDED.gender,
           date_of_birth=EXCLUDED.date_of_birth,
           updated_at=EXCLUDED.updated_at`,
        [p.id, p.userId, p.firstName, p.lastName ?? null, p.gender ?? null, p.dateOfBirth ?? null, p.createdAt, p.updatedAt]
      );
    }

    // 3. SELLERS
    for (const s of seedSellers) {
      await client.query(
        `INSERT INTO sellers
          (id, user_id, store_name, store_slug, business_email, business_phone,
           gstin, pan, bank_account_name, bank_account_number, bank_ifsc, bank_name,
           status, rating, rating_count, commission_rate, pickup_address, logo_url,
           banner_url, description, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
         ON CONFLICT (id) DO UPDATE SET
           user_id=EXCLUDED.user_id,
           store_name=EXCLUDED.store_name,
           store_slug=EXCLUDED.store_slug,
           business_email=EXCLUDED.business_email,
           business_phone=EXCLUDED.business_phone,
           gstin=EXCLUDED.gstin,
           pan=EXCLUDED.pan,
           bank_account_name=EXCLUDED.bank_account_name,
           bank_account_number=EXCLUDED.bank_account_number,
           bank_ifsc=EXCLUDED.bank_ifsc,
           bank_name=EXCLUDED.bank_name,
           status=EXCLUDED.status,
           rating=EXCLUDED.rating,
           rating_count=EXCLUDED.rating_count,
           commission_rate=EXCLUDED.commission_rate,
           pickup_address=EXCLUDED.pickup_address,
           logo_url=EXCLUDED.logo_url,
           banner_url=EXCLUDED.banner_url,
           description=EXCLUDED.description,
           updated_at=EXCLUDED.updated_at`,
        [
          s.id, s.userId, s.storeName, s.storeSlug, s.businessEmail, s.businessPhone,
          s.gstin ?? null, s.pan ?? null, s.bankAccountName ?? null, s.bankAccountNumber ?? null,
          s.bankIfsc ?? null, s.bankName ?? null, s.status, s.rating, s.ratingCount,
          s.commissionRate, null,
          s.logoUrl ?? null, s.bannerUrl ?? null, s.description ?? null, s.createdAt, s.updatedAt,
        ]
      );
    }

    // 4. ADDRESSES
    for (const a of seedAddresses) {
      await client.query(
        `INSERT INTO addresses
          (id, user_id, full_name, phone, alternate_phone, address_line1, address_line2,
           landmark, city, state, postal_code, country, address_type, is_default, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           user_id=EXCLUDED.user_id,
           full_name=EXCLUDED.full_name,
           phone=EXCLUDED.phone,
           alternate_phone=EXCLUDED.alternate_phone,
           address_line1=EXCLUDED.address_line1,
           address_line2=EXCLUDED.address_line2,
           landmark=EXCLUDED.landmark,
           city=EXCLUDED.city,
           state=EXCLUDED.state,
           postal_code=EXCLUDED.postal_code,
           country=EXCLUDED.country,
           address_type=EXCLUDED.address_type,
           is_default=EXCLUDED.is_default,
           updated_at=EXCLUDED.updated_at`,
        [
          a.id, a.userId, a.fullName, a.phone, a.alternatePhone ?? null, a.addressLine1,
          a.addressLine2 ?? null, a.landmark ?? null, a.city, a.state, a.postalCode,
          a.country, a.addressType, a.isDefault, a.createdAt, a.updatedAt,
        ]
      );
    }

    // 5. CATEGORIES + SUBCATEGORIES
    for (const c of seedCategories) {
      await client.query(
        `INSERT INTO categories
          (id, name, slug, description, image_url, icon_name, display_order, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name,
           slug=EXCLUDED.slug,
           description=EXCLUDED.description,
           image_url=EXCLUDED.image_url,
           icon_name=EXCLUDED.icon_name,
           display_order=EXCLUDED.display_order,
           is_active=EXCLUDED.is_active,
           updated_at=EXCLUDED.updated_at`,
        [c.id, c.name, c.slug, c.description ?? null, c.imageUrl ?? null, c.iconName ?? null, c.displayOrder, c.isActive, c.createdAt, c.updatedAt]
      );

      for (const sc of c.subcategories ?? []) {
        await client.query(
          `INSERT INTO subcategories
            (id, category_id, name, slug, description, image_url, display_order, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET
             category_id=EXCLUDED.category_id,
             name=EXCLUDED.name,
             slug=EXCLUDED.slug,
             description=EXCLUDED.description,
             image_url=EXCLUDED.image_url,
             display_order=EXCLUDED.display_order,
             is_active=EXCLUDED.is_active,
             updated_at=EXCLUDED.updated_at`,
          [sc.id, sc.categoryId, sc.name, sc.slug, sc.description ?? null, sc.imageUrl ?? null, sc.displayOrder, sc.isActive, c.createdAt, c.updatedAt]
        );
      }
    }

    // 6. BRANDS
    for (const b of seedBrands) {
      await client.query(
        `INSERT INTO brands
          (id, name, slug, logo_url, description, is_featured, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name,
           slug=EXCLUDED.slug,
           logo_url=EXCLUDED.logo_url,
           description=EXCLUDED.description,
           is_featured=EXCLUDED.is_featured`,
        [b.id, b.name, b.slug, null, null, b.isFeatured, b.createdAt]
      );
    }

    // 7. BANNERS
    for (const b of seedBanners) {
      await client.query(
        `INSERT INTO banners
          (id, title, subtitle, image_url, mobile_image_url, cta_text, cta_link,
           badge_text, display_order, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           title=EXCLUDED.title,
           subtitle=EXCLUDED.subtitle,
           image_url=EXCLUDED.image_url,
           mobile_image_url=EXCLUDED.mobile_image_url,
           cta_text=EXCLUDED.cta_text,
           cta_link=EXCLUDED.cta_link,
           badge_text=EXCLUDED.badge_text,
           display_order=EXCLUDED.display_order,
           is_active=EXCLUDED.is_active`,
        [b.id, b.title, b.subtitle ?? null, b.imageUrl, b.mobileImageUrl ?? null, b.ctaText, b.ctaLink, b.badgeText ?? null, b.displayOrder, b.isActive, null]
      );
    }

    // 8. COUPONS
    for (const c of seedCoupons) {
      await client.query(
        `INSERT INTO coupons
          (id, code, description, discount_type, discount_value, min_order_value,
           max_discount_value, usage_limit, used_count, per_user_limit, start_date, end_date, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (id) DO UPDATE SET
           code=EXCLUDED.code,
           description=EXCLUDED.description,
           discount_type=EXCLUDED.discount_type,
           discount_value=EXCLUDED.discount_value,
           min_order_value=EXCLUDED.min_order_value,
           max_discount_value=EXCLUDED.max_discount_value,
           usage_limit=EXCLUDED.usage_limit,
           used_count=EXCLUDED.used_count,
           per_user_limit=EXCLUDED.per_user_limit,
           start_date=EXCLUDED.start_date,
           end_date=EXCLUDED.end_date,
           is_active=EXCLUDED.is_active`,
        [c.id, c.code, c.description ?? null, c.discountType, c.discountValue, c.minOrderValue, c.maxDiscountValue ?? null, c.usageLimit, c.usedCount, c.perUserLimit, c.startDate ?? null, c.endDate ?? null, c.isActive, null]
      );
    }

    // 9. PRODUCTS + IMAGES + VARIANTS + INVENTORY + SELLER MAPPING
    for (const p of seedProducts) {
      await client.query(
        `INSERT INTO products
          (id, title, slug, sku, short_description, description, category_id, subcategory_id,
           brand_id, brand_name, seller_id, mrp, price, discount_percent, tax_percent,
           stock_quantity, thumbnail_url, rating, rating_count, review_count, is_active,
           is_featured, is_deal_of_the_day, approval_status, warranty_info, return_policy,
           delivery_info, specifications, tags, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
         ON CONFLICT (id) DO UPDATE SET
           title=EXCLUDED.title,
           slug=EXCLUDED.slug,
           sku=EXCLUDED.sku,
           short_description=EXCLUDED.short_description,
           description=EXCLUDED.description,
           category_id=EXCLUDED.category_id,
           subcategory_id=EXCLUDED.subcategory_id,
           brand_id=EXCLUDED.brand_id,
           brand_name=EXCLUDED.brand_name,
           seller_id=EXCLUDED.seller_id,
           mrp=EXCLUDED.mrp,
           price=EXCLUDED.price,
           discount_percent=EXCLUDED.discount_percent,
           tax_percent=EXCLUDED.tax_percent,
           stock_quantity=EXCLUDED.stock_quantity,
           thumbnail_url=EXCLUDED.thumbnail_url,
           rating=EXCLUDED.rating,
           rating_count=EXCLUDED.rating_count,
           review_count=EXCLUDED.review_count,
           is_active=EXCLUDED.is_active,
           is_featured=EXCLUDED.is_featured,
           is_deal_of_the_day=EXCLUDED.is_deal_of_the_day,
           approval_status=EXCLUDED.approval_status,
           warranty_info=EXCLUDED.warranty_info,
           return_policy=EXCLUDED.return_policy,
           delivery_info=EXCLUDED.delivery_info,
           specifications=EXCLUDED.specifications,
           tags=EXCLUDED.tags,
           updated_at=EXCLUDED.updated_at`,
        [
          p.id, p.title, p.slug, p.sku, p.shortDescription ?? null, p.description,
          p.categoryId, p.subcategoryId ?? null, p.brandId ?? null, p.brandName ?? null,
          p.sellerId, p.mrp, p.price, p.discountPercent, p.taxPercent, p.stockQuantity,
          p.thumbnailUrl, p.rating, p.ratingCount, p.reviewCount, p.isActive, p.isFeatured,
          p.isDealOfTheDay, p.approvalStatus, p.warrantyInfo, p.returnPolicy, p.deliveryInfo,
          json(p.specifications ?? []), p.tags ?? [], p.createdAt, p.updatedAt,
        ]
      );

      await client.query('DELETE FROM product_images WHERE product_id = $1', [p.id]);
      for (let i = 0; i < (p.images ?? []).length; i++) {
        await client.query(
          `INSERT INTO product_images
            (id, product_id, image_url, alt_text, display_order, is_thumbnail)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [`${p.id}_img_${i + 1}`, p.id, p.images[i], p.title, i, i === 0]
        );
      }

      await client.query('DELETE FROM product_variants WHERE product_id = $1', [p.id]);
      for (const v of p.variants ?? []) {
        await client.query(
          `INSERT INTO product_variants
            (id, product_id, sku, variant_name, color, color_code, size, storage, ram,
             weight, mrp, price, stock_quantity, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [v.id, p.id, v.sku, v.variantName, v.color ?? null, v.colorCode ?? null, v.size ?? null, v.storage ?? null, v.ram ?? null, v.weight ?? null, v.mrp, v.price, v.stockQuantity, v.imageUrl ?? null]
        );

        await client.query(
          `INSERT INTO inventory
            (id, product_id, variant_id, seller_id, sku, total_stock, reserved_stock, available_stock, low_stock_threshold)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             total_stock=EXCLUDED.total_stock,
             reserved_stock=EXCLUDED.reserved_stock,
             available_stock=EXCLUDED.available_stock,
             low_stock_threshold=EXCLUDED.low_stock_threshold,
             updated_at=CURRENT_TIMESTAMP`,
          [`inv_${v.id}`, p.id, v.id, p.sellerId, v.sku, v.stockQuantity, 0, v.stockQuantity, 5]
        );
      }

      // Base-product inventory (used when the product has no selected variant).
      await client.query(
        `INSERT INTO inventory
          (id, product_id, variant_id, seller_id, sku, total_stock, reserved_stock, available_stock, low_stock_threshold)
         VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           seller_id=EXCLUDED.seller_id,
           sku=EXCLUDED.sku,
           total_stock=EXCLUDED.total_stock,
           reserved_stock=EXCLUDED.reserved_stock,
           available_stock=EXCLUDED.available_stock,
           low_stock_threshold=EXCLUDED.low_stock_threshold,
           updated_at=CURRENT_TIMESTAMP`,
        [`inv_${p.id}`, p.id, p.sellerId, p.sku, p.stockQuantity, 0, p.stockQuantity, 5]
      );

      await client.query(
        `INSERT INTO seller_products (id, seller_id, product_id, price, stock, is_active)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (seller_id, product_id) DO UPDATE SET
           price=EXCLUDED.price,
           stock=EXCLUDED.stock,
           is_active=EXCLUDED.is_active`,
        [`sp_${p.sellerId}_${p.id}`, p.sellerId, p.id, p.price, p.stockQuantity, p.isActive]
      );
    }

    // 10. REVIEWS
    for (const r of seedReviews) {
      await client.query(
        `INSERT INTO reviews
          (id, product_id, user_id, order_id, rating, title, comment, is_verified_purchase,
           is_approved, helpful_votes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           product_id=EXCLUDED.product_id,
           user_id=EXCLUDED.user_id,
           order_id=EXCLUDED.order_id,
           rating=EXCLUDED.rating,
           title=EXCLUDED.title,
           comment=EXCLUDED.comment,
           is_verified_purchase=EXCLUDED.is_verified_purchase,
           is_approved=EXCLUDED.is_approved,
           helpful_votes=EXCLUDED.helpful_votes`,
        [r.id, r.productId, r.userId, r.orderId ?? null, r.rating, r.title ?? null, r.comment, r.isVerifiedPurchase, true, r.helpfulVotes, r.createdAt]
      );
    }

    // 11. ORDERS + ORDER ITEMS + SELLER ORDERS + PAYMENTS
    for (const o of seedOrders) {
      await client.query(
        `INSERT INTO orders
          (id, order_number, user_id, shipping_address, billing_address, items_subtotal,
           discount_amount, coupon_code, coupon_discount, tax_amount, shipping_fee, grand_total,
           payment_method, payment_status, order_status, tracking_id, placed_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (id) DO UPDATE SET
           order_number=EXCLUDED.order_number,
           user_id=EXCLUDED.user_id,
           shipping_address=EXCLUDED.shipping_address,
           billing_address=EXCLUDED.billing_address,
           items_subtotal=EXCLUDED.items_subtotal,
           discount_amount=EXCLUDED.discount_amount,
           coupon_code=EXCLUDED.coupon_code,
           coupon_discount=EXCLUDED.coupon_discount,
           tax_amount=EXCLUDED.tax_amount,
           shipping_fee=EXCLUDED.shipping_fee,
           grand_total=EXCLUDED.grand_total,
           payment_method=EXCLUDED.payment_method,
           payment_status=EXCLUDED.payment_status,
           order_status=EXCLUDED.order_status,
           tracking_id=EXCLUDED.tracking_id,
           placed_at=EXCLUDED.placed_at,
           updated_at=EXCLUDED.updated_at`,
        [o.id, o.orderNumber, o.userId, json(o.shippingAddress), null, o.itemsSubtotal, o.discountAmount, o.couponCode ?? null, o.couponDiscount, o.taxAmount, o.shippingFee, o.grandTotal, o.paymentMethod, o.paymentStatus, o.orderStatus, o.trackingId ?? null, o.placedAt, o.updatedAt]
      );

      await client.query('DELETE FROM order_items WHERE order_id = $1', [o.id]);
      for (const item of o.items ?? []) {
        await client.query(
          `INSERT INTO order_items
            (id, order_id, product_id, variant_id, seller_id, product_title, variant_name,
             thumbnail_url, unit_mrp, unit_price, quantity, total_price, item_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [item.id, o.id, item.productId, item.variantId ?? null, item.sellerId, item.productTitle, item.variantName ?? null, item.thumbnailUrl ?? null, item.unitMrp, item.unitPrice, item.quantity, item.totalPrice, item.itemStatus]
        );
      }

      await client.query('DELETE FROM seller_orders WHERE order_id = $1', [o.id]);
      const sellerGroups = new Map<string, number>();
      for (const item of o.items ?? []) {
        sellerGroups.set(item.sellerId, (sellerGroups.get(item.sellerId) ?? 0) + Number(item.totalPrice));
      }

      for (const [sellerId, subtotal] of sellerGroups) {
        const seller = seedSellers.find((s) => s.id === sellerId);
        const rate = Number(seller?.commissionRate ?? 8);
        const commission = Number((subtotal * rate / 100).toFixed(2));
        const payout = Number((subtotal - commission).toFixed(2));
        const sellerOrderId = `${o.id}_${sellerId}`;

        await client.query(
          `INSERT INTO seller_orders
            (id, order_id, seller_id, seller_subtotal, commission_rate, commission_amount,
             seller_payout_amount, fulfillment_status, payout_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [sellerOrderId, o.id, sellerId, subtotal, rate, commission, payout, o.orderStatus, 'pending']
        );
      }

      await client.query('DELETE FROM payments WHERE order_id = $1', [o.id]);
      await client.query(
        `INSERT INTO payments
          (id, order_id, user_id, payment_gateway, transaction_id, amount, currency, status, gateway_response)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          `pay_${o.id}`,
          o.id,
          o.userId,
          o.paymentMethod === 'razorpay' ? 'razorpay' : 'cod',
          `SEED-${o.orderNumber}`,
          o.grandTotal,
          'INR',
          o.paymentStatus === 'paid' ? 'successful' : o.paymentStatus,
          json({ seeded: true, source: 'seedData.ts' }),
        ]
      );
    }

    // 12. DEMO/SEED NOTIFICATIONS used by the existing UI.
    const notifications = [
      {
        id: 'notif_001',
        userId: 'usr_customer_001',
        title: 'Welcome to Prajnacart!',
        message: 'Use coupon WELCOME100 to get flat ₹100 off on your first order.',
        type: 'promotion',
        link: '/products',
        isRead: false,
        createdAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'notif_002',
        userId: 'usr_customer_001',
        title: 'Order Shipped #NM202608250001',
        message: 'Your Sony WH-1000XM5 Headphones have been dispatched via Delhivery Express.',
        type: 'order',
        link: '/track-order/ord_demo_001',
        isRead: false,
        createdAt: '2026-08-22T16:00:00Z',
      },
    ];

    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications
          (id, user_id, title, message, type, link, is_read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           title=EXCLUDED.title,
           message=EXCLUDED.message,
           type=EXCLUDED.type,
           link=EXCLUDED.link,
           is_read=EXCLUDED.is_read`,
        [n.id, n.userId, n.title, n.message, n.type, n.link, n.isRead, n.createdAt]
      );
    }

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM profiles) AS profiles,
        (SELECT COUNT(*) FROM sellers) AS sellers,
        (SELECT COUNT(*) FROM categories) AS categories,
        (SELECT COUNT(*) FROM subcategories) AS subcategories,
        (SELECT COUNT(*) FROM brands) AS brands,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM product_variants) AS variants,
        (SELECT COUNT(*) FROM inventory) AS inventory,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM order_items) AS order_items,
        (SELECT COUNT(*) FROM seller_orders) AS seller_orders,
        (SELECT COUNT(*) FROM payments) AS payments,
        (SELECT COUNT(*) FROM reviews) AS reviews,
        (SELECT COUNT(*) FROM banners) AS banners,
        (SELECT COUNT(*) FROM notifications) AS notifications
    `);

    console.log('✅ PostgreSQL seed completed successfully.');
    console.table(counts.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL seed failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(async (error) => {
  console.error('❌ PostgreSQL seed failed before transaction:', error);
  await pool.end();
  process.exitCode = 1;
});
