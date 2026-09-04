import { dbStore } from '../db/index.js';

export interface InventoryCheckResult {
  isAvailable: boolean;
  message?: string;
  currentStock: number;
}

export const checkStockAvailability = (
  productId: string,
  variantId?: string,
  requestedQuantity: number = 1
): InventoryCheckResult => {
  const product = dbStore.products.find(p => p.id === productId && p.isActive);
  if (!product) {
    return { isAvailable: false, message: 'Product not found or inactive', currentStock: 0 };
  }

  if (variantId) {
    const variant = product.variants?.find(v => v.id === variantId);
    if (!variant) {
      return { isAvailable: false, message: 'Product variant not found', currentStock: 0 };
    }
    if (variant.stockQuantity < requestedQuantity) {
      return {
        isAvailable: false,
        message: `Only ${variant.stockQuantity} item(s) left in stock for selected variant.`,
        currentStock: variant.stockQuantity,
      };
    }
    return { isAvailable: true, currentStock: variant.stockQuantity };
  }

  if (product.stockQuantity < requestedQuantity) {
    return {
      isAvailable: false,
      message: `Only ${product.stockQuantity} item(s) left in stock.`,
      currentStock: product.stockQuantity,
    };
  }

  return { isAvailable: true, currentStock: product.stockQuantity };
};

export const deductStock = (
  productId: string,
  variantId: string | undefined,
  quantity: number
): boolean => {
  const product = dbStore.products.find(p => p.id === productId);
  if (!product) return false;

  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      variant.stockQuantity = Math.max(0, variant.stockQuantity - quantity);
    }
  }

  product.stockQuantity = Math.max(0, product.stockQuantity - quantity);
  return true;
};

export const restoreStock = (
  productId: string,
  variantId: string | undefined,
  quantity: number
): boolean => {
  const product = dbStore.products.find(p => p.id === productId);
  if (!product) return false;

  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      variant.stockQuantity += quantity;
    }
  }

  product.stockQuantity += quantity;
  return true;
};
