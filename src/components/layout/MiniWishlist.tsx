import React, { useState } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { type Product } from '../../services/productService';

interface MiniWishlistProps {
  isOpen: boolean;
  onNavigate: (viewId: string) => void;
  onClose: () => void;
}

export const MiniWishlist: React.FC<MiniWishlistProps> = ({ isOpen, onNavigate, onClose }) => {
  const { wishlist, wishlistCount, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleMoveToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setMovingId(product.id);
    try {
      await addToCart(product, 1);
      await removeFromWishlist(product.id);
    } catch (err) {
      console.error('Failed to move to cart', err);
    } finally {
      setMovingId(null);
    }
  };

  const handleRemove = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    await removeFromWishlist(productId);
  };

  return (
    <div className={`fixed top-0 right-0 w-full sm:w-[340px] md:w-[370px] h-auto max-h-[100dvh] md:max-h-[80vh] sm:absolute sm:top-[calc(100%+8px)] sm:right-0 bg-white sm:border sm:border-border-design sm:rounded-[20px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] z-[999] overflow-hidden flex flex-col transition-all ease-[cubic-bezier(0.22,1,0.36,1)] sm:origin-top-right ${isOpen ? 'opacity-100 visible translate-x-0 sm:translate-y-0 sm:scale-100 duration-[350ms]' : 'opacity-0 invisible translate-x-full sm:translate-x-0 sm:translate-y-[10px] sm:scale-[0.98] duration-[300ms] pointer-events-none'}`}>
      <div className="py-[16px] px-[20px] border-b border-border-design flex justify-between items-center bg-off shrink-0">
        <h3 className="font-extrabold text-g3 text-[15px] uppercase tracking-wider m-0 flex items-center">Your Wishlist ({wishlistCount})</h3>
        <button onClick={onClose} className="text-muted hover:text-g1 bg-transparent border-none cursor-pointer transition flex items-center p-0">
          <i className="fa-solid fa-xmark text-[18px]"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {wishlist.length === 0 ? (
          <div className="p-[24px] flex flex-col items-center justify-center text-center">
            <i className="fa-regular fa-heart text-[42px] text-gray-200 mb-[12px]"></i>
            <p className="font-bold text-[16px] text-g3 m-0 mb-[8px]">Your wishlist is empty</p>
            <p className="text-muted text-[14px] m-0 mb-[20px] leading-snug">Explore our products and save your favorites.</p>
            <button
              onClick={() => { onClose(); onNavigate('listing'); }}
              className="bg-g1 hover:bg-g3 text-white border-none rounded-xl h-[44px] px-[24px] w-auto min-w-[180px] text-[14px] font-bold cursor-pointer transition shadow-sm hover:-translate-y-0.5 flex items-center justify-center"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {wishlist.map((product) => {
              const isActive = product._original?.status === 'ACTIVE';
              return (
                <div key={product.id} className="flex gap-4 p-3 hover:bg-off rounded-xl transition group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border-design bg-white">
                    <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-[14px] text-g3 leading-tight line-clamp-2 m-0">{product.name}</h4>
                      <button 
                        onClick={(e) => handleRemove(e, product.id)}
                        className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer transition p-1 shrink-0"
                        title="Remove"
                      >
                        <i className="fa-solid fa-trash-can text-[13px]"></i>
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2">
                      <span className="text-[14px] font-black text-g1">{product.price}</span>
                      <span className={`text-[11px] font-bold ${isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {isActive ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleMoveToCart(e, product)}
                      disabled={!isActive || movingId === product.id}
                      className={`mt-2 border-none rounded-lg py-1.5 px-3 text-[12px] font-bold cursor-pointer transition ${
                        isActive
                          ? 'bg-[#EBF7F0] text-g1 hover:bg-g1 hover:text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {movingId === product.id ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        'Move to Cart'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {wishlist.length > 0 && (
        <div className="p-4 border-t border-border-design bg-off shrink-0">
          <button
            onClick={() => { onClose(); onNavigate('wishlist'); }}
            className="w-full bg-white hover:bg-gray-50 text-g3 border border-border-design rounded-xl py-3 px-4 text-[13px] font-bold cursor-pointer transition hover:-translate-y-0.5 shadow-sm text-center"
          >
            View Wishlist
          </button>
        </div>
      )}
    </div>
  );
};
