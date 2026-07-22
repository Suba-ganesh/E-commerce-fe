import React from 'react';
import { useCart } from '../../context/CartContext';

interface MiniCartProps {
  isOpen: boolean;
  onNavigate: (viewId: string) => void;
  onClose: () => void;
}

export const MiniCart: React.FC<MiniCartProps> = ({ isOpen, onNavigate, onClose }) => {
  const { cart, cartTotal, cartCount, removeFromCart, updateQty } = useCart();

  const handleRemove = async (e: React.MouseEvent, productId: string, cartItemId?: number) => {
    e.stopPropagation();
    await removeFromCart(productId, cartItemId);
  };

  const handleQtyChange = async (e: React.MouseEvent, productId: string, qty: number, cartItemId?: number) => {
    e.stopPropagation();
    if (qty > 0) {
      await updateQty(productId, qty, cartItemId);
    }
  };

  return (
    <div className={`fixed top-0 right-0 w-full sm:w-[340px] md:w-[370px] h-auto max-h-[100dvh] md:max-h-[80vh] sm:absolute sm:top-[calc(100%+8px)] sm:right-0 bg-white sm:border sm:border-border-design sm:rounded-[20px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] z-[999] overflow-hidden flex flex-col transition-all ease-[cubic-bezier(0.22,1,0.36,1)] sm:origin-top-right ${isOpen ? 'opacity-100 visible translate-x-0 sm:translate-y-0 sm:scale-100 duration-[350ms]' : 'opacity-0 invisible translate-x-full sm:translate-x-0 sm:translate-y-[10px] sm:scale-[0.98] duration-[300ms] pointer-events-none'}`}>
      <div className="py-[16px] px-[20px] border-b border-border-design flex justify-between items-center bg-off shrink-0">
        <h3 className="font-extrabold text-g3 text-[15px] uppercase tracking-wider m-0 flex items-center">Your Cart ({cartCount})</h3>
        <button onClick={onClose} className="text-muted hover:text-g1 bg-transparent border-none cursor-pointer transition flex items-center p-0">
          <i className="fa-solid fa-xmark text-[18px]"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="p-[24px] flex flex-col items-center justify-center text-center">
            <i className="fa-solid fa-cart-shopping text-[42px] text-gray-200 mb-[12px]"></i>
            <p className="font-bold text-[16px] text-g3 m-0 mb-[8px]">Your cart is empty</p>
            <p className="text-muted text-[14px] m-0 mb-[20px] leading-snug">Looks like you haven't added anything yet.</p>
            <button
              onClick={() => { onClose(); onNavigate('listing'); }}
              className="bg-g1 hover:bg-g3 text-white border-none rounded-xl h-[44px] px-[24px] w-auto min-w-[180px] text-[14px] font-bold cursor-pointer transition shadow-sm hover:-translate-y-0.5 flex items-center justify-center"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((item) => {
              const priceNum = parseFloat(item.product.price.replace(/[^\d.]/g, ''));
              const subtotal = (priceNum * item.quantity).toFixed(2);
              
              return (
                <div key={item.id || item.product.id} className="flex gap-4 p-3 hover:bg-off rounded-xl transition group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border-design bg-white">
                    <img src={item.product.img} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-[14px] text-g3 leading-tight line-clamp-2 m-0">{item.product.name}</h4>
                      <button 
                        onClick={(e) => handleRemove(e, item.product.id, item.id)}
                        className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer transition p-1 shrink-0"
                        title="Remove"
                      >
                        <i className="fa-solid fa-trash-can text-[13px]"></i>
                      </button>
                    </div>
                    {item.product.variantName && (
                      <span className="text-[11px] text-muted font-medium mt-1">Variant: {item.product.variantName}</span>
                    )}
                    <div className="flex justify-between items-end mt-auto pt-2">
                      <div className="flex items-center bg-white border border-border-design rounded-md overflow-hidden h-7">
                        <button 
                          onClick={(e) => handleQtyChange(e, item.product.id, item.quantity - 1, item.id)}
                          className="w-7 h-full bg-transparent border-none text-txt font-bold hover:bg-gray-100 cursor-pointer transition flex items-center justify-center text-[14px]"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-[12px] font-bold">{item.quantity}</span>
                        <button 
                          onClick={(e) => handleQtyChange(e, item.product.id, item.quantity + 1, item.id)}
                          className="w-7 h-full bg-transparent border-none text-txt font-bold hover:bg-gray-100 cursor-pointer transition flex items-center justify-center text-[14px]"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-[14px] font-black text-g1">RM {subtotal}</span>
                        <span className="text-[10px] text-muted font-medium mt-0.5">{item.quantity} × {item.product.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-4 border-t border-border-design bg-off flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-[14px] text-muted">Total:</span>
            <span className="font-black text-[18px] text-g3">RM {cartTotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onClose(); onNavigate('cart'); }}
              className="bg-white hover:bg-gray-50 text-g3 border border-border-design rounded-xl py-3 px-4 text-[13px] font-bold cursor-pointer transition hover:-translate-y-0.5 shadow-sm text-center"
            >
              View Cart
            </button>
            <button
              onClick={() => { onClose(); onNavigate('checkout'); }}
              className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-3 px-4 text-[13px] font-bold cursor-pointer transition hover:-translate-y-0.5 shadow-sm text-center"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
