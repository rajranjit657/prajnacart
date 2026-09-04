import { create } from 'zustand';
import api from '../lib/api';
import { Product, WishlistItem } from '../types';
import { toast } from './toastStore';
import { useCartStore } from './cartStore';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  moveToCart: (product: Product, variantId?: string) => Promise<boolean>;
}

const getAuthToken = () => localStorage.getItem('prajnacart_token') || localStorage.getItem('novamart_token');

const loadGuestWishlist = (): WishlistItem[] => {
  try {
    const saved = localStorage.getItem('prajnacart_guest_wishlist') || localStorage.getItem('novamart_guest_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items: WishlistItem[]) => {
  localStorage.setItem('prajnacart_guest_wishlist', JSON.stringify(items));
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: loadGuestWishlist(),
  isLoading: false,

  fetchWishlist: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ items: loadGuestWishlist() });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get('/wishlist');
      set({ items: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.productId === productId);
  },

  toggleWishlist: async (product) => {
    const token = getAuthToken();

    if (token) {
      try {
        const res = await api.post('/wishlist/toggle', { productId: product.id });
        const isAdded = res.data.data.isAdded;
        await get().fetchWishlist();
        if (isAdded) {
          toast.success(`Saved "${product.title.slice(0, 20)}..." to Wishlist!`);
        } else {
          toast.info('Removed from Wishlist');
        }
        return isAdded;
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update wishlist.');
        return false;
      }
    }

    // Guest Wishlist
    const exists = get().isInWishlist(product.id);
    let updated: WishlistItem[];
    if (exists) {
      updated = get().items.filter((i) => i.productId !== product.id);
      toast.info('Removed from Wishlist');
    } else {
      updated = [...get().items, { id: `wish_${Date.now()}`, productId: product.id, product }];
      toast.success(`Saved "${product.title.slice(0, 20)}..." to Wishlist!`);
    }

    saveGuestWishlist(updated);
    set({ items: updated });
    return !exists;
  },

  moveToCart: async (product, variantId) => {
    const addItem = useCartStore.getState().addItem;
    const added = await addItem(product, undefined, 1);
    if (added) {
      await get().toggleWishlist(product);
      return true;
    }
    return false;
  },
}));
