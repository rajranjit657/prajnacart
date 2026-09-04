import { create } from 'zustand';
import api from '../lib/api';
import { CartItem, CartSummary, Product, ProductVariant } from '../types';
import { toast } from './toastStore';

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  syncGuestCart: () => Promise<void>;
}

const defaultSummary: CartSummary = {
  itemCount: 0,
  totalMrp: 0,
  totalSellingPrice: 0,
  totalDiscount: 0,
  deliveryFee: 0,
  packagingFee: 0,
  grandTotal: 0,
  isFreeDelivery: true,
};

const getAuthToken = () => localStorage.getItem('prajnacart_token') || localStorage.getItem('novamart_token');

const calculateGuestSummary = (items: CartItem[]): CartSummary => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalMrp = items.reduce((sum, item) => {
    const mrp = item.variant?.mrp || item.product?.mrp || 0;
    return sum + mrp * item.quantity;
  }, 0);
  const totalSellingPrice = items.reduce((sum, item) => {
    const price = item.variant?.price || item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);
  const totalDiscount = Math.max(0, totalMrp - totalSellingPrice);
  const deliveryFee = totalSellingPrice >= 500 || totalSellingPrice === 0 ? 0 : 40;
  const packagingFee = totalSellingPrice > 0 ? 29 : 0;
  const grandTotal = totalSellingPrice + deliveryFee + packagingFee;

  return {
    itemCount,
    totalMrp,
    totalSellingPrice,
    totalDiscount,
    deliveryFee,
    packagingFee,
    grandTotal,
    isFreeDelivery: deliveryFee === 0 && totalSellingPrice > 0,
  };
};

const loadGuestItems = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('prajnacart_guest_cart') || localStorage.getItem('novamart_guest_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveGuestItems = (items: CartItem[]) => {
  localStorage.setItem('prajnacart_guest_cart', JSON.stringify(items));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: loadGuestItems(),
  summary: calculateGuestSummary(loadGuestItems()),
  isLoading: false,

  fetchCart: async () => {
    const token = getAuthToken();
    if (!token) {
      const guestItems = loadGuestItems();
      set({ items: guestItems, summary: calculateGuestSummary(guestItems) });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get('/cart');
      set({
        items: res.data.data.items,
        summary: res.data.data.summary,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (product, variant, quantity = 1) => {
    const token = getAuthToken();

    if (token) {
      try {
        const res = await api.post('/cart', {
          productId: product.id,
          variantId: variant?.id,
          quantity,
        });
        set({
          items: res.data.data.items,
          summary: res.data.data.summary,
        });
        toast.success(`Added "${product.title.slice(0, 25)}..." to cart!`);
        return true;
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to add item.');
        return false;
      }
    }

    // Guest Cart Logic
    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex(
      (i) => i.productId === product.id && i.variantId === variant?.id
    );

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
    } else {
      currentItems.push({
        id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        variantId: variant?.id,
        quantity,
        product,
        variant,
      });
    }

    saveGuestItems(currentItems);
    set({
      items: currentItems,
      summary: calculateGuestSummary(currentItems),
    });

    toast.success(`Added "${product.title.slice(0, 25)}..." to cart!`);
    return true;
  },

  updateQuantity: async (itemId, quantity) => {
    const token = getAuthToken();

    if (token) {
      try {
        const res = await api.put(`/cart/${itemId}`, { quantity });
        set({
          items: res.data.data.items,
          summary: res.data.data.summary,
        });
        return true;
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update quantity.');
        return false;
      }
    }

    // Guest Cart
    let currentItems = [...get().items];
    if (quantity <= 0) {
      currentItems = currentItems.filter((i) => i.id !== itemId);
    } else {
      const target = currentItems.find((i) => i.id === itemId);
      if (target) target.quantity = quantity;
    }

    saveGuestItems(currentItems);
    set({
      items: currentItems,
      summary: calculateGuestSummary(currentItems),
    });
    return true;
  },

  removeItem: async (itemId) => {
    const token = getAuthToken();

    if (token) {
      try {
        const res = await api.delete(`/cart/${itemId}`);
        set({
          items: res.data.data.items,
          summary: res.data.data.summary,
        });
        toast.info('Item removed from cart');
        return true;
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to remove item.');
        return false;
      }
    }

    const filtered = get().items.filter((i) => i.id !== itemId);
    saveGuestItems(filtered);
    set({
      items: filtered,
      summary: calculateGuestSummary(filtered),
    });
    toast.info('Item removed from cart');
    return true;
  },

  clearCart: async () => {
    const token = getAuthToken();
    if (token) {
      try {
        await api.delete('/cart/clear');
      } catch {
        // silent
      }
    }
    localStorage.removeItem('prajnacart_guest_cart');
    localStorage.removeItem('novamart_guest_cart');
    set({ items: [], summary: defaultSummary });
  },

  syncGuestCart: async () => {
    const guestItems = loadGuestItems();
    if (guestItems.length === 0) return;

    try {
      const res = await api.post('/cart/sync', {
        items: guestItems.map((gi) => ({
          productId: gi.productId,
          variantId: gi.variantId,
          quantity: gi.quantity,
        })),
      });

      localStorage.removeItem('prajnacart_guest_cart');
      localStorage.removeItem('novamart_guest_cart');
      set({
        items: res.data.data.items,
        summary: res.data.data.summary,
      });
    } catch {
      // ignore
    }
  },
}));
