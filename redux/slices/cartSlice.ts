import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from './productSlice';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  ownerKey: string;
  items: CartItem[];
}

const getStoredOwnerKey = () => {
  if (typeof window === 'undefined') return 'anonymous';
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null') as { id?: string; _id?: string; email?: string } | null;
    return user?.id || user?._id || user?.email || 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const loadCart = (ownerKey = getStoredOwnerKey()): CartState => {
  if (typeof window === 'undefined') return { ownerKey, items: [] };
  try {
    const saved = localStorage.getItem(`cart:${ownerKey}`);
    if (saved) return { ownerKey, ...JSON.parse(saved) } as CartState;
    const legacyCart = localStorage.getItem('cart');
    return legacyCart && ownerKey !== 'anonymous'
      ? { ownerKey, ...JSON.parse(legacyCart) } as CartState
      : { ownerKey, items: [] };
  } catch {
    return { ownerKey, items: [] };
  }
};

const persist = (state: CartState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`cart:${state.ownerKey}`, JSON.stringify({ items: state.items }));
    localStorage.removeItem('cart');
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCart(),
  reducers: {
    setCartOwner: (_state, action: PayloadAction<string>) => loadCart(action.payload),
    addToCart: (state, action: PayloadAction<Product>) => {
      const existing = state.items.find((item) => item.product._id === action.payload._id);
      if (existing) existing.quantity = Math.min(existing.quantity + 1, action.payload.stock);
      else state.items.push({ product: action.payload, quantity: 1 });
      persist(state);
    },
    updateCartQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((entry) => entry.product._id === action.payload.productId);
      if (!item) return;
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter((entry) => entry.product._id !== action.payload.productId);
      } else {
        item.quantity = Math.min(action.payload.quantity, item.product.stock);
      }
      persist(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.product._id !== action.payload);
      persist(state);
    },
    clearCart: (state) => {
      state.items = [];
      persist(state);
    },
  },
});

export const { addToCart, updateCartQuantity, removeFromCart, clearCart, setCartOwner } = cartSlice.actions;
export default cartSlice.reducer;