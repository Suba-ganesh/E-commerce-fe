import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, type CartItem } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { checkoutService } from '../../services/checkoutService';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import { couponService } from '../../services/couponService';
import { useToast } from '../../context/ToastContext';
import { CheckoutProcessingModal } from '../common/CheckoutProcessingModal';

export const CheckoutView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const discountCode: string = location.state?.discountCode ?? '';

  const { cart, cartCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();


  // Form inputs
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: 'Selangor',
    zip: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('fpx');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [couponCode, setCouponCode] = useState(discountCode);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (isAuthenticated && cartCount > 0) {
      const codeToUse = appliedCoupon?.code || discountCode;
      checkoutService.getCheckoutSummary(codeToUse || undefined).then(res => {
        if (res.data) setSummary(res.data);
      }).catch(err => {
        console.error("Failed to load checkout summary", err);
      });
    }
  }, [isAuthenticated, cartCount, appliedCoupon, discountCode]);

  const subtotal = summary ? parseFloat(summary.subtotal) : 0;
  const discountVal = summary ? parseFloat(summary.discount) : 0;
  const shippingFee = summary ? parseFloat(summary.shipping_charge) : 0;
  const tax = summary ? parseFloat(summary.tax) : 0;
  const grandTotal = summary ? parseFloat(summary.grand_total) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warning('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await couponService.validateCoupon(couponCode.trim(), subtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        toast.success(`Coupon applied! You saved RM ${res.data.discount_amount.toFixed(2)}`);
      } else {
        toast.error(res.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Refetch checkout summary when coupon is applied/removed
  useEffect(() => {
    if (isAuthenticated && cartCount > 0 && appliedCoupon) {
      checkoutService.getCheckoutSummary(appliedCoupon.code).then(res => {
        if (res.data) setSummary(res.data);
      }).catch(err => {
        console.error("Failed to update checkout summary with coupon", err);
      });
    }
  }, [isAuthenticated, cartCount, appliedCoupon]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.zip) {
      toast.warning('Please fill in all shipping details!');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      if (isAuthenticated) {
        // 1. Create temporary address on backend for checkout
        const addressRes = await userService.createAddress({
          full_name: form.name,
          phone_number: form.phone,
          address_line_1: form.address,
          city: form.city,
          state: form.state,
          postal_code: form.zip,
          country: 'Malaysia',
          is_default: true,
        });

        const addressId = addressRes.data?.id;

        if (!addressId) throw new Error("Failed to create shipping address");

        try {
          // 2. Validate checkout
          await checkoutService.processCheckout({
            shipping_address_id: addressId,
            billing_address_id: addressId,
            payment_method: paymentMethod.toUpperCase(),
            coupon_code: appliedCoupon?.code || discountCode || undefined,
          });

          // 3. Create Order
          const orderRes = await orderService.createOrder({
            shipping_address_id: addressId,
            billing_address_id: addressId,
            payment_method: paymentMethod.toUpperCase(),
          });

          const backendOrder = orderRes.data;

          // Clear local cart via API (also syncs UI)
          await clearCart();
          setIsSubmitting(false);
          navigate(`/order/success/${backendOrder.id}`);

        } catch (orderErr: any) {
          // If checkout validation or order creation fails, clean up the created address
          // to prevent orphan address accumulation on repeated retries
          try {
            await userService.deleteAddress(addressId);
          } catch (_) {
            // Silently ignore cleanup errors — address can be removed manually
          }
          throw orderErr;
        }

      } else {
        // Guest Flow not supported by backend currently
        setApiError('You must be logged in to place an order.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Unable to place your order. Please try again.';
      setApiError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col w-full text-left py-10 px-4 md:px-12 max-w-[1400px] mx-auto">
      {isSubmitting && <CheckoutProcessingModal />}
      <h1 className="text-[28px] md:text-[34px] font-black text-g3 mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Shipping Form & Payment Selection */}
        <div className="lg:col-span-2 flex flex-col gap-6.5">

          {/* Shipping Form */}
          <div className="border border-border-design rounded-2xl p-6.5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-[16px] text-g3 uppercase border-b border-border-design pb-3 tracking-wide">
              Shipping & Delivery Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[13px] font-bold text-muted">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 text-txt"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[13px] font-bold text-muted">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 text-txt"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[13px] font-bold text-muted">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+60 1x-xxxxxxx"
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 text-txt"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[13px] font-bold text-muted">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Apartment, building, suite, or street"
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 text-txt"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 text-left col-span-2 md:col-span-1">
                <label className="text-[13px] font-bold text-muted">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  required
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 text-txt"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[13px] font-bold text-muted">Postcode</label>
                <input
                  type="text"
                  name="zip"
                  value={form.zip}
                  onChange={handleInputChange}
                  required
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 text-txt"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left col-span-3 md:col-span-1">
                <label className="text-[13px] font-bold text-muted">State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleInputChange}
                  className="border border-border-design rounded-xl px-4 py-2 text-[13.5px] outline-none focus:border-g1 bg-white text-txt font-semibold"
                >
                  {['Kuala Lumpur', 'Selangor', 'Johor', 'Penang', 'Perak', 'Sabah', 'Sarawak', 'Kedah', 'Melaka'].map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Selection */}
          <div className="border border-border-design rounded-2xl p-6.5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-[16px] text-g3 uppercase border-b border-border-design pb-3 tracking-wide">
              Select Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'fpx', label: 'FPX Online Banking', icon: 'fa-building-columns' },
                { id: 'card', label: 'Visa / Mastercard Credit', icon: 'fa-credit-card' },
                { id: 'tng', label: 'Touch \'n Go E-Wallet', icon: 'fa-wallet' },
                { id: 'grab', label: 'GrabPay Later / Wallet', icon: 'fa-mobile-screen-button' }
              ].map((method) => (
                <label
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center justify-between border-2 rounded-xl p-4.5 cursor-pointer hover:border-g1 transition select-none ${paymentMethod === method.id
                      ? 'border-g1 bg-g1/5'
                      : 'border-border-design bg-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === method.id}
                      onChange={() => { }}
                      className="accent-g1"
                    />
                    <div className="text-left leading-tight">
                      <span className="font-bold text-[13.5px] text-txt block">{method.label}</span>
                      <span className="text-[11px] text-muted block mt-0.5">Pay safely via gateway</span>
                    </div>
                  </div>
                  <i className={`fa-solid ${method.icon} text-g1 opacity-80 text-[18px]`}></i>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Items Summary Sidebar */}
        <div className="lg:col-span-1 border border-border-design rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-5 text-left">
          <h3 className="font-extrabold text-[16px] text-g3 uppercase border-b border-border-design pb-3 tracking-wide">Order Summary</h3>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-medium text-[13px]">
              {apiError}
            </div>
          )}

          {/* Mini Items List */}
          <div className="flex flex-col gap-4 max-h-[220px] overflow-y-auto pr-1">
            {cart.map((item: CartItem) => {
              const priceStr = item.product.price;
              const priceNum = parseFloat(priceStr.replace(/[^\d.]/g, ''));
              // BUG-12: Use actual unit price paid (totalPrice / quantity) if available to support wholesale/discount prices in sidebar
              const actualUnitPrice = item.totalPrice ? (item.totalPrice / item.quantity) : priceNum;
              return (
                <div key={item.product.id} className="flex gap-3.5 items-center justify-between">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-design shrink-0 bg-off">
                      <img src={item.product.img} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[12.5px] text-txt font-semibold line-clamp-2">{item.product.name}</span>
                  </div>
                  <span className="text-[12.5px] font-bold text-muted whitespace-nowrap">
                    {item.quantity}x RM {actualUnitPrice.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Coupon Code Input */}
          {!appliedCoupon ? (
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-g3 uppercase tracking-wide">Have a coupon?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-border-design rounded-xl px-3 py-2 text-[13px] outline-none focus:border-g1 text-txt uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-g1 hover:bg-g3 text-white border-none rounded-xl text-[12px] font-bold cursor-pointer transition disabled:opacity-50 whitespace-nowrap"
                >
                  {validatingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-g1/20 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-g3 uppercase tracking-wide">Coupon Applied</div>
                <div className="text-[14px] font-black text-g1">{appliedCoupon.code}</div>
                <div className="text-[11px] text-muted">Save RM {appliedCoupon.discount_amount.toFixed(2)}</div>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          <div className="h-[1px] bg-border-design my-1"></div>

          {/* Pricing breakdowns */}
          <div className="flex flex-col gap-3 text-[13px] text-muted">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-txt">RM {subtotal.toFixed(2)}</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between text-g1 font-semibold">
                <span>Voucher</span>
                <span>- RM {discountVal.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-bold text-txt">
                {shippingFee === 0 ? 'FREE' : `RM ${shippingFee.toFixed(2)}`}
              </span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span>Tax (SST)</span>
                <span className="font-bold text-txt">RM {tax.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-border-design my-1"></div>

          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[14.5px] font-extrabold text-g3">Total to Pay</span>
            <span className="text-[22px] font-black text-g1">RM {grandTotal.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0}
            className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-4 text-[14.5px] font-black cursor-pointer text-center w-full transition shadow-[0_6px_20px_rgba(0,143,68,0.2)] uppercase tracking-wider disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Placing Order...
              </>
            ) : (
              'Confirm & Pay'
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CheckoutView;
