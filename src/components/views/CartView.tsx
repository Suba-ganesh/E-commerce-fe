import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, type CartItem } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { WholesaleApplicationModal } from '../common/WholesaleApplicationModal';

export const CartView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, updateQty, removeFromCart, clearCart, cartTotal, cartCount, isLoading, error } = useCart();
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [showWholesaleModal, setShowWholesaleModal] = useState(false);

  React.useEffect(() => {
    if (location.state?.orderId) {
      orderService.getOrderById(location.state.orderId)
        .then((res) => {
          if (res.success && res.data?.order_status) {
            setOrderStatus(res.data.order_status);
          }
        })
        .catch(() => {});
    }
  }, [location.state?.orderId]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in percentage e.g. 15
  const [appliedCode, setAppliedCode] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'CHENNIS15') {
      setAppliedDiscount(15);
      setAppliedCode('CHENNIS15');
      setCouponMsg({ text: 'Voucher applied! 15% discount has been deducted.', type: 'success' });
    } else {
      setCouponMsg({ text: 'Invalid coupon code. Try CHENNIS15.', type: 'error' });
    }
  };

  const calculateSubtotal = () => cartTotal;
  const calculateDiscountVal = () => (calculateSubtotal() * appliedDiscount) / 100;
  const calculateTax = () => calculateSubtotal() * 0.18;
  const calculateShippingFee = () => (calculateSubtotal() > 500 || cartCount === 0 ? 0 : 50.00);
  const calculateTotal = () => calculateSubtotal() - calculateDiscountVal() + calculateTax() + calculateShippingFee();

  const handleCheckout = () => {
    navigate('/checkout', { state: { discount: appliedDiscount, discountCode: appliedCode } });
  };

  if (isLoading && cart.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center px-4 max-w-[1200px] mx-auto w-full">
        <h2 className="font-extrabold text-[24px] text-g3 mb-2">Loading Cart...</h2>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col w-full text-left py-10 px-4 md:px-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-[28px] md:text-[34px] font-bold text-g3">Shopping Basket</h1>
        {cart.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="bg-off hover:bg-gray-200 text-txt border-none rounded-xl py-2 px-5 text-[14px] font-bold cursor-pointer transition"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => clearCart()}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-2 px-5 text-[14px] font-bold cursor-pointer transition"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-[14px] font-semibold">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg mb-6 text-[14px] font-semibold">
          Updating cart...
        </div>
      )}

      {cart.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border-design rounded-[24px] bg-off flex flex-col items-center justify-center shadow-sm w-full">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-g1">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h2 className="font-bold text-[24px] text-g3 mb-2">Your Cart is Empty</h2>
          <p className="text-muted text-[14.5px] max-w-[340px] mb-8 font-medium">
            Looks like you haven't added anything to your basket yet. Check out our certified organic products!
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-3.5 px-8 text-[15px] font-bold cursor-pointer transition shadow-[0_6px_16px_rgba(0,143,68,0.2)]"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {cart.some(item => item.quantity >= 10) && (
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0">
                  <i className="fa-solid fa-boxes-packing"></i>
                </div>
                <div>
                  <h4 className="font-bold text-[14.5px] text-purple-900 mb-0.5">Bulk Purchase Detected!</h4>
                  <p className="text-[13px] text-purple-700 leading-relaxed">You have products with 10+ quantities in your basket. Apply for a Wholesale Account to get bulk discounts.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWholesaleModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[13px] whitespace-nowrap cursor-pointer transition-all border-none"
              >
                Apply for Wholesale
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Cart Items List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="border border-border-design rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Desktop Table Headers */}
            <div className="hidden sm:grid grid-cols-12 bg-off p-4 border-b border-border-design text-[12px] font-bold text-muted uppercase tracking-wider">
              <div className="col-span-6">Product details</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* List items */}
            <div className="divide-y divide-border-design">
              {cart.map((item: CartItem) => {
                const priceStr = item.product.price;
                const priceNum = parseFloat(priceStr.replace(/[^\d.]/g, ''));
                const itemTotal = priceNum * item.quantity;

                return (
                  <div key={item.product.id} className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Item Details */}
                    <div className="col-span-6 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-design bg-off shrink-0">
                        <img src={item.product.img} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left leading-tight">
                        <h4
                          onClick={() => navigate('/shop')}
                          className="font-bold text-[14px] text-txt hover:text-g1 cursor-pointer line-clamp-2"
                        >
                          {item.product.name}
                        </h4>
                        <span className="text-[11px] text-muted block mt-1 uppercase font-semibold">
                          Category: {item.product.cat}
                        </span>
                        {(item.product.sku || item.product.variantName) && (
                          <span className="text-[11.5px] text-g1 block mt-1 font-semibold">
                            {item.product.variantName && `Variant: ${item.product.variantName}`}
                            {item.product.variantName && item.product.sku && ' | '}
                            {item.product.sku && `SKU: ${item.product.sku}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 text-left sm:text-center text-[14px] font-bold text-txt">
                      <span className="inline sm:hidden text-muted text-[12px] mr-1.5 font-normal">Price:</span>
                      RM {priceNum.toFixed(2)}
                    </div>

                    {/* Quantity Picker */}
                    <div className="col-span-2 flex justify-start sm:justify-center items-center">
                      <div className="flex items-center bg-off border border-border-design rounded-lg h-9 px-1 select-none">
                        <button
                          onClick={() => updateQty(item.product.id!, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-transparent border-none text-[14px] font-bold text-txt hover:bg-white cursor-pointer transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-[13.5px]">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product.id!, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-transparent border-none text-[14px] font-bold text-txt hover:bg-white cursor-pointer transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="col-span-2 text-right flex justify-between sm:justify-end items-center gap-4 text-[14px] font-bold text-g1">
                      <div>
                        <span className="inline sm:hidden text-muted text-[12px] mr-1.5 font-normal">Subtotal:</span>
                        RM {(item.totalPrice || itemTotal).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id!, item.id)}
                        className="bg-transparent border-none text-red-500 hover:text-red-700 cursor-pointer"
                        disabled={isLoading}
                      >
                        <i className="fa-regular fa-trash-can text-[14px]"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coupon / Voucher block */}
          <div className="border border-border-design rounded-2xl p-5 bg-white shadow-sm text-left">
            <h4 className="font-bold text-[14.5px] text-g3 mb-3.5 uppercase tracking-wide">Promo Code</h4>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter CHENNIS15"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 flex-1 uppercase font-semibold"
              />
              <button
                type="submit"
                className="bg-g1 hover:bg-g3 text-white border-none rounded-xl px-5 py-2 text-[13.5px] font-bold cursor-pointer transition shrink-0"
              >
                Apply
              </button>
            </form>
            {couponMsg.text && (
              <span className={`text-[12px] block mt-2.5 font-semibold ${couponMsg.type === 'success' ? 'text-g1' : 'text-red-500'}`}>
                {couponMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* Cart Summary Sidebox */}
        <div className="lg:col-span-1 border border-border-design rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-5 text-left">
          <h3 className="font-bold text-[16px] text-g3 uppercase border-b border-border-design pb-3 tracking-wide">Order Summary</h3>

          <div className="flex flex-col gap-3.5 text-[13.5px] text-muted">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-txt">RM {calculateSubtotal().toFixed(2)}</span>
            </div>

            {appliedDiscount > 0 && (
              <div className="flex justify-between text-g1 font-semibold">
                <span>Voucher ({appliedDiscount}%)</span>
                <span>- RM {calculateDiscountVal().toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-bold text-txt">
                {calculateShippingFee() === 0 ? 'FREE' : `RM ${calculateShippingFee().toFixed(2)}`}
              </span>
            </div>

            {calculateShippingFee() > 0 && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-2 text-center mt-1">
                Add <strong>RM {(500.01 - calculateSubtotal()).toFixed(2)}</strong> more to unlock <strong>FREE SHIPPING</strong>!
              </span>
            )}

            <div className="flex justify-between">
              <span>Tax (SST 18%)</span>
              <span className="font-bold text-txt">RM {calculateTax().toFixed(2)}</span>
            </div>

            {orderStatus && (
              <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="font-semibold text-g3">Order Status</span>
                <span className="font-bold text-g1 uppercase text-[12px] tracking-wider bg-white px-3 py-1 rounded-full border border-green-200">{orderStatus}</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-border-design my-1"></div>

          <div className="flex justify-between items-baseline">
            <span className="text-[15px] font-bold text-g3">Grand Total</span>
            <span className="text-[24px] font-bold text-g1">RM {calculateTotal().toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-4 text-[15px] font-bold cursor-pointer text-center w-full transition shadow-[0_6px_20px_rgba(0,143,68,0.2)] mt-2 uppercase tracking-wider"
          >
            Proceed to Checkout
          </button>
        </div>

      </div>
      </div>
      )}
      {showWholesaleModal && (
        <WholesaleApplicationModal onClose={() => setShowWholesaleModal(false)} />
      )}
    </div>
  );
};

export default CartView;