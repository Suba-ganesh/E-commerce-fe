import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

// Types based on orderService AdminOrder definition
interface OrderItem {
  id: number;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string | null;
  product_sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product: {
    name: string;
    images?: Array<{ image_url: string }>;
  };
}

interface OrderUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface OrderAddress {
  id: number;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string;
  shipping_address_id: number;
  billing_address_id: number;
  order_status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';
  payment_status: string;
  subtotal: string;
  tax_amount: string;
  shipping_charge: string;
  discount_amount: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  user: OrderUser;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  items: OrderItem[];
  payment?: {
    payment_method: string;
    payment_status: string;
    paid_at: string | null;
  };
  type: 'Wholesale' | 'Retail';
  category: string;
  total_items: number;
}

export const OrderSuccessView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!orderId) return;
    orderService
      .getOrderById(orderId)
      .then((res) => {
        if (res.success && res.data) {
          setOrder(res.data as AdminOrder);
        } else {
          toast.error('Failed to load order details');
        }
      })
      .catch(() => toast.error('Unable to fetch order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-g3">
        <h2 className="text-2xl font-bold">Loading order details…</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center py-20">
        <h2 className="text-xl font-semibold text-red-600">Order not found.</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-g1 hover:bg-g3 text-white py-2 px-6 rounded"
        >
          Return Home
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  return (
    <div className="max-w-[1400px] mx-auto py-10 px-4 md:px-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-g3 mb-6">Order Confirmation</h1>
      <div className="border border-border-design rounded-2xl p-6 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-muted">Order Number</p>
            <p className="font-bold text-txt text-xl">{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-muted">Status</p>
            <p className="font-bold text-txt text-xl">{order.order_status}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-muted mb-2">Shipping Address</p>
            <p>{order.shippingAddress.full_name}</p>
            <p>{order.shippingAddress.address_line1}</p>
            {order.shippingAddress.address_line2 && <p>{order.shippingAddress.address_line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
            <p>{order.shippingAddress.postal_code}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
          <div>
            <p className="text-muted mb-2">Billing Address</p>
            <p>{order.billingAddress.full_name}</p>
            <p>{order.billingAddress.address_line1}</p>
            {order.billingAddress.address_line2 && <p>{order.billingAddress.address_line2}</p>}
            <p>{order.billingAddress.city}, {order.billingAddress.state}</p>
            <p>{order.billingAddress.postal_code}</p>
            <p>{order.billingAddress.country}</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-g3 mb-4">Items</h2>
        <div className="divide-y divide-border-design">
          {order.items.map((item) => {
            const priceNum = parseFloat(item.unit_price.replace(/[^\\d.]/g, ''));
            const totalNum = parseFloat(item.total_price.replace(/[^\\d.]/g, ''));
            return (
              <div key={item.id} className="flex py-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-off mr-4">
                  {item.product.images && item.product.images[0] ? (
                    <img
                      src={item.product.images[0].image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-muted">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-txt">{item.product_name}</p>
                  <p className="text-muted text-sm">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-txt">RM {priceNum.toFixed(2)}</p>
                  <p className="text-muted text-sm">Total: RM {totalNum.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 space-y-2 text-right">
          <p>Subtotal: RM {parseFloat(order.subtotal).toFixed(2)}</p>
          <p>Tax: RM {parseFloat(order.tax_amount).toFixed(2)}</p>
          <p>Shipping: RM {parseFloat(order.shipping_charge).toFixed(2)}</p>
          <p>Discount: RM {parseFloat(order.discount_amount).toFixed(2)}</p>
          <p className="font-bold text-g1">
            Grand Total: RM {parseFloat(order.total_amount).toFixed(2)}
          </p>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="bg-g1 hover:bg-g3 text-white py-2 px-6 rounded"
          >
            Continue Shopping
          </button>
          <p className="text-muted text-sm">Placed on {formatDate(order.created_at)}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessView;
