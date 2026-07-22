import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, isOpen, onClose }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      setError(null);
      orderService.getOrderById(orderId)
        .then(res => {
          setOrder(res.data);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load order details.');
          toast.error('Failed to load order details.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-design bg-off">
          <h2 className="text-[20px] font-black text-g3">
            {loading ? 'Loading...' : `Order ${order?.order_number || ''}`}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-border-design text-muted hover:text-red-500 hover:border-red-200 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {loading && (
            <div className="flex justify-center items-center py-12 text-g1">
              <span className="w-8 h-8 border-4 border-g1/30 border-t-g1 rounded-full animate-spin"></span>
            </div>
          )}

          {error && !loading && (
            <div className="text-red-500 text-center py-12 font-bold">{error}</div>
          )}

          {!loading && order && (
            <div className="flex flex-col gap-8">
              
              {/* Order Status & Date */}
              <div className="flex flex-wrap gap-4 justify-between items-center bg-off p-4 rounded-xl border border-border-design">
                <div>
                  <div className="text-[12px] font-bold text-muted uppercase">Order Date</div>
                  <div className="text-[14px] font-bold text-g3">{formatDate(order.created_at)}</div>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-muted uppercase">Status</div>
                  <div className={`text-[14px] font-black uppercase tracking-wider ${
                    order.order_status === 'PENDING' ? 'text-amber-500' :
                    order.order_status === 'CANCELLED' ? 'text-red-500' :
                    'text-g1'
                  }`}>
                    {order.order_status}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-muted uppercase">Payment Status</div>
                  <div className="text-[14px] font-bold text-g3">
                    {order.payment?.payment_status || 'PENDING'} 
                    {order.payment?.payment_method ? ` (${order.payment.payment_method})` : ''}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-[16px] font-extrabold text-g3 mb-4 uppercase tracking-wide border-b border-border-design pb-2">Items Purchased</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-design text-muted">
                        <th className="py-2 px-2 font-semibold">Product</th>
                        <th className="py-2 px-2 font-semibold">Variant</th>
                        <th className="py-2 px-2 font-semibold">Unit Price</th>
                        <th className="py-2 px-2 font-semibold text-center">Qty</th>
                        <th className="py-2 px-2 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-design">
                      {order.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-3 px-2 font-bold text-g3">{item.product_name}</td>
                          <td className="py-3 px-2 text-muted">{item.variant_name || item.product_sku}</td>
                          <td className="py-3 px-2">RM {Number(item.unit_price).toFixed(2)}</td>
                          <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-3 px-2 text-right font-extrabold text-g1">RM {Number(item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-border-design p-4 rounded-xl shadow-sm">
                  <div className="text-[13px] font-extrabold text-g3 mb-2 uppercase border-b border-border-design pb-2">Shipping Address</div>
                  {order.shippingAddress ? (
                    <div className="text-[13px] text-txt leading-relaxed">
                      <div className="font-bold">{order.shippingAddress.full_name}</div>
                      <div>{order.shippingAddress.address_line1}</div>
                      {order.shippingAddress.address_line2 && <div>{order.shippingAddress.address_line2}</div>}
                      <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}</div>
                      <div>{order.shippingAddress.country}</div>
                      <div className="mt-1 text-muted"><i className="fa-solid fa-phone mr-1"></i> {order.shippingAddress.phone}</div>
                    </div>
                  ) : (
                    <div className="text-[13px] text-muted">No shipping address provided.</div>
                  )}
                </div>
                
                <div className="bg-white border border-border-design p-4 rounded-xl shadow-sm">
                  <div className="text-[13px] font-extrabold text-g3 mb-2 uppercase border-b border-border-design pb-2">Billing Address</div>
                  {order.billingAddress ? (
                    <div className="text-[13px] text-txt leading-relaxed">
                      <div className="font-bold">{order.billingAddress.full_name}</div>
                      <div>{order.billingAddress.address_line1}</div>
                      {order.billingAddress.address_line2 && <div>{order.billingAddress.address_line2}</div>}
                      <div>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postal_code}</div>
                      <div>{order.billingAddress.country}</div>
                      <div className="mt-1 text-muted"><i className="fa-solid fa-phone mr-1"></i> {order.billingAddress.phone}</div>
                    </div>
                  ) : (
                    <div className="text-[13px] text-muted">Same as shipping address.</div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-off border border-border-design rounded-xl p-5 ml-auto w-full md:w-1/2">
                <div className="flex flex-col gap-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Subtotal</span>
                    <span className="font-bold text-g3">RM {Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Shipping</span>
                    <span className="font-bold text-g3">RM {Number(order.shipping_charge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Tax</span>
                    <span className="font-bold text-g3">RM {Number(order.tax_amount).toFixed(2)}</span>
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-g1">
                      <span className="font-semibold">Discount</span>
                      <span className="font-bold">-RM {Number(order.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border-design my-1 pt-2 flex justify-between items-center">
                    <span className="text-[15px] font-black text-g3">Grand Total</span>
                    <span className="text-[20px] font-black text-g1">RM {Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
