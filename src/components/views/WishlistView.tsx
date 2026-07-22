import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { type Product } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';

const WishlistView: React.FC = () => {
  const navigate = useNavigate();
  const { wishlist, wishlistCount, isLoading, error, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const toast = useToast();
  const modal = useModal();

  const handleMoveToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      await removeFromWishlist(product.id);
    } catch (err) {
      console.error('Failed to move item to cart', err);
      toast.error('Unable to move item to cart. Please try again.');
    }
  };

  const handleClearWishlist = async () => {
    const confirmed = await modal.confirm(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?'
    );
    if (!confirmed) return;

    try {
      await clearWishlist();
    } catch (err) {
      toast.error('Unable to clear wishlist. Please try again.');
    }
  };

  if (isLoading && wishlist.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-g1 min-h-[500px]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
        <p className="font-bold">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-12">
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border-design pb-5 gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-g3 leading-tight uppercase tracking-tight mb-1">My Wishlist</h1>
            <p className="text-muted text-[14px] font-medium tracking-wide">Wishlist ({wishlistCount} Items)</p>
          </div>
          {wishlistCount > 0 && (
            <button
              onClick={handleClearWishlist}
              className="bg-transparent border-2 border-border-design text-txt hover:text-g1 hover:border-g1 hover:shadow-sm rounded-xl py-2 px-5 text-[14px] font-bold cursor-pointer transition-all duration-300 flex items-center gap-2"
            >
              <i className="fa-regular fa-trash-can"></i>
              Clear Wishlist
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-medium text-[13px] shadow-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {wishlist.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border-design rounded-[24px] bg-off flex flex-col items-center justify-center shadow-sm">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm">
              <i className="fa-regular fa-heart text-g1/40 text-[40px]"></i>
            </div>
            <h3 className="font-extrabold text-[22px] text-g3 mb-2">Your wishlist is empty</h3>
            <p className="text-muted text-[15px] font-medium max-w-[320px] mb-8">Explore our organic products and add your favorites here!</p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-3.5 px-8 text-[15px] font-bold cursor-pointer transition-all duration-300 shadow-[0_6px_16px_rgba(0,143,68,0.2)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,143,68,0.3)]"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col bg-white border border-border-design rounded-[20px] overflow-hidden shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:border-[#c2d6c9] transition-all duration-400 ease-out hover:-translate-y-1.5"
              >
                {/* Image Section */}
                <div
                  className="relative h-48 bg-off overflow-hidden cursor-pointer shrink-0"
                  onClick={() => navigate(`/shop/product/${product.id}`, { state: { product } })}
                >
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Organic Badge */}
                  <div className="absolute top-3 left-3 bg-[#EAFDF1] border border-[#A6E8C2] text-g1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded shadow-sm z-10 flex items-center gap-1 backdrop-blur-sm">
                    <i className="fa-solid fa-leaf text-[9px]"></i> Organic
                  </div>
                  {/* Remove Button (Secondary CTA) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 flex items-center justify-center shadow-sm backdrop-blur-sm transition-all duration-300 z-10"
                    title="Remove from Wishlist"
                  >
                    <i className="fa-solid fa-trash-can text-[13px]"></i>
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-grow text-left">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[10px] font-black text-g2 uppercase tracking-widest">{product.cat}</span>
                    <div className="flex items-center gap-1 text-[#F5A623] text-[11px] font-bold">
                      <i className="fa-solid fa-star"></i> 4.8
                    </div>
                  </div>

                  <h3
                    onClick={() => navigate(`/shop/product/${product.id}`, { state: { product } })}
                    className="font-extrabold text-[15px] text-txt leading-snug mb-2 line-clamp-2 cursor-pointer group-hover:text-g1 transition-colors"
                  >
                    {product.name}
                  </h3>

                  <div className="mt-auto pt-2 flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                      <span className="font-black text-[18px] text-g1 leading-none">{product.price}</span>
                      <span className="text-[11px] font-bold text-[#0F5132] bg-[#EAFDF1] px-2 py-0.5 rounded-full">
                        In Stock
                      </span>
                    </div>

                    {/* Primary CTA */}
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="w-full bg-g1 hover:bg-g3 text-white border-none rounded-[12px] py-2.5 text-[14px] font-extrabold cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,143,68,0.15)] flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-cart-arrow-down text-[13px]"></i>
                      Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistView;

