import { createSlice } from '@reduxjs/toolkit';

const initialItems = JSON.parse(localStorage.getItem('ironforge_cart') || '[]');

function getProductId(product) {
  return String(product?.id || product?._id || '');
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: initialItems },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const productId = getProductId(product);
      const existing = state.items.find((item) => getProductId(item.product) === productId);
      if (existing) existing.quantity += 1;
      else state.items.push({ product, quantity: 1 });
      localStorage.setItem('ironforge_cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((entry) => getProductId(entry.product) === String(id));
      if (item) item.quantity = Math.max(1, quantity);
      localStorage.setItem('ironforge_cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => getProductId(item.product) !== String(action.payload));
      localStorage.setItem('ironforge_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('ironforge_cart');
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
