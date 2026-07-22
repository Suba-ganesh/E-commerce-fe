import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';
import { userService } from '../../services/userService';
import { formatDate } from '../../utils/helpers';

interface Address {
  id: number;
  full_name: string;
  phone_number: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  order_status: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  status: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  addresses?: Address[];
  orders?: Order[];
}

interface CustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  new_customers_this_month: number;
}

export const AdminCustomerManager: React.FC = () => {
  const toast = useToast();
  const { openModal, closeModal } = useModal();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  
  // Table state
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchStats = async () => {
    try {
      const res = await userService.getAdminCustomerStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, sort };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await userService.getAdminCustomers(params);
      setCustomers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // Debounce search
    const handler = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, search, statusFilter, sort]);

  const handleStatusChange = async (customerId: string, newStatus: string) => {
    const action = newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate';
    
    const onConfirm = async () => {
      try {
        await userService.updateAdminCustomerStatus(customerId, newStatus);
        toast.success(`Customer ${newStatus.toLowerCase()} successfully`);
        fetchCustomers();
        fetchStats();
      } catch (error) {
        toast.error(`Failed to ${action.toLowerCase()} customer`);
      }
      closeModal();
    };

    openModal(
      `${action} Customer`,
      `Are you sure you want to ${action.toLowerCase()} this customer?`,
      [
        { label: 'Cancel', onClick: closeModal, variant: 'secondary' },
        { label: `Yes, ${action}`, onClick: onConfirm, variant: newStatus === 'ACTIVE' ? 'primary' : 'danger' },
      ]
    );
  };

  const viewCustomerDetails = async (customerId: string) => {
    try {
      const res = await userService.getAdminCustomerDetails(customerId);
      const customer = res.data;

      const content = (
        <div className="flex flex-col gap-6 text-left">
          <div className="grid grid-cols-2 gap-4 bg-off p-4 rounded-xl">
            <div>
              <p className="text-[12px] text-gray-500 font-bold uppercase mb-1">Name</p>
              <p className="font-semibold text-gray-900">{customer.first_name} {customer.last_name}</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 font-bold uppercase mb-1">Email</p>
              <p className="font-semibold text-gray-900">{customer.email}</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 font-bold uppercase mb-1">Phone</p>
              <p className="font-semibold text-gray-900">{customer.phone_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 font-bold uppercase mb-1">Status</p>
              <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${
                customer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {customer.status}
              </span>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 font-bold uppercase mb-1">Joined Date</p>
              <p className="font-semibold text-gray-900">{formatDate(customer.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border-design p-4 rounded-xl">
              <p className="text-[14px] font-bold text-gray-900 mb-2">Total Orders</p>
              <p className="text-2xl font-black text-g1">{customer.total_orders}</p>
            </div>
            <div className="bg-white border border-border-design p-4 rounded-xl">
              <p className="text-[14px] font-bold text-gray-900 mb-2">Total Spent</p>
              <p className="text-2xl font-black text-g1">₹{Number(customer.total_spent).toFixed(2)}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Addresses ({(customer.addresses && customer.addresses.length) || 0})</h4>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {customer.addresses.map((addr: Address) => (
                  <div key={addr.id} className="bg-gray-50 p-3 rounded-lg text-[13px]">
                    <p className="font-bold">{addr.full_name} {addr.is_default && <span className="text-g1 text-[11px] ml-1">(Default)</span>}</p>
                    <p>{addr.address_line_1} {addr.address_line_2}</p>
                    <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p>{addr.country}</p>
                    <p className="text-gray-500 mt-1">Phone: {addr.phone_number || 'N/A'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No addresses saved.</p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Recent Orders</h4>
            {customer.orders && customer.orders.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {customer.orders.map((order: Order) => (
                  <div key={order.id} className="bg-gray-50 flex justify-between items-center p-3 rounded-lg text-[13px]">
                    <div>
                      <p className="font-bold">Order #{order.id.slice(0, 8)}...</p>
                      <p className="text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-g1">₹{Number(order.total_amount).toFixed(2)}</p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-200">{order.order_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No orders yet.</p>
            )}
          </div>
        </div>
      );

      openModal('Customer Details', content, [
        { label: 'Close', onClick: closeModal, variant: 'secondary' }
      ]);
    } catch (error) {
      toast.error('Failed to load customer details');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[28px] font-black text-g3 leading-none">Customer Management</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-border-design p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-[120px] sm:h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[13px] sm:text-[14px] text-gray-500 font-bold uppercase tracking-wider">Total Customers</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <i className="fa-solid fa-users text-[14px] sm:text-[16px]"></i>
            </div>
          </div>
          <p className="text-[28px] sm:text-[36px] font-black text-g3 leading-none">{stats ? stats.total_customers : '-'}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-border-design p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-[120px] sm:h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[13px] sm:text-[14px] text-gray-500 font-bold uppercase tracking-wider">Active Customers</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <i className="fa-solid fa-user-check text-[14px] sm:text-[16px]"></i>
            </div>
          </div>
          <p className="text-[28px] sm:text-[36px] font-black text-emerald-600 leading-none">{stats ? stats.active_customers : '-'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-border-design p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-[120px] sm:h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[13px] sm:text-[14px] text-gray-500 font-bold uppercase tracking-wider">Inactive Customers</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <i className="fa-solid fa-user-xmark text-[14px] sm:text-[16px]"></i>
            </div>
          </div>
          <p className="text-[28px] sm:text-[36px] font-black text-red-500 leading-none">{stats ? stats.inactive_customers : '-'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-border-design p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-[120px] sm:h-[140px]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[13px] sm:text-[14px] text-gray-500 font-bold uppercase tracking-wider">New This Month</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <i className="fa-solid fa-user-plus text-[14px] sm:text-[16px]"></i>
            </div>
          </div>
          <p className="text-[28px] sm:text-[36px] font-black text-purple-600 leading-none">{stats ? stats.new_customers_this_month : '-'}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="w-full min-w-0 flex flex-col gap-4 bg-white p-3 sm:p-4 rounded-xl border border-border-design">
  
  {/* Search */}
  <div className="relative w-full min-w-0">
    <span className="absolute inset-y-0 left-0 hidden md:flex items-center pl-4 pointer-events-none">
    <i className="fa-solid fa-magnifying-glass text-gray-400 text-[14px]"></i>
  </span>

    <input
      type="text"
      placeholder="Search by name, email, phone..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
      className="block w-full min-w-0 border border-border-design rounded-xl pl-11 pr-4 py-3 sm:py-2.5 text-[14px] font-medium focus:border-g1 outline-none"
    />
  </div>

  {/* Filters */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
    <select
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(1);
      }}
      className="w-full min-w-0 border border-border-design rounded-xl px-3 sm:px-4 py-2.5 text-[14px] font-medium outline-none cursor-pointer focus:border-g1 bg-white"
    >
      <option value="">All Statuses</option>
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
    </select>

    <select
      value={sort}
      onChange={(e) => {
        setSort(e.target.value);
        setPage(1);
      }}
      className="w-full min-w-0 border border-border-design rounded-xl px-3 sm:px-4 py-2.5 text-[14px] font-medium outline-none cursor-pointer focus:border-g1 bg-white"
    >
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
    </select>
  </div>
</div>
      {/* Table */}
      <div className="bg-white rounded-xl border border-border-design overflow-hidden shadow-sm">
        {/* Desktop Table View - Hidden on mobile/tablet */}
        <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border-design bg-off/50">
                <th className="p-4 text-[13px] font-extrabold text-gray-600 uppercase">Customer</th>
                <th className="p-4 text-[13px] font-extrabold text-gray-600 uppercase">Contact</th>
                <th className="p-4 text-[13px] font-extrabold text-gray-600 uppercase">Orders & Spent</th>
                <th className="p-4 text-[13px] font-extrabold text-gray-600 uppercase">Status</th>
                <th className="p-4 text-[13px] font-extrabold text-gray-600 uppercase">Joined</th>
                <th className="p-4 text-[13px] font-extrabold text-gray-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-design animate-pulse">
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 mb-2"></div><div className="h-3 bg-gray-200 rounded w-32"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16 mb-2"></div><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                    <td className="p-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="p-4 text-right"><div className="h-8 bg-gray-200 rounded w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-semibold">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c: Customer) => (
                  <tr key={c.id} className="border-b border-border-design hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-gray-900 text-[14px]">{c.first_name} {c.last_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[14px] text-gray-800">{c.email}</p>
                      <p className="text-[12px] text-gray-500 font-semibold mt-0.5">{c.phone_number || 'No phone'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[14px] font-bold text-gray-900">{c.total_orders} orders</p>
                      <p className="text-[12px] text-g1 font-extrabold mt-0.5">₹{Number(c.total_spent).toFixed(2)} spent</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-[13px] font-semibold text-gray-600">{formatDate(c.created_at)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => viewCustomerDetails(c.id)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer border-none"
                        >
                          View
                        </button>
                        {c.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(c.id, 'INACTIVE')}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer border-none"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer border-none"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Hidden on desktop */}
        <div className="lg:hidden divide-y divide-border-design">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            ))
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-semibold">
              No customers found matching your criteria.
            </div>
          ) : (
            customers.map((c: Customer) => (
              <div key={c.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                {/* Customer Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-[14px] leading-tight mb-1">{c.first_name} {c.last_name}</h4>
                    <p className="text-[11px] text-gray-500">{c.email}</p>
                    <p className="text-[11px] text-gray-500">{c.phone_number || 'No phone'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold shrink-0 ${
                    c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {c.status}
                  </span>
                </div>

                {/* Customer Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Orders</span>
                    <span className="text-gray-800 font-bold text-[13px]">{c.total_orders}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Total Spent</span>
                    <span className="text-g1 font-black text-[13px]">₹{Number(c.total_spent).toFixed(2)}</span>
                  </div>
                </div>

                {/* Joined Date and Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <div className="text-[11px] text-gray-500">
                    <span className="font-semibold">Joined:</span> {formatDate(c.created_at)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewCustomerDetails(c.id)}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors border-none cursor-pointer active:scale-95"
                    >
                      View
                    </button>
                    {c.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStatusChange(c.id, 'INACTIVE')}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors border-none cursor-pointer active:scale-95"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors border-none cursor-pointer active:scale-95"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-border-design bg-gray-50/30">
            <p className="text-[13px] font-bold text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-white border border-border-design rounded-lg px-4 py-2 text-[13px] font-bold disabled:opacity-50 hover:bg-gray-50 transition cursor-pointer w-full sm:w-auto"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="bg-white border border-border-design rounded-lg px-4 py-2 text-[13px] font-bold disabled:opacity-50 hover:bg-gray-50 transition cursor-pointer w-full sm:w-auto"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
