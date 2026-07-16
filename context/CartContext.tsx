// CartContext.tsx - Fix the isGuest logic
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // <-- CHANGED: Added useCallback import
import { Product, ProductVariant } from '@/types/product';
import { Cart, CartItem } from '@/types/cart';
import * as cartAPI from '@/lib/cart';
import { useAuth } from '@/context/AuthContext';

interface CartContextType {
  cart: Cart;
  loading: boolean;
  addingProductId: string | null;
  isGuest: boolean;
  addToCart: (product: Product, quantity: number, selectedVariant?: ProductVariant) => Promise<void>; // ✅ ADD selectedVariant
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
    setBuyNowMode?: (value: boolean) => void; // ← ADD THIS

}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const initialCart: Cart = {
  _id: 'guest-cart',
  user: '',
  items: [],
  totalPrice: 0,
  totalItems: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>(initialCart);
  const [loading, setLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  // ✅ FIX: Properly determine if user is guest (check both user and token)
  const isGuest = !user;

  console.log('🛒 CartProvider state:', { 
    user: user ? 'authenticated' : 'guest', 
    isGuest, 
    authLoading 
  });

  // Load guest cart from localStorage on initial load
  useEffect(() => {
    if (isGuest && !authLoading) {
      console.log('🛒 Loading guest cart on mount');
      loadGuestCart();
    }
  }, [isGuest, authLoading]);

  const loadGuestCart = () => {
    try {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (!parsedCart.items) {
          parsedCart.items = [];
        }
        setCart(parsedCart);
        console.log('🛒 Loaded guest cart from localStorage:', parsedCart);
      } else {
        setCart(initialCart);
        console.log('🛒 No saved guest cart, using initial cart');
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
      setCart(initialCart);
    }
  };

  const saveGuestCart = (guestCart: Cart) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      console.log('🛒 Saved guest cart to localStorage:', guestCart);
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

// In CartContext.tsx - Update the refreshCart function

const refreshCart = useCallback(async () => {
  console.log('🔄 refreshCart called, isGuest:', isGuest, 'authLoading:', authLoading);
  
  if (authLoading) {
    console.log('🔄 Waiting for auth to finish loading');
    return;
  }

  try {
    if (!isGuest && user) {
      // ✅ User is authenticated - fetch from API with FRESH product data
      console.log('🔄 Fetching user cart via API');
      const cartData = await cartAPI.getCart();
      
      // The API already populates fresh product data from database
      // So this will have the updated product names
      setCart(cartData);
      console.log('🛒 Loaded user cart from API:', cartData);
    } else {
      // ✅ User is guest - load from localStorage
      console.log('🔄 Loading guest cart (user is guest)');
      loadGuestCart();
    }
  } catch (error) {
    console.error('Error fetching cart:', error);
    if (isGuest) {
      console.log('🔄 Falling back to guest cart due to error');
      loadGuestCart();
    }
  }
}, [isGuest, authLoading, user]);

  // Refresh cart when auth state changes
  useEffect(() => {
    console.log('🔄 Auth state changed, refreshing cart');
    refreshCart();
  }, [user, authLoading, refreshCart]); // <-- CHANGED: Added refreshCart as dependency

// Line 149 - Update handleGuestAddToCart function signature
const handleGuestAddToCart = (product: Product, quantity: number, selectedVariant?: ProductVariant): Cart => {
  console.log('🛒 handleGuestAddToCart called for product:', product._id, 'variant:', selectedVariant?.variantName);
  
  const guestCart = { 
    ...cart,
    items: cart.items ? [...cart.items] : []
  };
  
  // Check for same variant
  const existingItemIndex = guestCart.items.findIndex(
    item => item && item.product && item.product._id === product._id && 
            item.selectedVariant?._id === selectedVariant?._id
  );
  
  if (existingItemIndex > -1) {
    guestCart.items[existingItemIndex].quantity += quantity;
    guestCart.items[existingItemIndex].price = selectedVariant?.price || product.basePrice;
    guestCart.items[existingItemIndex].updatedAt = new Date().toISOString();
    console.log('🛒 Updated existing item with variant');
  } else {
    const guestItemId = `guest-${product._id}-${selectedVariant?._id || 'base'}-${Date.now()}`;
    
    // ✅ FIX: Ensure variant includes images
    const variantWithImages = selectedVariant ? {
      ...selectedVariant,
      images: selectedVariant.images || [] // ✅ Preserve images
    } : undefined;
    
    const newItem: CartItem = {
      _id: guestItemId,
      product,
      selectedVariant: variantWithImages, // ✅ Store variant with images
      quantity,
      price: selectedVariant?.price || product.basePrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    guestCart.items.push(newItem);
    console.log('🛒 Added new item with variant and images');
  }
  
  // Recalculate totals
  guestCart.totalItems = guestCart.items.reduce((sum, item) => sum + item.quantity, 0);
  guestCart.totalPrice = guestCart.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  guestCart.updatedAt = new Date().toISOString();
  
  saveGuestCart(guestCart);
  
  return guestCart;
};

  const handleGuestUpdateCartItem = (itemId: string, quantity: number): Cart => {
    const guestCart = { 
      ...cart,
      items: cart.items ? [...cart.items] : []
    };
    const itemIndex = guestCart.items.findIndex(item => item._id === itemId);
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        guestCart.items.splice(itemIndex, 1);
      } else {
        guestCart.items[itemIndex].quantity = quantity;
        guestCart.items[itemIndex].updatedAt = new Date().toISOString();
      }
      
      guestCart.totalItems = guestCart.items.reduce((sum, item) => sum + item.quantity, 0);
guestCart.totalPrice = guestCart.items.reduce((sum, item) => 
  sum + (item.price * item.quantity), 0); // ✅ CORRECT: Using item.price    guestCart.updatedAt = new Date().toISOString();
      
      saveGuestCart(guestCart);
    }
    
    return guestCart;
  };

  const handleGuestRemoveFromCart = (itemId: string): Cart => {
    const guestCart = { 
      ...cart,
      items: cart.items ? [...cart.items] : []
    };
    guestCart.items = guestCart.items.filter(item => item._id !== itemId);
    
    guestCart.totalItems = guestCart.items.reduce((sum, item) => sum + item.quantity, 0);
guestCart.totalPrice = guestCart.items.reduce((sum, item) => 
  sum + (item.price * item.quantity), 0); // ✅ CORRECT: Using item.price   guestCart.updatedAt = new Date().toISOString();
    
    saveGuestCart(guestCart);
    
    return guestCart;
  };

  const handleGuestClearCart = (): Cart => {
    const emptyCart = { ...initialCart };
    emptyCart.updatedAt = new Date().toISOString();
    saveGuestCart(emptyCart);
    return emptyCart;
  };

const addToCart = async (product: Product, quantity: number, selectedVariant?: ProductVariant) => {
  console.log('🛒 addToCart called, isGuest:', isGuest, 'variant:', selectedVariant?.variantName);
  console.log('🛒 Variant images:', selectedVariant?.images?.length || 0);
  
  try {
    setAddingProductId(product._id);
    setLoading(true);
    
    if (isGuest) {
      console.log('🛒 Using guest cart handler with variant');
      const updatedCart = handleGuestAddToCart(product, quantity, selectedVariant);
      setCart(updatedCart);
    } else {
      console.log('🛒 Using API cart handler with variant');
      // ✅ For authenticated users, also store variant with images
      const variantId = selectedVariant?._id || selectedVariant?.variantName;
      const updatedCart = await cartAPI.addToCart({
        productId: product._id,
        variantId: variantId,
        quantity
      });
      
      // ✅ Ensure the cart item has the variant with images
      if (updatedCart.items) {
        updatedCart.items = updatedCart.items.map(item => {
          if (item.product._id === product._id && item.selectedVariant) {
            return {
              ...item,
              selectedVariant: {
                ...item.selectedVariant,
                images: selectedVariant?.images || item.selectedVariant.images || []
              }
            };
          }
          return item;
        });
      }
      
      setCart(updatedCart);
    }
  } catch (error) {
    console.error('❌ Error in addToCart:', error);
    throw error;
  } finally {
    setLoading(false);
    setAddingProductId(null);
  }
};

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      
      if (isGuest) {
        setCart(handleGuestUpdateCartItem(itemId, quantity));
      } else {
        await cartAPI.updateCartItem(itemId, { quantity });
        const updatedCart = await cartAPI.getCart();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true);
      
      if (isGuest) {
        setCart(handleGuestRemoveFromCart(itemId));
      } else {
        await cartAPI.removeFromCart(itemId);
        const updatedCart = await cartAPI.getCart();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      
      if (isGuest) {
        const updatedCart = handleGuestClearCart();
        setCart(updatedCart);
      } else {
        await cartAPI.clearCart();
        setCart(initialCart);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: CartContextType = {
    cart,
    loading,
    addingProductId,
    isGuest,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};