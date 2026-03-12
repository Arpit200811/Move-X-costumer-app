import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  cart: {}, // Format: { [productId]: quantity }
  vendorId: null,

  addItem: (product, vendorId) => set((state) => {
    if (state.vendorId && state.vendorId !== vendorId) {
      return state;
    }
    
    const pid = product._id || product.id;
    const currentQty = state.cart[pid] || 0;
    return {
      vendorId,
      cart: { ...state.cart, [pid]: currentQty + 1 }
    };
  }),

  removeItem: (productId) => set((state) => {
    const currentQty = state.cart[productId] || 0;

    if (currentQty <= 1) {
      const newCart = { ...state.cart };
      delete newCart[productId];
      
      // If cart is empty, reset vendor
      if (Object.keys(newCart).length === 0) {
        return { cart: newCart, vendorId: null };
      }
      return { cart: newCart };
    }

    return {
      cart: { ...state.cart, [productId]: currentQty - 1 }
    };
  }),

  clearCart: () => set({ cart: {}, vendorId: null }),

  getSummary: (products) => {
    const state = get();
    let totalItems = 0;
    let totalPrice = 0;
    const itemsList = [];

    Object.keys(state.cart).forEach(id => {
      const product = products.find(p => (p._id === id || p.id === id));
      if (product) {
        const qty = state.cart[id];
        totalItems += qty;
        totalPrice += (product.price.toString().replace('₹', '') * qty);
        itemsList.push({ ...product, quantity: qty });
      }
    });

    return { totalItems, totalPrice: totalPrice.toFixed(2), itemsList };
  }
}));

export default useCartStore;
