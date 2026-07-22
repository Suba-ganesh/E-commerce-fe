import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Product, productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface CartItem {
  id?: number; // Backend cart item ID
  product: Product;
  quantity: number;
  totalPrice?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, cartItemId?: number) => Promise<void>;
  updateQty: (productId: string, qty: number, cartItemId?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBackendCart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartService.getCart();
      if (res.data) {
        const mappedCart = res.data.items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          totalPrice: parseFloat(item.total_price),
          product: productService.mapBackendProductToFrontend({
            ...item.product,
            variants: [item.variant]
          })
        }));
        setCart(mappedCart);
        setCartTotal(parseFloat(res.data.total_amount || 0));
      }
    } catch (err: any) {
      console.error('Failed to fetch cart:', err);
      setError('Unable to load your cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const mergeGuestCart = async () => {
    const guestCart = localStorage.getItem('Cart');
    if (guestCart) {
      try {
        const parsedGuest = JSON.parse(guestCart) as CartItem[];
        if (parsedGuest.length > 0) {
          setIsLoading(true);
          for (const item of parsedGuest) {
            let variantId = item.product.variantId;
            if (!variantId) {
              try {
                const res = await productService.getProductById(item.product.id);
                if (res.data) {
                  const fullProd = productService.mapBackendProductToFrontend(res.data);
                  variantId = fullProd.variantId;
                }
              } catch (e) {
                console.error("Failed to fetch variant details during merge", e);
              }
            }

            if (variantId) {
              try {
                await cartService.addToCart(variantId, item.quantity);
              } catch (err) {
                console.error(`Failed to merge item ${item.product.name}:`, err);
              }
            }
          }
          localStorage.removeItem('Cart');
        }
      } catch (e) {
        console.error('Failed to parse guest cart for merge', e);
      }
    }
    // Regardless of merge, fetch backend cart
    await fetchBackendCart();
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role.toUpperCase() === 'SUPER_ADMIN') {
        localStorage.removeItem('Cart');
        fetchBackendCart();
      } else {
        mergeGuestCart();
      }
    } else {
      // Load guest cart
      const storedCart = localStorage.getItem('Cart');
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (e) {
          console.error(e);
        }
      } else {
        setCart([]);
      }
    }
  }, [user, isAuthenticated]);

  const saveGuestCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('Cart', JSON.stringify(newCart));
  };

  const addToCart = async (product: Product, quantity = 1) => {
    setError(null);
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        let variantId = product.variantId;
        if (!variantId) {
          // Fetch full product details if variantId is missing from listing data
          try {
            const res = await productService.getProductById(product.id);
            if (res.data) {
              const fullProd = productService.mapBackendProductToFrontend(res.data);
              variantId = fullProd.variantId;
            }
          } catch (e) {
            console.error("Failed to fetch product details for variantId", e);
          }
        }

        if (!variantId) {
          throw new Error('Cannot add product: No variant available.');
        }

        await cartService.addToCart(variantId, quantity);
        await fetchBackendCart();
        toast.success(`${product.name} added to cart`);
      } catch (err: any) {
        setError('Unable to add item to cart. Please try again.');
        throw new Error('Unable to add item to cart. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        let finalProduct = { ...product };
        if (!finalProduct.variantId) {
            try {
              const res = await productService.getProductById(product.id);
              if (res.data) {
                finalProduct = productService.mapBackendProductToFrontend(res.data);
              }
            } catch (e) {
              console.error("Failed to fetch guest product details for variantId", e);
            }
        }

        if (!finalProduct.variantId) {
           throw new Error('Cannot add product: No variant available.');
        }

        const existingIdx = cart.findIndex((item) => item.product.id === finalProduct.id);
        const newCart = [...cart];
        if (existingIdx > -1) {
          newCart[existingIdx].quantity += quantity;
        } else {
          newCart.push({ product: finalProduct, quantity });
        }
        saveGuestCart(newCart);
        toast.success(`${product.name} added to cart`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeFromCart = async (productId: string, cartItemId?: number) => {
    setError(null);
    if (isAuthenticated) {
      if (!cartItemId) {
        // Fallback to find by productId
        const item = cart.find(c => c.product.id === productId);
        cartItemId = item?.id;
      }
      if (!cartItemId) return;
      setIsLoading(true);
      try {
        await cartService.removeCartItem(cartItemId);
        await fetchBackendCart();
        toast.info('Item removed from cart');
      } catch (err: any) {
        setError('Unable to remove item from cart.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const newCart = cart.filter((item) => item.product.id !== productId);
      saveGuestCart(newCart);
      toast.info('Item removed from cart');
    }
  };

  const updateQty = async (productId: string, qty: number, cartItemId?: number) => {
    setError(null);
    if (qty <= 0) {
      await removeFromCart(productId, cartItemId);
      return;
    }
    
    if (isAuthenticated) {
      if (!cartItemId) {
        const item = cart.find(c => c.product.id === productId);
        cartItemId = item?.id;
      }
      if (!cartItemId) return;
      
      setIsLoading(true);
      try {
        await cartService.updateCartItem(cartItemId, qty);
        await fetchBackendCart();
      } catch (err: any) {
        setError('Unable to update item quantity.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const newCart = cart.map((item) => 
        item.product.id === productId ? { ...item, quantity: qty } : item
      );
      saveGuestCart(newCart);
    }
  };

  const clearCart = async () => {
    setError(null);
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        await cartService.clearCart();
        await fetchBackendCart();
        toast.info('Cart cleared');
      } catch (err: any) {
        setError('Unable to clear your cart.');
      } finally {
        setIsLoading(false);
      }
    } else {
      saveGuestCart([]);
      toast.info('Cart cleared');
    }
  };



  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // For guest carts, calculate manually. For backend carts, use the API total.
  const computedTotal = isAuthenticated ? cartTotal : cart.reduce((total, item) => {
    const priceStr = item.product.price;
    const priceNum = parseFloat(priceStr.replace(/[^\d.]/g, ''));
    return total + priceNum * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal: computedTotal,
        isLoading,
        error
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
