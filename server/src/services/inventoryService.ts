import { pool } from '../db/index.js';

export interface InventoryCheckResult {
  isAvailable: boolean;
  message?: string;
  currentStock: number;
}

/**
 * Check whether requested quantity is available.
 *
 * Rules:
 * - variantId present  -> use that variant's inventory row
 * - variantId missing  -> use product-level inventory row (variant_id IS NULL)
 * - available_stock is the source of truth
 */
export const checkStockAvailability = async (
  productId: string,
  variantId?: string,
  requestedQuantity: number = 1
): Promise<InventoryCheckResult> => {
  const quantity = Math.max(1, Number(requestedQuantity) || 1);

  try {
    if (variantId) {
      const result = await pool.query(
        `
        SELECT
          p.id AS product_id,
          p.is_active,
          pv.id AS variant_id,
          i.available_stock
        FROM products p
        INNER JOIN product_variants pv
          ON pv.id = $2
         AND pv.product_id = p.id
        INNER JOIN inventory i
          ON i.product_id = p.id
         AND i.variant_id = pv.id
        WHERE p.id = $1
        LIMIT 1
        `,
        [productId, variantId]
      );

      const row = result.rows[0];

      if (!row) {
        return {
          isAvailable: false,
          message:
            'Product variant not found or inventory record is unavailable.',
          currentStock: 0,
        };
      }

      if (!row.is_active) {
        return {
          isAvailable: false,
          message: 'Product not found or inactive.',
          currentStock: 0,
        };
      }

      const currentStock = Number(row.available_stock || 0);

      if (currentStock < quantity) {
        return {
          isAvailable: false,
          message: `Only ${currentStock} item(s) left in stock for selected variant.`,
          currentStock,
        };
      }

      return {
        isAvailable: true,
        currentStock,
      };
    }

    const result = await pool.query(
      `
      SELECT
        p.id AS product_id,
        p.is_active,
        i.available_stock
      FROM products p
      INNER JOIN inventory i
        ON i.product_id = p.id
       AND i.variant_id IS NULL
      WHERE p.id = $1
      LIMIT 1
      `,
      [productId]
    );

    const row = result.rows[0];

    if (!row) {
      return {
        isAvailable: false,
        message:
          'Product not found or inventory record is unavailable.',
        currentStock: 0,
      };
    }

    if (!row.is_active) {
      return {
        isAvailable: false,
        message: 'Product not found or inactive.',
        currentStock: 0,
      };
    }

    const currentStock = Number(row.available_stock || 0);

    if (currentStock < quantity) {
      return {
        isAvailable: false,
        message: `Only ${currentStock} item(s) left in stock.`,
        currentStock,
      };
    }

    return {
      isAvailable: true,
      currentStock,
    };
  } catch (error: any) {
    console.error(
      'Inventory stock check error:',
      error.message
    );

    return {
      isAvailable: false,
      message:
        'Unable to verify stock availability right now.',
      currentStock: 0,
    };
  }
};

/**
 * Deduct stock after a confirmed order/payment.
 *
 * For a variant:
 * - deduct from variant inventory
 * - deduct from product-level aggregate inventory
 * - deduct product stock_quantity
 *
 * For a product without variant:
 * - deduct from product-level inventory
 * - deduct product stock_quantity
 *
 * Returns true only when stock was successfully deducted.
 */
export const deductStock = async (
  productId: string,
  variantId: string | undefined,
  quantity: number
): Promise<boolean> => {
  const qty = Math.max(1, Number(quantity) || 1);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (variantId) {
      const variantResult = await client.query(
        `
        UPDATE inventory i
        SET
          total_stock = i.total_stock - $1,
          available_stock = i.available_stock - $1,
          updated_at = CURRENT_TIMESTAMP
        FROM products p
        INNER JOIN product_variants pv
          ON pv.id = i.variant_id
         AND pv.product_id = p.id
        WHERE i.product_id = $2
          AND i.variant_id = $3
          AND p.is_active = TRUE
          AND i.available_stock >= $1
        RETURNING i.product_id, i.variant_id
        `,
        [qty, productId, variantId]
      );

      if (variantResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const aggregateResult = await client.query(
        `
        UPDATE inventory
        SET
          total_stock = total_stock - $1,
          available_stock = available_stock - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
          AND variant_id IS NULL
          AND available_stock >= $1
        RETURNING product_id
        `,
        [qty, productId]
      );

      if (aggregateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const productResult = await client.query(
        `
        UPDATE products
        SET
          stock_quantity = GREATEST(0, stock_quantity - $1),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
        `,
        [qty, productId]
      );

      if (productResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const variantUpdateResult = await client.query(
        `
        UPDATE product_variants
        SET
          stock_quantity = GREATEST(0, stock_quantity - $1)
        WHERE id = $2
          AND product_id = $3
        RETURNING id
        `,
        [qty, variantId, productId]
      );

      if (variantUpdateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }
    } else {
      const inventoryResult = await client.query(
        `
        UPDATE inventory
        SET
          total_stock = total_stock - $1,
          available_stock = available_stock - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
          AND variant_id IS NULL
          AND available_stock >= $1
        RETURNING product_id
        `,
        [qty, productId]
      );

      if (inventoryResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const productResult = await client.query(
        `
        UPDATE products
        SET
          stock_quantity = GREATEST(0, stock_quantity - $1),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
        `,
        [qty, productId]
      );

      if (productResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error: any) {
    await client.query('ROLLBACK');

    console.error(
      'Deduct stock error:',
      error.message
    );

    return false;
  } finally {
    client.release();
  }
};

/**
 * Restore stock after cancellation/refund/rollback.
 *
 * For a variant:
 * - restore variant inventory
 * - restore product-level aggregate inventory
 * - restore product stock_quantity
 *
 * For a product without variant:
 * - restore product-level inventory
 * - restore product stock_quantity
 */
export const restoreStock = async (
  productId: string,
  variantId: string | undefined,
  quantity: number
): Promise<boolean> => {
  const qty = Math.max(1, Number(quantity) || 1);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (variantId) {
      const variantResult = await client.query(
        `
        UPDATE inventory
        SET
          total_stock = total_stock + $1,
          available_stock = available_stock + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
          AND variant_id = $3
        RETURNING product_id, variant_id
        `,
        [qty, productId, variantId]
      );

      if (variantResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const aggregateResult = await client.query(
        `
        UPDATE inventory
        SET
          total_stock = total_stock + $1,
          available_stock = available_stock + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
          AND variant_id IS NULL
        RETURNING product_id
        `,
        [qty, productId]
      );

      if (aggregateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const productResult = await client.query(
        `
        UPDATE products
        SET
          stock_quantity = stock_quantity + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
        `,
        [qty, productId]
      );

      if (productResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const variantUpdateResult = await client.query(
        `
        UPDATE product_variants
        SET
          stock_quantity = stock_quantity + $1
        WHERE id = $2
          AND product_id = $3
        RETURNING id
        `,
        [qty, variantId, productId]
      );

      if (variantUpdateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }
    } else {
      const inventoryResult = await client.query(
        `
        UPDATE inventory
        SET
          total_stock = total_stock + $1,
          available_stock = available_stock + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
          AND variant_id IS NULL
        RETURNING product_id
        `,
        [qty, productId]
      );

      if (inventoryResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const productResult = await client.query(
        `
        UPDATE products
        SET
          stock_quantity = stock_quantity + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
        `,
        [qty, productId]
      );

      if (productResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error: any) {
    await client.query('ROLLBACK');

    console.error(
      'Restore stock error:',
      error.message
    );

    return false;
  } finally {
    client.release();
  }
};