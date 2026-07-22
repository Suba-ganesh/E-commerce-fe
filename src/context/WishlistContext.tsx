import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Product, productService } from '../services/productService';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isLoading: boolean;
  error: string | null;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync wishlist on mount and auth changes
  useEffect(() => {
    if (isAuthenticated) {
      mergeAndFetchWishlist();
    } else {
      loadGuestWishlist();
    }
  }, [isAuthenticated]);

  const loadGuestWishlist = () => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem('Wishlist');
      if (stored) {
        setWishlist(JSON.parse(stored));
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error('Error parsing guest wishlist', err);
    } finally {
      setIsLoading(false);
    }
  };

  const mergeAndFetchWishlist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check for guest items to merge
      const guestItemsStr = localStorage.getItem('Wishlist');
      if (guestItemsStr) {
        const guestItems: Product[] = JSON.parse(guestItemsStr);
        if (guestItems.length > 0) {
          // Merge sequentially to avoid overwhelming the server
          for (const item of guestItems) {
            try {
              await wishlistService.addToWishlist(item.id);
            } catch (err: any) {
              if (err.response?.status !== 409) { // Ignore conflicts (already in wishlist)
                console.error(`Failed to merge ${item.name}`, err);
              }
            }
          }
          // Clear guest wishlist after merge
          localStorage.removeItem('Wishlist');
        }
      }

      // 2. Fetch authenticated wishlist
      await fetchBackendWishlist();

      // Clean up legacy UserWishlists if it exists
      if (localStorage.getItem('UserWishlists')) {
        localStorage.removeItem('UserWishlists');
      }
    } catch (err: any) {
      setError('Failed to sync wishlist');
      console.error('Wishlist sync error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackendWishlist = async () => {
    try {
      const res = await wishlistService.getWishlist();
      if (res.data && res.data.items) {
        const mappedWishlist = res.data.items.map((item: any) => 
          productService.mapBackendProductToFrontend({
            ...item.product,
            // Assuming we don't fetch variant details in wishlist get right now, we just map product
          })
        );
        setWishlist(mappedWishlist);
      } else {
        setWishlist([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch backend wishlist', err);
      throw err;
    }
  };

  const saveGuestWishlist = (newWishlist: Product[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('Wishlist', JSON.stringify(newWishlist));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    const exists = isInWishlist(product.id);

    if (isAuthenticated) {
      try {
        if (exists) {
          // Optimistic update
          setWishlist(prev => prev.filter(item => item.id !== product.id));
          await wishlistService.removeFromWishlist(product.id);
          toast.info('Removed from wishlist');
        } else {
          // Optimistic update
          setWishlist(prev => [...prev, product]);
          await wishlistService.addToWishlist(product.id);
          toast.success('Added to wishlist');
        }
      } catch (err: any) {
        // Revert on error
        await fetchBackendWishlist();
        setError('Unable to update your wishlist.');
        throw err;
      }
    } else {
      // Guest logic
      if (exists) {
        saveGuestWishlist(wishlist.filter(item => item.id !== product.id));
        toast.info('Removed from wishlist');
      } else {
        saveGuestWishlist([...wishlist, product]);
        toast.success('Added to wishlist');
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (isAuthenticated) {
      try {
        setWishlist(prev => prev.filter(item => item.id !== productId));
        await wishlistService.removeFromWishlist(productId);
      } catch (err: any) {
        await fetchBackendWishlist();
        setError('Unable to clear your wishlist.');
        throw err;
      }
    } else {
      saveGuestWishlist(wishlist.filter(item => item.id !== productId));
    }
  };

  const clearWishlist = async () => {
    if (isAuthenticated) {
      try {
        setWishlist([]);
        await wishlistService.clearWishlist();
      } catch (err: any) {
        await fetchBackendWishlist();
        setError('Unable to copy wishlist to cart.');
        throw err;
      }
    } else {
      saveGuestWishlist([]);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isLoading,
        error,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
