import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';
import { formatDate } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';
import { AdminProductManager } from './AdminProductManager';
import { AdminCategoryManager } from './AdminCategoryManager';
import { AdminBrandManager } from './AdminBrandManager';
import { AdminInventoryManager } from './AdminInventoryManager';
import { AdminDistributorManager } from './AdminDistributorManager';
import { AdminReviewManager } from './AdminReviewManager';
import { AdminReportManager } from './AdminReportManager';
import { AdminSettings } from './AdminSettings';
import { AdminCustomerManager } from './AdminCustomerManager';
import { AdminNotificationManager } from './AdminNotificationManager';
import { AdminBannerManager } from './AdminBannerManager';
import { AdminWholesaleManager } from './AdminWholesaleManager';
import { dashboardService } from '../../services/dashboardService';
import { orderService } from '../../services/orderService';
import type { AdminOrder, OrderStats } from '../../services/orderService';
import { logoBase64 } from '../../assets/logoBase64';
import { userService } from '../../services/userService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const PortalViews: React.FC = () => {
  const navigate = useNavigate();
  // @ts-ignore
  const { user, updateUserWholesaleStatus, logout } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const { t, language } = useLanguage();

  // Store Settings state for dynamic invoice branding
  const [storeSettings, setStoreSettings] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('chennis_admin_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Synchronize store settings on update events
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const saved = localStorage.getItem('chennis_admin_settings');
        if (saved) setStoreSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to sync settings", e);
      }
    };
    window.addEventListener('chennis:settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('chennis:settings_updated', handleSettingsUpdate);
  }, []);

  const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    return `${API_HOST}${url}`;
  };

  // Local Database States
  const [orders, setOrders] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Dynamic Dashboard States
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [dashboardOrders, setDashboardOrders] = useState<any[]>([]);
  const [dashboardLowStock, setDashboardLowStock] = useState<any[]>([]);
  const [dashboardSales, setDashboardSales] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  // Admin Tab State
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [switchingAdminTab, setSwitchingAdminTab] = useState<boolean>(false);
  const handleAdminTabChange = (tab: string) => {
    setSwitchingAdminTab(true);
    setAdminTab(tab);
    setSidebarOpen(false);
    setTimeout(() => {
      setSwitchingAdminTab(false);
    }, 350); // fast and snappy 350ms loading spin
  };
  const [catalogSubTab, setCatalogSubTab] = useState<string>('products_list');

  // Customer Portal States
  const [customerTab, setCustomerTab] = useState<string>(user?.role === 'wholesale' ? 'wholesale' : 'profile');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    profile_image: user?.profile_image || '',
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(false);
  const [addressModalOpen, setAddressModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Customer Orders from API
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState<boolean>(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: 'Selangor',
    postal_code: '',
    country: 'Malaysia',
    is_default: false
  });

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!selectedInvoiceOrder) return;
    const originalConsoleError = console.error;
    try {
      setDownloadingPdf(true);
      const element = document.querySelector('.invoice-printable-area') as HTMLElement;
      if (!element) {
        toast.error('Invoice content element not found');
        return;
      }

      // Temporarily override console.error to filter out html2canvas oklch parsing warnings
      console.error = (...args: any[]) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('unsupported color function "oklch"')) {
          return;
        }
        if (args[0] instanceof Error && args[0].message.includes('unsupported color function "oklch"')) {
          return;
        }
        originalConsoleError.apply(console, args);
      };

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restore logger early
      console.error = originalConsoleError;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const invNo = selectedInvoiceOrder.order_number || selectedInvoiceOrder.id.substring(0, 10).toUpperCase();
      pdf.save(`invoice-${invNo}.pdf`);
      toast.success('Invoice PDF downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try browser print instead.');
    } finally {
      console.error = originalConsoleError;
      setDownloadingPdf(false);
    }
  };

  // Admin Order Management States
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [adminOrdersStats, setAdminOrdersStats] = useState<OrderStats | null>(null);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState<boolean>(true);
  const [adminOrdersPage, setAdminOrdersPage] = useState<number>(1);
  const [adminOrdersTotalPages, setAdminOrdersTotalPages] = useState<number>(1);
  const [adminOrdersTotalCount, setAdminOrdersTotalCount] = useState<number>(0);
  const [adminOrdersSearch, setAdminOrdersSearch] = useState<string>('');
  const [adminOrdersStatus, setAdminOrdersStatus] = useState<string>('All Statuses');
  const [adminOrdersType, setAdminOrdersType] = useState<string>('All Types');
  const [adminOrdersDateRange, setAdminOrdersDateRange] = useState<string>('All Dates');
  const [adminSelectedOrder, setAdminSelectedOrder] = useState<AdminOrder | null>(null);

  // Fetch admin orders list and stats
  const fetchAdminOrders = useCallback(async () => {
    if (adminTab !== 'orders') return;
    setAdminOrdersLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        orderService.getAdminOrders({
          page: adminOrdersPage,
          limit: 10,
          search: adminOrdersSearch || undefined,
          status: adminOrdersStatus === 'All Statuses' ? undefined : adminOrdersStatus,
          type: adminOrdersType === 'All Types' ? undefined : adminOrdersType,
          dateRange: adminOrdersDateRange === 'All Dates' ? undefined : adminOrdersDateRange,
        }),
        orderService.getAdminOrderStats(),
      ]);

      if (listRes.success && listRes.data) {
        setAdminOrders(listRes.data.orders);
        setAdminOrdersTotalPages(listRes.data.pagination.total_pages);
        setAdminOrdersTotalCount(listRes.data.pagination.total);
        
        if (listRes.data.orders.length > 0) {
          const matched = listRes.data.orders.find((o) => o.id === adminSelectedOrder?.id);
          setAdminSelectedOrder(matched || listRes.data.orders[0]);
        } else {
          setAdminSelectedOrder(null);
        }
      }

      if (statsRes.success && statsRes.data) {
        setAdminOrdersStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin orders:', error);
      toast.error('Failed to load orders data');
    } finally {
      setAdminOrdersLoading(false);
    }
  }, [adminTab, adminOrdersPage, adminOrdersSearch, adminOrdersStatus, adminOrdersType, adminOrdersDateRange, adminSelectedOrder?.id, toast]);

  useEffect(() => {
    fetchAdminOrders();
  }, [adminTab, adminOrdersPage, adminOrdersStatus, adminOrdersType, adminOrdersDateRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminOrdersPage(1);
    fetchAdminOrders();
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case 'PENDING': return 'CONFIRMED';
      case 'CONFIRMED': return 'PROCESSING';
      case 'PROCESSING': return 'SHIPPED';
      case 'SHIPPED': return 'DELIVERED';
      default: return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case 'PENDING': return 'Confirm Order';
      case 'CONFIRMED': return 'Mark Packed';
      case 'PROCESSING': return 'Mark Shipped';
      case 'SHIPPED': return 'Mark Delivered';
      default: return null;
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const next = getNextStatus(currentStatus);
    if (!next) return;
    try {
      const confirm = await modal.confirm('Update Order Status', `Are you sure you want to change order status to ${next.toLowerCase()}?`);
      if (confirm) {
        const res = await orderService.updateOrderStatus(orderId, next);
        if (res.success) {
          toast.success(`Order status updated to ${next.toLowerCase()}!`);
          fetchAdminOrders();
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const confirm = await modal.confirm('Cancel Order', 'Are you sure you want to cancel this order? This will restore inventory.');
      if (confirm) {
        const res = await orderService.cancelOrder(orderId);
        if (res.success) {
          toast.success('Order cancelled successfully!');
          fetchAdminOrders();
        }
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const handleExportOrders = () => {
    if (adminOrders.length === 0) {
      toast.warning('No orders to export');
      return;
    }
    const headers = 'Order ID,Customer,Type,Items,Amount,Status,Date\n';
    const rows = adminOrders
      .map(
        (o) =>
          `#CN-${o.order_number},"${o.user.first_name} ${o.user.last_name}",${o.type},${o.total_items},RM ${parseFloat(
            o.total_amount
          ).toFixed(2)},${o.order_status},"${formatDate(o.created_at)}"`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported successfully!');
  };



  // Mobile Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleReset = () => setAdminTab('overview');
    window.addEventListener('reset-admin-tab', handleReset);
    return () => window.removeEventListener('reset-admin-tab', handleReset);
  }, []);


  // Load database values on load
  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem('Orders') || '[]'));
    setApplications(JSON.parse(localStorage.getItem('WholesaleApplications') || '[]'));
    setUsersList(JSON.parse(localStorage.getItem('Users') || '[]'));
  }, []);

  // Sync profileForm with user object when it is loaded/updated
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        profile_image: user.profile_image || '',
      });
    }
  }, [user]);

  // Fetch saved addresses from backend
  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await userService.getAddresses();
      if (res.data) {
        setAddresses(res.data);
      }
    } catch (error) {
      console.error('Failed to load user addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'customer' && customerTab === 'addresses') {
      fetchAddresses();
    }
  }, [customerTab, user?.role, fetchAddresses]);

  // Fetch customer orders from backend
  const fetchCustomerOrders = useCallback(async () => {
    setLoadingCustomerOrders(true);
    try {
      const res = await orderService.getOrders({ page: 1, limit: 50 });
      if (res.success && res.data?.data) {
        setCustomerOrders(res.data.data);
      } else {
        setCustomerOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch customer orders:', error);
      setCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
    }
  }, []);

  useEffect(() => {
    if ((user?.role === 'customer' && customerTab === 'orders') || user?.role === 'wholesale') {
      fetchCustomerOrders();
    }
  }, [customerTab, user?.role, fetchCustomerOrders]);

  // Save changes to user profile
  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone_number: profileForm.phone_number,
      });
      if (res.data) {
        toast.success('Profile updated successfully!');
        
        // Retrieve current Session object
        const storedSession = localStorage.getItem('Session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          session.currentUser = {
            ...session.currentUser,
            first_name: res.data.first_name,
            last_name: res.data.last_name,
            name: `${res.data.first_name} ${res.data.last_name}`.trim(),
            phone_number: res.data.phone_number,
          };
          localStorage.setItem('Session', JSON.stringify(session));
          window.dispatchEvent(new Event('auth:sync'));
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to save profile changes');
    } finally {
      setSavingProfile(false);
    }
  };

  // Upload new avatar image
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await userService.uploadAvatar(formData);
      if (res.data) {
        toast.success('Profile picture updated!');
        setProfileForm(p => ({ ...p, profile_image: res.data.profile_image }));
        
        const storedSession = localStorage.getItem('Session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          session.currentUser = {
            ...session.currentUser,
            profile_image: res.data.profile_image,
          };
          localStorage.setItem('Session', JSON.stringify(session));
          window.dispatchEvent(new Event('auth:sync'));
        }
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload avatar image');
    }
  };

  // Saved Addresses API Calls
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.full_name || !addressForm.address_line_1 || !addressForm.city || !addressForm.postal_code) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, addressForm);
        toast.success('Address updated successfully!');
      } else {
        await userService.createAddress(addressForm);
        toast.success('Address added successfully!');
      }
      setAddressModalOpen(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address details');
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddressForm({
      full_name: addr.full_name,
      phone_number: addr.phone_number || '',
      address_line_1: addr.address_line1,
      address_line_2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default
    });
    setAddressModalOpen(true);
  };

  const handleDeleteAddress = async (id: number) => {
    const approved = await modal.confirm(
      'Delete Address',
      'Are you sure you want to delete this address?'
    );
    if (approved) {
      try {
        await userService.deleteAddress(id);
        toast.success('Address deleted successfully');
        fetchAddresses();
      } catch (error) {
        console.error('Failed to delete address:', error);
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await userService.updateAddress(id, { is_default: true });
      toast.success('Default address updated!');
      fetchAddresses();
    } catch (error) {
      console.error('Failed to update default address:', error);
      toast.error('Failed to set default address');
    }
  };

  const openNewAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      full_name: user?.name || '',
      phone_number: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: 'Selangor',
      postal_code: '',
      country: 'Malaysia',
      is_default: addresses.length === 0
    });
    setAddressModalOpen(true);
  };

  // Fetch dynamic dashboard data
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      const fetchDashboardData = async () => {
        setLoadingDashboard(true);
        try {
          const [summaryRes, ordersRes, lowStockRes, salesRes] = await Promise.all([
            dashboardService.getSummary(),
            dashboardService.getRecentOrders(),
            dashboardService.getLowStock(),
            dashboardService.getSalesOverview(),
          ]);
          setDashboardSummary(summaryRes.data);
          setDashboardOrders(ordersRes.data || []);
          setDashboardLowStock(lowStockRes.data || []);
          setDashboardSales(salesRes.data);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
          toast.error('Failed to load dashboard statistics from backend.');
        } finally {
          setLoadingDashboard(false);
        }
      };

      fetchDashboardData();
    }
  }, [user, toast]);

  // Use orders fetched from the backend API
  const userOrders = customerOrders;

  // Admin: Approve wholesale applicant
  // @ts-ignore
  const handleApproveWholesale = (userId: string, appId: string) => {
    const updatedUsers = usersList.map((u) => {
      if (u.id === userId) {
        return { ...u, role: 'wholesale', wholesaleStatus: 'approved' };
      }
      return u;
    });
    const updatedApps = applications.map((a) => {
      if (a.id === appId) {
        return { ...a, status: 'approved', approvedBy: user?.email, approvedAt: new Date().toISOString() };
      }
      return a;
    });

    localStorage.setItem('Users', JSON.stringify(updatedUsers));
    localStorage.setItem('WholesaleApplications', JSON.stringify(updatedApps));

    setUsersList(updatedUsers);
    setApplications(updatedApps);
    toast.success('Wholesale account approved successfully!');
  };

  // Admin: Reject wholesale applicant
  // @ts-ignore
  const handleRejectWholesale = async (userId: string, appId: string) => {
    const remarks = await modal.prompt('Reject Application', 'Does not meet volume requirements.', 'Please specify reason for rejection:');
    if (remarks === null) return;

    const updatedUsers = usersList.map((u) => {
      if (u.id === userId) {
        return { ...u, wholesaleStatus: 'none' };
      }
      return u;
    });
    const updatedApps = applications.map((a) => {
      if (a.id === appId) {
        return { ...a, status: 'rejected', rejectedBy: user?.email, rejectedAt: new Date().toISOString(), adminRemarks: remarks };
      }
      return a;
    });

    localStorage.setItem('Users', JSON.stringify(updatedUsers));
    localStorage.setItem('WholesaleApplications', JSON.stringify(updatedApps));

    setUsersList(updatedUsers);
    setApplications(updatedApps);
    toast.info('Application rejected.');
  };

  // Wholesale apply handler (simulates buyer request)
  const handleWholesaleApply = async () => {
    const confirmApply = await modal.confirm('Submit Application', 'Submit application for a Wholesale account?');
    if (!confirmApply) return;

    // @ts-ignore
    if (updateUserWholesaleStatus) updateUserWholesaleStatus('pending');

    const newApp = {
      id: 'wa' + Date.now(),
      userId: user?.id,
      status: 'pending',
      date: new Date().toISOString(),
      businessDetails: { bname: 'Self Employed', btype: 'Retailer' }
    };

    const currentApps = JSON.parse(localStorage.getItem('WholesaleApplications') || '[]');
    currentApps.push(newApp);
    localStorage.setItem('WholesaleApplications', JSON.stringify(currentApps));
    setApplications(currentApps);

    toast.success('Application submitted! Administrators will review shortly.');
  };

  // Admin: Update order statuses
  // @ts-ignore
  const handleToggleOrderStatus = (orderId: string) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: o.status === 'processing' ? 'completed' : 'processing' };
      }
      return o;
    });
    localStorage.setItem('Orders', JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  };

  // CSV export mockup
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Category,Product,Wholesale Price,Market Price\n" +
      "Food,Cold-Pressed Coconut Oil,RM 24.00,RM 28.90\n" +
      "Cosmetics,Rose Hip Brightening Serum,RM 42.00,RM 54.00\n" +
      "Construction,Bamboo Flooring Slab,RM 75.00,RM 89.00";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wholesale-price-catalog.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in flex flex-col w-full text-left md:px-4 lg:px-8 xl:px-20 max-w-[1900px] mx-auto">
      
      {/* Mobile Sidebar Toggle & Overlay */}
      <>
        <button 
          className="sidebar-toggle lg:hidden fixed top-20 left-4 z-40 bg-g1 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div 
          className={`sidebar-overlay fixed inset-0 bg-black/50 z-30 lg:hidden ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        ></div>
      </>

      {/* 1. CUSTOMER PORTAL VIEWS */}
      {(user?.role === 'customer' || user?.role === 'wholesale') && (
        <div className="admin-container">
          {/* Left Sidebar */}
          <div className={`dash-sidebar text-left fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : ''}`}>
            <div className="dash-user">
              <div className="dash-avatar">
                {profileForm.profile_image ? (
                  <img src={getFullImageUrl(profileForm.profile_image)} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  user.first_name ? `${user.first_name[0].toUpperCase()}${user.last_name ? user.last_name[0].toUpperCase() : ''}` : 'U'
                )}
              </div>
              <div>
                <div className="dash-name font-bold text-txt">{profileForm.first_name} {profileForm.last_name}</div>
                <div className="dash-email text-[12px] text-muted">{user.email}</div>
              </div>
            </div>             <ul className="dash-nav flex flex-col m-0 p-0 list-none">
              {user?.role === 'wholesale' && (
                <li>
                  <button
                    onClick={() => { setCustomerTab('wholesale'); setSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${customerTab === 'wholesale' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                  >
                    <i className="fa-solid fa-tags text-[18px] w-5"></i>
                    <span className="nav-text">{t('customer_wholesale')}</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => { setCustomerTab('profile'); setSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${customerTab === 'profile' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-user-circle text-[18px] w-5"></i>
                  <span className="nav-text">{t('customer_profile')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCustomerTab('orders'); setSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${customerTab === 'orders' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-box-open text-[18px] w-5"></i>
                  <span className="nav-text">{t('customer_orders')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCustomerTab('addresses'); setSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${customerTab === 'addresses' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-location-dot text-[18px] w-5"></i>
                  <span className="nav-text">{t('customer_addresses')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 bg-transparent text-[#E74C3C] font-semibold hover:bg-red-50 mt-4"
                >
                  <i className="fa-solid fa-sign-out-alt text-[18px] w-5"></i>
                  <span className="nav-text">{t('nav_logout')}</span>
                </button>
              </li>
            </ul>
            {/* Wholesale apply state at bottom of sidebar */}
            <div className="mt-8">
              {/* @ts-ignore */}
              {user?.wholesaleStatus === 'none' && (
                <button
                  onClick={handleWholesaleApply}
                  className="w-full text-center py-2.5 px-4 bg-g1 hover:bg-g3 border-none rounded-xl text-[13px] font-bold text-white cursor-pointer transition shadow-sm"
                >
                  {t('customer_apply_wholesale')}
                </button>
              )}
              {/* @ts-ignore */}
              {user?.wholesaleStatus === 'pending' && (
                <div className="text-[12px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center uppercase tracking-wide">
                  Wholesale: Pending
                </div>
              )}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="dash-main text-left lg:ml-0">
            {customerTab === 'profile' && (
              <div className="flex flex-col gap-4 lg:gap-6">
                <div className="flex justify-between items-center border-b border-border-design pb-4 flex-wrap gap-4">
                  <div>
                    <h1 className="text-[28px] font-black text-[#0B8F3A] leading-none">{t('customer_profile')}</h1>
                    <p className="text-gray-500 text-[13.5px] mt-1.5 font-semibold">{t('customer_profile_subtitle')}</p>
                  </div>
                </div>

                <div className="dash-box">
                  {/* Photo Edit Wrapper */}
                  <div className="flex items-center gap-4 lg:gap-6 mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-border-design flex-wrap">
                    <div className="w-[80px] h-[80px] lg:w-[100px] lg:h-[100px] rounded-full overflow-hidden border-2 border-g1/20 flex items-center justify-center bg-g1/5 text-g1 font-extrabold text-[28px] lg:text-[36px]">
                      {profileForm.profile_image ? (
                        <img src={getFullImageUrl(profileForm.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user.first_name ? `${user.first_name[0].toUpperCase()}${user.last_name ? user.last_name[0].toUpperCase() : ''}` : 'U'
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="bg-g1 hover:bg-g3 text-white border-none rounded-lg py-2 px-4 text-[13px] font-bold cursor-pointer transition shadow-sm inline-block text-center w-max">
                        {t('customer_change_photo')}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                      <div className="text-muted text-[12px]">{t('customer_photo_hint')}</div>
                    </div>
                  </div>

                  {/* Profile Edit Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">{t('customer_first_name')}</label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                        className="w-full border border-border-design rounded-xl px-4 py-3 text-[14px] bg-white text-txt outline-none focus:border-g1 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">{t('customer_last_name')}</label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                        className="w-full border border-border-design rounded-xl px-4 py-3 text-[14px] bg-white text-txt outline-none focus:border-g1 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">{t('customer_email')}</label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full border border-border-design rounded-xl px-4 py-3 text-[14px] bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">{t('customer_phone')}</label>
                      <input
                        type="text"
                        name="phone_number"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                        className="w-full border border-border-design rounded-xl px-4 py-3 text-[14px] bg-white text-txt outline-none focus:border-g1 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">{t('customer_lang_pref')}</label>
                      <select
                        value={language}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          try {
                            const savedSettings = localStorage.getItem('chennis_admin_settings');
                            const settingsObj = savedSettings ? JSON.parse(savedSettings) : {};
                            settingsObj.language = newLang;
                            localStorage.setItem('chennis_admin_settings', JSON.stringify(settingsObj));
                            // Fire custom event to sync language context immediately
                            window.dispatchEvent(new Event('chennis:settings_updated'));
                            toast.success(
                              newLang === 'English (US)' 
                                ? 'Language updated successfully' 
                                : newLang === 'Bahasa Melayu' 
                                  ? 'Bahasa berjaya dikemas kini' 
                                  : '语言更新成功'
                            );
                          } catch (err) {
                            console.error("Failed to change user language settings preference", err);
                          }
                        }}
                        className="w-full border border-border-design rounded-xl px-4 py-3 text-[14px] bg-white text-txt outline-none focus:border-g1 transition font-bold"
                      >
                        <option value="English (US)">English (US)</option>
                        <option value="Bahasa Melayu">Bahasa Melayu</option>
                        <option value="Mandarin">Mandarin</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-3 px-8 text-[14px] font-bold cursor-pointer transition shadow-sm disabled:opacity-50"
                  >
                    {savingProfile ? t('customer_saving') : t('btn_save_changes')}
                  </button>
                </div>
              </div>
            )}

            {customerTab === 'orders' && (
              <div className="flex flex-col gap-4 lg:gap-6">
                <div className="flex justify-between items-center border-b border-border-design pb-4">
                  <div>
                    <h1 className="text-[22px] lg:text-[28px] font-black text-[#0B8F3A] leading-none">My Orders</h1>
                    <p className="text-gray-500 text-[12px] lg:text-[13.5px] mt-1.5 font-semibold">View and track your purchase history.</p>
                  </div>
                </div>

                <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="bg-off border-b border-border-design p-3 lg:p-4">
                    <h3 className="font-extrabold text-[13px] lg:text-[15px] text-[#0B8F3A] uppercase tracking-wide">Recent Purchases</h3>
                  </div>
                  {loadingCustomerOrders ? (
                    <div className="p-8 lg:p-12 text-center text-gray-500 text-[13px] lg:text-[13.5px]">Loading orders...</div>
                  ) : userOrders.length === 0 ? (
                    <div className="p-8 lg:p-12 text-center text-gray-500 text-[13px] lg:text-[13.5px]">No purchase history found.</div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="lg:hidden divide-y divide-border-design">
                        {userOrders.map((ord: any) => {
                          const statusColors: Record<string, string> = {
                            PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
                            CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
                            PROCESSING: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                            SHIPPED: 'bg-purple-50 text-purple-700 border border-purple-200',
                            DELIVERED: 'bg-emerald-50 text-g1 border border-g1/10',
                            CANCELLED: 'bg-red-50 text-red-600 border border-red-200',
                          };
                          return (
                            <div key={ord.id} className="p-4 hover:bg-off cursor-pointer" onClick={() => navigate(`/order/success/${ord.id}`)}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-gray-800 text-sm">#{ord.order_number}</div>
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusColors[ord.order_status] || 'bg-gray-100 text-gray-600'}`}>
                                  {ord.order_status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">{formatDate(ord.created_at)}</div>
                              <div className="text-xs text-gray-600 mb-1">{ord.items?.length || 0} items</div>
                              <div className="text-xs text-gray-600 mb-2 truncate">
                                {ord.shippingAddress ? `${ord.shippingAddress.address_line1}, ${ord.shippingAddress.city}` : '—'}
                              </div>
                              <div className="font-extrabold text-[#0B8F3A] text-sm">RM {parseFloat(ord.total_amount || '0').toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full border-collapse text-[13px]">
                          <thead>
                            <tr className="border-b border-border-design bg-off text-gray-700 font-semibold text-left">
                              <th className="p-3">Order #</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Items</th>
                              <th className="p-3">Shipping Address</th>
                              <th className="p-3">Grand Total</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-design">
                            {userOrders.map((ord: any) => {
                              const statusColors: Record<string, string> = {
                                PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
                                CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
                                PROCESSING: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                                SHIPPED: 'bg-purple-50 text-purple-700 border border-purple-200',
                                DELIVERED: 'bg-emerald-50 text-g1 border border-g1/10',
                                CANCELLED: 'bg-red-50 text-red-600 border border-red-200',
                              };
                              return (
                                <tr key={ord.id} className="hover:bg-off cursor-pointer" onClick={() => navigate(`/order/success/${ord.id}`)}>
                                  <td className="p-3 font-bold text-gray-800">{ord.order_number}</td>
                                  <td className="p-3 text-gray-700">{formatDate(ord.created_at)}</td>
                                  <td className="p-3 text-gray-700">{ord.items?.length || 0} item{(ord.items?.length || 0) !== 1 ? 's' : ''}</td>
                                  <td className="p-3 text-gray-700">
                                    {ord.shippingAddress
                                      ? `${ord.shippingAddress.address_line1}, ${ord.shippingAddress.city}`
                                      : '—'}
                                  </td>
                                  <td className="p-3 font-extrabold text-[#0B8F3A]">RM {parseFloat(ord.total_amount || '0').toFixed(2)}</td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusColors[ord.order_status] || 'bg-gray-100 text-gray-600'}`}>
                                      {ord.order_status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {customerTab === 'addresses' && (
              <div className="flex flex-col gap-4 lg:gap-6">
                <div className="flex justify-between items-center border-b border-border-design pb-4 flex-wrap gap-4">
                  <div>
                    <h1 className="text-[22px] lg:text-[28px] font-black text-[#0B8F3A] leading-none">Saved Addresses</h1>
                    <p className="text-gray-500 text-[12px] lg:text-[13.5px] mt-1.5 font-semibold">Manage your default and secondary shipping addresses.</p>
                  </div>
                  <button
                    onClick={openNewAddressModal}
                    className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2.5 px-4 lg:px-5 text-[12px] lg:text-[13px] font-bold cursor-pointer transition shadow-sm"
                  >
                    + Add New Address
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="p-8 lg:p-12 text-center text-gray-500 text-[13px] lg:text-[13.5px]">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="p-8 lg:p-12 text-center text-gray-500 text-[13px] lg:text-[13.5px] border border-dashed border-border-design rounded-2xl bg-white">
                    No addresses found. Click "+ Add New Address" to save one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="dash-box relative"
                        style={{ border: addr.is_default ? '2px solid var(--g1)' : '1.5px solid var(--border)' }}
                      >
                        {addr.is_default && (
                          <div className="absolute top-5 right-5 bg-g1 text-white text-[11px] font-extrabold px-2.5 py-1 rounded">
                            DEFAULT
                          </div>
                        )}
                        <h4 className="font-extrabold text-[16px] text-g3 mb-2">{addr.full_name}</h4>
                        <p className="text-muted text-[13.5px] leading-relaxed mb-4">
                          {addr.phone_number && <>{addr.phone_number}<br /></>}
                          {addr.address_line1}<br />
                          {addr.address_line2 && <>{addr.address_line2}<br /></>}
                          {addr.postal_code} {addr.city}<br />
                          {addr.state}, {addr.country}
                        </p>
                        <div className="flex gap-4 border-t border-border-design pt-4 text-[13px]">
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="bg-transparent border-none text-g1 font-extrabold cursor-pointer hover:underline p-0"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleEditAddress(addr)}
                            className="bg-transparent border-none text-g1 font-extrabold cursor-pointer hover:underline p-0"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="bg-transparent border-none text-[#E74C3C] font-extrabold cursor-pointer hover:underline p-0"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Address Form Modal */}
                {addressModalOpen && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[1100] p-3 lg:p-4">
                    <div className="bg-white rounded-2xl border border-border-design max-w-[500px] w-full p-4 lg:p-6 shadow-xl relative animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                      <h3 className="font-extrabold text-[16px] lg:text-[18px] text-[#0B8F3A] mb-3 lg:mb-4 uppercase tracking-wide border-b border-border-design pb-2">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <form onSubmit={handleAddressSubmit} className="flex flex-col gap-3 lg:gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Recipient's Full Name</label>
                          <input
                            type="text"
                            required
                            value={addressForm.full_name}
                            onChange={(e) => setAddressForm(f => ({ ...f, full_name: e.target.value }))}
                            className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                          <input
                            type="text"
                            value={addressForm.phone_number}
                            onChange={(e) => setAddressForm(f => ({ ...f, phone_number: e.target.value }))}
                            className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Address Line 1</label>
                          <input
                            type="text"
                            required
                            value={addressForm.address_line_1}
                            onChange={(e) => setAddressForm(f => ({ ...f, address_line_1: e.target.value }))}
                            className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            value={addressForm.address_line_2}
                            onChange={(e) => setAddressForm(f => ({ ...f, address_line_2: e.target.value }))}
                            className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] lg:text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">City</label>
                            <input
                              type="text"
                              required
                              value={addressForm.city}
                              onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                              className="border border-border-design rounded-xl px-3 py-2 text-[13px] lg:text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] lg:text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Postal Code</label>
                            <input
                              type="text"
                              required
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm(f => ({ ...f, postal_code: e.target.value }))}
                              className="border border-border-design rounded-xl px-3 py-2 text-[13px] lg:text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] lg:text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">State</label>
                            <select
                              value={addressForm.state}
                              onChange={(e) => setAddressForm(f => ({ ...f, state: e.target.value }))}
                              className="border border-border-design rounded-xl px-3 py-2 text-[13px] lg:text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                            >
                              {['Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Sabah', 'Sarawak', 'Perak', 'Kedah', 'Kelantan', 'Terengganu', 'Pahang', 'Negeri Sembilan', 'Melaka', 'Perlis', 'Labuan', 'Putrajaya'].map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] lg:text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Country</label>
                            <input
                              type="text"
                              required
                              value={addressForm.country}
                              onChange={(e) => setAddressForm(f => ({ ...f, country: e.target.value }))}
                              className="border border-border-design rounded-xl px-3 py-2 text-[13px] lg:text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id="is_default"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                            className="cursor-pointer accent-g1"
                          />
                          <label htmlFor="is_default" className="text-[12.5px] font-semibold text-gray-600 cursor-pointer">
                            Set as default shipping address
                          </label>
                        </div>
                        <div className="flex gap-2 lg:gap-3 justify-end mt-3 lg:mt-4">
                          <button
                            type="button"
                            onClick={() => { setAddressModalOpen(false); setEditingAddress(null); }}
                            className="px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-100 hover:bg-gray-200 border-none rounded-xl text-[12px] lg:text-[13px] font-bold cursor-pointer text-txt transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 lg:px-5 py-2 lg:py-2.5 bg-g1 hover:bg-g3 border-none rounded-xl text-[12px] lg:text-[13px] font-bold cursor-pointer text-white transition"
                          >
                            Save Address
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
            {customerTab === 'wholesale' && user?.role === 'wholesale' && (
              <div className="flex flex-col gap-4 lg:gap-6">
                <div className="flex justify-between items-center border-b border-border-design pb-4 flex-wrap gap-4">
                  <div>
                    <h1 className="text-[22px] lg:text-[28px] font-black text-[#0B8F3A] leading-none">Wholesale Buyer Portal</h1>
                    <p className="text-gray-500 text-[12px] lg:text-[13.5px] mt-1.5 font-semibold">Welcome, {user.first_name}! Access bulk purchasing sheets and export pricing guidelines.</p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-2.5 px-4 lg:px-5 text-[12px] lg:text-[13px] font-bold cursor-pointer transition shadow-sm"
                  >
                    Export Price Sheet (CSV)
                  </button>
                </div>

                {/* Wholesale Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6 mb-4">
                  <div className="bg-white border border-border-design rounded-2xl p-4 lg:p-5 shadow-sm text-left">
                    <span className="text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wide">Corporate Discount</span>
                    <span className="text-[22px] lg:text-[26px] font-black text-[#0B8F3A] block mt-1">
                      {user?.wholesale_discount ? `${user.wholesale_discount}% Off List` : 'Up to 20% Off List'}
                    </span>
                  </div>
                  <div className="bg-white border border-border-design rounded-2xl p-4 lg:p-5 shadow-sm text-left">
                    <span className="text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wide">Outstanding Invoices</span>
                    <span className="text-[22px] lg:text-[26px] font-black text-gray-800 block mt-1">RM 0.00 (Paid)</span>
                  </div>
                  <div className="bg-white border border-border-design rounded-2xl p-4 lg:p-5 shadow-sm text-left">
                    <span className="text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wide">Procurement tier</span>
                    <span className="text-[22px] lg:text-[26px] font-black text-[#0B8F3A] block mt-1">
                      {user?.wholesale_tier || 'Gold Distributor'}
                    </span>
                  </div>
                </div>

                {/* Wholesale Resources */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="lg:col-span-2 border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden text-left">
                    <div className="bg-off border-b border-border-design p-3 lg:p-4">
                      <h3 className="font-extrabold text-[13px] lg:text-[15px] text-[#0B8F3A] uppercase tracking-wide">Distributor Orders</h3>
                    </div>
                    {userOrders.length === 0 ? (
                      <div className="p-8 lg:p-12 text-center text-gray-500 text-[13px] lg:text-[13.5px]">No recent bulk orders found.</div>
                    ) : (
                      <>
                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-border-design">
                          {userOrders.map((ord: any, idx: number) => (
                            <div key={`${ord.id}-${idx}`} className="p-4 hover:bg-off cursor-pointer" onClick={() => navigate(`/order/success/${ord.id}`)}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-gray-800 text-sm">{ord.order_number}</div>
                                <div className="text-[11px] text-gray-500">{formatDate(ord.created_at)}</div>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-xs text-gray-600">{ord.items?.length || 0} items</div>
                                <div className="font-extrabold text-[#0B8F3A] text-sm">RM {parseFloat(ord.total_amount || '0').toFixed(2)}</div>
                              </div>
                              <div className="text-[11px] text-[#0B8F3A] font-semibold" onClick={(e) => { e.stopPropagation(); setSelectedInvoiceOrder(ord); }}>
                                Download Invoice
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {ord.order_status === 'DELIVERED' ? 'Delivered' : ord.order_status === 'SHIPPED' ? 'In Transit' : ord.order_status}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="w-full border-collapse text-[13px]">
                            <thead>
                              <tr className="border-b border-border-design bg-off text-gray-700 font-semibold text-left">
                                <th className="p-3">Bulk Order</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Invoice</th>
                                <th className="p-3">Delivery</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-design">
                              {userOrders.map((ord: any, idx: number) => (
                                <tr key={`${ord.id}-${idx}`} className="hover:bg-off cursor-pointer" onClick={() => navigate(`/order/success/${ord.id}`)}>
                                  <td className="p-3 font-bold text-gray-800">{ord.order_number}</td>
                                  <td className="p-3 text-gray-700">{formatDate(ord.created_at)}</td>
                                  <td className="p-3 font-extrabold text-[#0B8F3A]">RM {parseFloat(ord.total_amount || '0').toFixed(2)}</td>
                                  <td 
                                    className="p-3 text-[#0B8F3A] font-semibold hover:underline cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvoiceOrder(ord);
                                    }}
                                  >
                                    Download Invoice
                                  </td>
                                  <td className="p-3 text-gray-700">{ord.order_status === 'DELIVERED' ? 'Delivered' : ord.order_status === 'SHIPPED' ? 'In Transit' : ord.order_status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border border-border-design rounded-2xl p-4 lg:p-5 bg-white shadow-sm flex flex-col gap-3 lg:gap-4 text-left">
                    <h4 className="font-extrabold text-[13px] lg:text-[14.5px] text-[#0B8F3A] uppercase tracking-wide border-b border-border-design pb-2">Wholesale Rules</h4>
                    <ul className="list-disc pl-4 flex flex-col gap-2 text-[12px] lg:text-[13px] text-gray-500 leading-tight">
                      <li>Minimum Order Quantity (MOQ) limits apply on construction cement aggregate grids.</li>
                      <li>Invoices must be settled within 30 days of packaging dispatch.</li>
                      <li>Wholesale prices automatically display across the catalog list if signed in.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ADMIN PORTAL VIEWS */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div className="admin-container">
          {/* Left Sidebar */}
          <div className={`dash-sidebar text-left ${sidebarOpen ? 'active' : ''}`}>
            <div className="sidebar-logo-container">
              <img src={logoBase64} alt="Chennis Logo" className="sidebar-logo" />
            </div>
            <h2 className="text-[20px] text-g1 mb-1 font-extrabold">{t('admin_portal')}</h2>
            <div className="text-[13px] text-muted mb-4 font-semibold">Super Admin</div>

            <ul className="dash-nav flex flex-col  m-0 p-0 list-none">
              <li>
                <button
                  onClick={() => handleAdminTabChange('overview')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'overview' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-gauge-high text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_overview')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('products')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'products' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-box text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_catalog')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('inventory')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'inventory' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-chart-bar text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_inventory')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('orders')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'orders' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-clipboard-list text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_orders')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('customers')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'customers' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-users text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_customers')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('wholesale')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'wholesale' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-tag text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_wholesale')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('distributors')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'distributors' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-truck text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_distributors')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('reviews')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'reviews' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-star text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_reviews')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('reports')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'reports' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-chart-line text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_reports')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('campaigns')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'campaigns' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-rectangle-ad text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_campaigns')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('notifications')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'notifications' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-bell text-[18px] w-5"></i>
                  <span className="nav-text">Notifications</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('notifications')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'notifications' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-bell text-[18px] w-5"></i>
                  <span className="nav-text">Notifications</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAdminTabChange('settings')}
                  className={`w-full text-left px-4 py-3 border-none rounded-lg text-[14px] cursor-pointer transition-colors flex items-center gap-3 ${adminTab === 'settings' ? 'bg-off text-g1 font-bold' : 'bg-transparent text-txt font-semibold hover:bg-gray-50'}`}
                >
                  <i className="fa-solid fa-gear text-[18px] w-5"></i>
                  <span className="nav-text">{t('admin_settings')}</span>
                </button>
              </li>
            </ul>

            <div className="mt-8 pt-8 border-t border-border-design">
              <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                <li>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full text-left px-4 py-2 bg-transparent border-none text-g1 font-semibold cursor-pointer hover:underline flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-left text-[14px]"></i> {t('back_to_shop')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full text-left px-4 py-2 bg-transparent border-none text-[#E74C3C] font-semibold cursor-pointer"
                  >
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Main Content */}
          <div className={`dash-main text-left ${sidebarOpen ? 'expanded' : ''}`}>
            {switchingAdminTab ? (
              <div className="flex flex-col justify-center items-center h-[50vh] w-full gap-3 select-none">
                <div className="w-12 h-12 border-4 border-g1/10 border-t-g1 rounded-full animate-spin"></div>
                <span className="text-[14px] font-bold text-muted animate-pulse">Loading...</span>
              </div>
            ) : (
              <>
                {adminTab === 'overview' && (
              loadingDashboard ? (
                <div className="flex justify-center items-center h-64 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-g1"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h2 className="text-[28px] font-black text-g3 leading-none">{t('title_overview')}</h2>

                  {/* KPI Metrics Grid */}
                  <div className="admin-kpi-grid">
                    <div className="admin-kpi-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[14px] font-semibold text-muted">{t('kpi_total_products')}</span>
                        <div className="w-10 h-10 bg-[rgba(39,174,96,0.1)] rounded-xl flex items-center justify-center text-g1"><i className="fa-solid fa-box"></i></div>
                      </div>
                      <span className="text-[32px] font-extrabold text-g3 leading-none">
                        {dashboardSummary?.total_products ?? 0}
                      </span>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[14px] font-semibold text-muted">{t('kpi_active_orders')}</span>
                        <div className="w-10 h-10 bg-[rgba(126,58,242,0.1)] rounded-xl flex items-center justify-center text-pu"><i className="fa-solid fa-cart-shopping"></i></div>
                      </div>
                      <span className="text-[32px] font-extrabold text-g3 leading-none">
                        {dashboardSummary?.active_orders ?? 0}
                      </span>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[14px] font-semibold text-muted">{t('kpi_revenue_month')}</span>
                        <div className="w-10 h-10 bg-[rgba(39,174,96,0.1)] rounded-xl flex items-center justify-center text-g1"><i className="fa-solid fa-money-bill-wave"></i></div>
                      </div>
                      <span className="text-[32px] font-extrabold text-g3 leading-none">
                        RM {dashboardSummary?.monthly_revenue?.toLocaleString() ?? 0}
                      </span>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[14px] font-semibold text-muted">{t('kpi_wholesale_buyers')}</span>
                        <div className="w-10 h-10 bg-[rgba(139,105,20,0.1)] rounded-xl flex items-center justify-center text-[#8B6914]"><i className="fa-solid fa-briefcase"></i></div>
                      </div>
                      <span className="text-[32px] font-extrabold text-g3 leading-none">
                        {dashboardSummary?.wholesale_buyers || usersList.filter(u => u.role === 'wholesale').length || '0'}
                      </span>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[14px] font-semibold text-muted">{t('kpi_registered_customers')}</span>
                        <div className="w-10 h-10 bg-[rgba(39,174,96,0.1)] rounded-xl flex items-center justify-center text-g1"><i className="fa-solid fa-users"></i></div>
                      </div>
                      <span className="text-[32px] font-extrabold text-g3 leading-none">
                        {dashboardSummary?.registered_customers ?? usersList.filter(u => u.role === 'customer').length ?? 0}
                      </span>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[14px] font-semibold text-muted">{t('kpi_low_stock')}</span>
                        <div className="w-10 h-10 bg-[rgba(231,76,60,0.1)] rounded-xl flex items-center justify-center text-[#e74c3c]"><i className="fa-solid fa-triangle-exclamation"></i></div>
                      </div>
                      <span className="text-[32px] font-extrabold text-[#e74c3c] leading-none">
                        {dashboardSummary?.low_stock_products ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <h3 className="text-[18px] font-extrabold text-g3">{t('title_quick_actions')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
                    <button
                      onClick={() => setAdminTab('products')}
                      className="p-4 bg-white border border-border-design rounded-xl font-bold text-txt hover:bg-off hover:text-g1 cursor-pointer flex flex-col items-center gap-2 transition shadow-sm"
                    >
                      <i className="fa-solid fa-plus text-[20px]"></i> {t('btn_add_product')}
                    </button>
                    <button
                      onClick={() => setAdminTab('orders')}
                      className="p-4 bg-white border border-border-design rounded-xl font-bold text-txt hover:bg-off hover:text-g1 cursor-pointer flex flex-col items-center gap-2 transition shadow-sm"
                    >
                      <i className="fa-solid fa-clipboard-list text-[20px]"></i> {t('btn_manage_orders')}
                    </button>
                    <button
                      onClick={() => setAdminTab('inventory')}
                      className="p-4 bg-white border border-border-design rounded-xl font-bold text-txt hover:bg-off hover:text-g1 cursor-pointer flex flex-col items-center gap-2 transition shadow-sm"
                    >
                      <i className="fa-solid fa-chart-bar text-[20px]"></i> {t('btn_inventory')}
                    </button>
                    <button
                      onClick={() => navigate('/admin-distributors')}
                      className="p-4 bg-white border border-border-design rounded-xl font-bold text-txt hover:bg-off hover:text-g1 cursor-pointer flex flex-col items-center gap-2 transition shadow-sm"
                    >
                      <i className="fa-solid fa-truck text-[20px]"></i> {t('btn_distributors')}
                    </button>
                    <button
                      onClick={() => navigate('/admin-reports')}
                      className="p-4 bg-white border border-border-design rounded-xl font-bold text-txt hover:bg-off hover:text-g1 cursor-pointer flex flex-col items-center gap-2 transition shadow-sm"
                    >
                      <i className="fa-solid fa-chart-line text-[20px]"></i> {t('btn_reports')}
                    </button>
                    <button
                      onClick={() => navigate('/admin-reviews')}
                      className="p-4 bg-white border border-border-design rounded-xl font-bold text-txt hover:bg-off hover:text-g1 cursor-pointer flex flex-col items-center gap-2 transition shadow-sm"
                    >
                      <i className="fa-solid fa-star text-[20px]"></i> {t('btn_reviews')}
                    </button>
                  </div>
                  {/* RECENT ORDERS & LOW STOCK */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <div className="bg-white border border-border-design rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[16px] font-extrabold text-g3">{t('title_recent_orders')}</h3>
                        <button onClick={() => setAdminTab('orders')} className="text-g1 font-semibold text-[13px] bg-transparent border-none cursor-pointer">{t('btn_view_all')}</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[13px] text-left">
                          <thead>
                            <tr className="border-b border-border-design text-muted">
                              <th className="py-2 px-2 font-semibold whitespace-nowrap">Order ID</th>
                              <th className="py-2 px-2 font-semibold whitespace-nowrap">Customer</th>
                              <th className="py-2 px-2 font-semibold whitespace-nowrap">Category</th>
                              <th className="py-2 px-2 font-semibold whitespace-nowrap">Amount</th>
                              <th className="py-2 px-2 font-semibold whitespace-nowrap">Status</th>
                              <th className="py-2 px-2 font-semibold whitespace-nowrap">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardOrders.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-3 px-2 text-center text-muted whitespace-nowrap">No recent orders found.</td>
                              </tr>
                            ) : (
                              dashboardOrders.slice(0, 5).map((ord) => (
                                <tr key={ord.id} className="border-b border-border-design">
                                  <td className="py-2 px-2 font-bold text-g3 whitespace-nowrap">#{ord.order_number}</td>
                                  <td className="py-2 px-2 text-txt whitespace-nowrap">{ord.user?.first_name} {ord.user?.last_name}</td>
                                  <td className="py-2 px-2 text-muted whitespace-nowrap">{ord.user?.role === 'wholesale' ? 'Wholesale' : 'Retail'}</td>
                                  <td className="py-2 px-2 font-bold whitespace-nowrap">RM {Number(ord.total_amount).toFixed(2)}</td>
                                  <td className="py-2 px-2 whitespace-nowrap">
                                    <span className={`py-0.5 px-1.5 rounded font-bold text-[11px] ${
                                      ord.order_status === 'DELIVERED' ? 'bg-[rgba(39,174,96,0.15)] text-g1' :
                                      ord.order_status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                                      'bg-[rgba(241,196,15,0.15)] text-[#d35400]'
                                    }`}>
                                      {ord.order_status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-muted whitespace-nowrap">{formatDate(ord.created_at)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
 
                    {/* LOW STOCK */}
                    <div className="bg-white border border-[rgba(231,76,60,0.3)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-1">
                        <h3 className="text-[16px] font-extrabold text-g3">{t('title_low_stock')}</h3>
                        <span className="bg-[#e74c3c] text-white text-[11px] font-bold py-0.5 px-1.5 rounded-full">
                          {dashboardLowStock.length} Items
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {dashboardLowStock.length === 0 ? (
                          <div className="p-4 text-center text-muted text-[13px]">No low stock products.</div>
                        ) : (
                          dashboardLowStock.slice(0, 4).map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-[rgba(231,76,60,0.05)] border-l-4 border-[#e74c3c] rounded gap-1.5">
                              <div className="flex-1">
                                <div className="font-bold text-g3 text-[12.5px] mb-0.5">
                                  {item.variant?.product?.name || 'Unnamed Variant'}
                                </div>
                                <div className="text-[11px] text-muted">
                                  {item.variant?.product?.category?.name || 'Category'} | SKU: {item.variant?.sku}
                                </div>
                              </div>
                              <div className="font-extrabold text-[#e74c3c] text-[13px]">
                                Stock: {item.quantity_available}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button onClick={() => setAdminTab('inventory')} className="w-full mt-3 bg-white border border-[#e74c3c] text-[#e74c3c] font-bold py-2 rounded-lg cursor-pointer hover:bg-red-50 transition text-[12.5px]">{t('btn_restock')}</button>
                    </div>
                  </div>
 
                  {/* SALES OVERVIEW */}
                  <h3 className="text-[18px] font-extrabold text-g3 mb-2">{t('title_sales_overview')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div className="p-4 sm:p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl text-center">
                      <div className="text-[11px] sm:text-[12px] text-muted font-semibold mb-2">Today's Sales</div>
                      <div className="text-[18px] sm:text-[20px] font-extrabold text-g1">RM {dashboardSales?.today_sales?.toFixed(2) ?? '0.00'}</div>
                      {dashboardSales?.today_change !== null && dashboardSales?.today_change !== undefined ? (
                        <div className={`text-[11px] font-bold mt-1 ${dashboardSales.today_change >= 0 ? 'text-[#27ae60]' : 'text-[#e74c3c]'}`}>
                          {dashboardSales.today_change >= 0 ? '+' : ''}{dashboardSales.today_change}% vs yesterday
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted font-semibold mt-1">No previous data</div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl text-center">
                      <div className="text-[11px] sm:text-[12px] text-muted font-semibold mb-2">Weekly Sales</div>
                      <div className="text-[18px] sm:text-[20px] font-extrabold text-g1">RM {dashboardSales?.weekly_sales?.toFixed(2) ?? '0.00'}</div>
                      {dashboardSales?.weekly_change !== null && dashboardSales?.weekly_change !== undefined ? (
                        <div className={`text-[11px] font-bold mt-1 ${dashboardSales.weekly_change >= 0 ? 'text-[#27ae60]' : 'text-[#e74c3c]'}`}>
                          {dashboardSales.weekly_change >= 0 ? '+' : ''}{dashboardSales.weekly_change}% vs last week
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted font-semibold mt-1">No previous data</div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl text-center">
                      <div className="text-[11px] sm:text-[12px] text-muted font-semibold mb-2">Monthly Sales</div>
                      <div className="text-[18px] sm:text-[20px] font-extrabold text-g1">RM {dashboardSales?.monthly_sales?.toFixed(2) ?? '0.00'}</div>
                      {dashboardSales?.monthly_change !== null && dashboardSales?.monthly_change !== undefined ? (
                        <div className={`text-[11px] font-bold mt-1 ${dashboardSales.monthly_change >= 0 ? 'text-[#27ae60]' : 'text-[#e74c3c]'}`}>
                          {dashboardSales.monthly_change >= 0 ? '+' : ''}{dashboardSales.monthly_change}% vs last month
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted font-semibold mt-1">No previous data</div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl text-center">
                      <div className="text-[11px] sm:text-[12px] text-muted font-semibold mb-2">Wholesale Revenue</div>
                      <div className="text-[18px] sm:text-[20px] font-extrabold text-pu font-bold">RM {dashboardSales?.wholesale_revenue?.toFixed(2) ?? '0.00'}</div>
                      <div className="text-[11px] text-muted font-semibold mt-1">
                        {dashboardSales?.monthly_sales ? ((dashboardSales.wholesale_revenue / dashboardSales.monthly_sales) * 100).toFixed(0) : '0'}% of total
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl text-center">
                      <div className="text-[11px] sm:text-[12px] text-muted font-semibold mb-2">Retail Revenue</div>
                      <div className="text-[18px] sm:text-[20px] font-extrabold text-[#e67e22] font-bold">RM {dashboardSales?.retail_revenue?.toFixed(2) ?? '0.00'}</div>
                      <div className="text-[11px] text-muted font-semibold mt-1">
                        {dashboardSales?.monthly_sales ? ((dashboardSales.retail_revenue / dashboardSales.monthly_sales) * 100).toFixed(0) : '100'}% of total
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {adminTab === 'products' && (
              <div className="flex flex-col gap-6 w-full animate-fade-in">
                {/* Catalog Sub-tabs */}
                <div className="flex border border-border-design bg-white p-1 rounded-xl shadow-sm gap-2 select-none self-start">
                  {[
                    { id: 'products_list', label: 'Products' },
                    { id: 'categories_list', label: 'Categories' },
                    { id: 'brands_list', label: 'Brands' },
                  ].map((subtab) => (
                    <button
                      key={subtab.id}
                      onClick={() => setCatalogSubTab(subtab.id)}
                      className={`py-2 px-5 rounded-lg text-[13px] font-bold cursor-pointer border-none transition-all ${
                        catalogSubTab === subtab.id
                          ? 'bg-g1 text-white shadow-sm'
                          : 'bg-transparent text-muted hover:text-txt hover:bg-gray-50'
                      }`}
                    >
                      {subtab.label}
                    </button>
                  ))}
                </div>

                {catalogSubTab === 'products_list' && <AdminProductManager />}
                {catalogSubTab === 'categories_list' && <AdminCategoryManager />}
                {catalogSubTab === 'brands_list' && <AdminBrandManager />}
              </div>
            )}
            {adminTab === 'inventory' && <AdminInventoryManager />}
            {adminTab === 'distributors' && <AdminDistributorManager />}
            {adminTab === 'customers' && <AdminCustomerManager />}
            {adminTab === 'wholesale' && <AdminWholesaleManager />}
            {adminTab === 'reviews' && <AdminReviewManager />}
            {adminTab === 'reports' && <AdminReportManager />}
            {adminTab === 'campaigns' && <AdminBannerManager />}
            {adminTab === 'notifications' && <AdminNotificationManager />}
            {adminTab === 'settings' && <AdminSettings />}

            {adminTab === 'orders' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                  <h2 className="text-[28px] font-black text-g3 leading-none">Order Management</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportOrders}
                      className="px-4 py-2.5 bg-white border border-border-design rounded-lg font-semibold cursor-pointer transition hover:bg-gray-50 active:scale-95 text-[13px] flex items-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-file-export"></i> Export Orders
                    </button>
                  </div>
                </div>

                {/* TOP 6 METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
                  <div className="p-4 bg-white border border-border-design rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                    <div className="text-[12px] text-muted font-semibold mb-2">Total Orders</div>
                    <div className="text-[24px] font-extrabold text-g3">
                      {adminOrdersLoading && !adminOrdersStats ? '...' : adminOrdersStats?.total_orders || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-[rgba(243,156,18,0.4)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-4 border-b-[#f39c12]">
                    <div className="text-[12px] text-muted font-semibold mb-2">Pending</div>
                    <div className="text-[24px] font-extrabold text-[#f39c12]">
                      {adminOrdersLoading && !adminOrdersStats ? '...' : adminOrdersStats?.pending || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-[rgba(52,152,219,0.4)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-4 border-b-[#3498db]">
                    <div className="text-[12px] text-muted font-semibold mb-2">Packed (Processing)</div>
                    <div className="text-[24px] font-extrabold text-[#3498db]">
                      {adminOrdersLoading && !adminOrdersStats ? '...' : adminOrdersStats?.packed || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-[rgba(155,89,182,0.4)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-4 border-b-[#9b59b6]">
                    <div className="text-[12px] text-muted font-semibold mb-2">Shipped</div>
                    <div className="text-[24px] font-extrabold text-[#9b59b6]">
                      {adminOrdersLoading && !adminOrdersStats ? '...' : adminOrdersStats?.shipped || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-[rgba(39,174,96,0.4)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-4 border-b-g1">
                    <div className="text-[12px] text-muted font-semibold mb-2">Delivered</div>
                    <div className="text-[24px] font-extrabold text-g1">
                      {adminOrdersLoading && !adminOrdersStats ? '...' : adminOrdersStats?.delivered || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-border-design rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-4 border-b-g3">
                    <div className="text-[12px] text-muted font-semibold mb-2">Wholesale Orders</div>
                    <div className="text-[24px] font-extrabold text-g3">
                      {adminOrdersLoading && !adminOrdersStats ? '...' : adminOrdersStats?.wholesale_orders || 0}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-6 items-start">
                  {/* LEFT: ORDERS LIST & TABLE */}
                  <div className="bg-white border border-border-design rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-4 sm:p-6">
                    {/* Filters Bar */}
                    <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center gap-3 mb-5 pb-5 border-b border-border-design">
                      <div className="flex-1 flex gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Search Order ID, Customer..."
                          value={adminOrdersSearch}
                          onChange={(e) => setAdminOrdersSearch(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-border-design rounded-lg outline-none text-[13px] focus:border-g1 focus:ring-1 focus:ring-g1 bg-white"
                        />
                        <button type="submit" className="px-4 py-2.5 bg-g1 text-white border-none rounded-lg font-semibold cursor-pointer hover:bg-g3 transition text-[13px] shrink-0">
                          Search
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
                        <select
                          value={adminOrdersStatus}
                          onChange={(e) => {
                            setAdminOrdersStatus(e.target.value);
                            setAdminOrdersPage(1);
                          }}
                          className="px-3 py-2.5 border border-border-design rounded-lg outline-none font-semibold text-g3 cursor-pointer text-[13px] bg-white w-full"
                        >
                          <option>All Statuses</option>
                          <option value="PENDING">Pending</option>
                          <option value="PACKED">Packed (Processing)</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <select
                          value={adminOrdersType}
                          onChange={(e) => {
                            setAdminOrdersType(e.target.value);
                            setAdminOrdersPage(1);
                          }}
                          className="px-3 py-2.5 border border-border-design rounded-lg outline-none font-semibold text-g3 cursor-pointer text-[13px] bg-white w-full"
                        >
                          <option>All Types</option>
                          <option>Retail</option>
                          <option>Wholesale</option>
                        </select>
                        <select
                          value={adminOrdersDateRange}
                          onChange={(e) => {
                            setAdminOrdersDateRange(e.target.value);
                            setAdminOrdersPage(1);
                          }}
                          className="px-3 py-2.5 border border-border-design rounded-lg outline-none font-semibold text-g3 cursor-pointer text-[13px] bg-white w-full col-span-2 sm:col-span-1"
                        >
                          <option>All Dates</option>
                          <option>Today</option>
                          <option>Last 7 Days</option>
                        </select>
                      </div>
                    </form>

                    {/* Mobile/Tablet Card List (visible below md) */}
                    <div className="block md:hidden space-y-4">
                      {adminOrdersLoading && adminOrders.length === 0 ? (
                        <div className="p-12 text-center text-muted font-semibold flex flex-col gap-2 items-center">
                          <div className="w-8 h-8 border-4 border-g1 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[14px]">Loading orders list...</span>
                        </div>
                      ) : adminOrders.length === 0 ? (
                        <div className="p-12 text-center text-muted font-semibold text-[14px]">
                          No orders found matching the filters.
                        </div>
                      ) : (
                        adminOrders.map((ord, idx) => {
                          const isSelected = adminSelectedOrder?.id === ord.id;
                          
                          let delBadge = "bg-[rgba(243,156,18,0.15)] text-[#d35400]";
                          if (ord.order_status === 'PROCESSING') delBadge = "bg-[rgba(52,152,219,0.15)] text-[#2980b9]";
                          else if (ord.order_status === 'SHIPPED') delBadge = "bg-[rgba(155,89,182,0.15)] text-[#8e44ad]";
                          else if (ord.order_status === 'DELIVERED') delBadge = "bg-[rgba(39,174,96,0.15)] text-g1";
                          else if (ord.order_status === 'CANCELLED') delBadge = "bg-red-50 text-red-600 border border-red-100";

                          let payBadge = "bg-[rgba(39,174,96,0.15)] text-g1";
                          if (ord.payment_status === 'PENDING') payBadge = "bg-[rgba(243,156,18,0.15)] text-[#d35400]";
                          else if (ord.payment_status === 'FAILED') payBadge = "bg-red-50 text-[#c0392b]";

                          return (
                            <div
                              key={`${ord.id}-${idx}`}
                              onClick={() => setAdminSelectedOrder(ord)}
                              className={`p-4 border rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                                isSelected ? 'border-g1 bg-[rgba(39,174,96,0.02)]' : 'border-border-design bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-[14px] text-g3">#{ord.order_number.substring(0, 12)}</span>
                                <span className="text-[12px] text-muted">{formatDate(ord.created_at)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-[13px] font-semibold text-txt">
                                  {ord.user.first_name} {ord.user.last_name}
                                </div>
                                <span className="font-bold text-g3 text-[14px]">
                                  RM {parseFloat(ord.total_amount).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 items-center justify-between pt-2.5 border-t border-dashed border-border-design">
                                <div className="flex gap-1.5">
                                  <span className={`py-0.5 px-2 rounded font-bold text-[10px] ${
                                    ord.type === 'Wholesale'
                                      ? 'bg-[rgba(142,68,173,0.15)] text-pu'
                                      : 'bg-[rgba(52,152,219,0.15)] text-[#2980b9]'
                                  }`}>
                                    {ord.type}
                                  </span>
                                  <span className="text-[11px] text-muted">{ord.total_items} items</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <span className={`py-0.5 px-2 rounded font-bold text-[10px] ${payBadge}`}>
                                    {ord.payment_status}
                                  </span>
                                  <span className={`py-0.5 px-2 rounded font-bold text-[10px] ${delBadge}`}>
                                    {ord.order_status === 'PROCESSING' ? 'Packed' : ord.order_status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Desktop Table View (visible on md and above) */}
                    <div className="hidden md:block overflow-x-auto">
                      {adminOrdersLoading && adminOrders.length === 0 ? (
                        <div className="p-12 text-center text-muted font-semibold flex flex-col gap-2 items-center">
                          <div className="w-8 h-8 border-4 border-g1 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[14px]">Loading orders list...</span>
                        </div>
                      ) : adminOrders.length === 0 ? (
                        <div className="p-12 text-center text-muted font-semibold text-[14px]">
                          No orders found matching the filters.
                        </div>
                      ) : (
                        <table className="w-full border-collapse text-[13px] text-left">
                          <thead>
                            <tr className="border-b-2 border-border-design text-muted">
                              <th className="py-3 px-2 font-semibold">Order ID</th>
                              <th className="py-3 px-2 font-semibold">Customer</th>
                              <th className="py-3 px-2 font-semibold">Type</th>
                              <th className="py-3 px-2 font-semibold">Category</th>
                              <th className="py-3 px-2 font-semibold">Items</th>
                              <th className="py-3 px-2 font-semibold">Amount</th>
                              <th className="py-3 px-2 font-semibold">Payment</th>
                              <th className="py-3 px-2 font-semibold">Delivery</th>
                              <th className="py-3 px-2 font-semibold">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminOrders.map((ord, idx) => {
                              const isSelected = adminSelectedOrder?.id === ord.id;
                              
                              let delBadge = "bg-[rgba(243,156,18,0.15)] text-[#d35400]";
                              if (ord.order_status === 'PROCESSING') delBadge = "bg-[rgba(52,152,219,0.15)] text-[#2980b9]";
                              else if (ord.order_status === 'SHIPPED') delBadge = "bg-[rgba(155,89,182,0.15)] text-[#8e44ad]";
                              else if (ord.order_status === 'DELIVERED') delBadge = "bg-[rgba(39,174,96,0.15)] text-g1";
                              else if (ord.order_status === 'CANCELLED') delBadge = "bg-red-50 text-red-600 border border-red-100";

                              let payBadge = "bg-[rgba(39,174,96,0.15)] text-g1";
                              if (ord.payment_status === 'PENDING') payBadge = "bg-[rgba(243,156,18,0.15)] text-[#d35400]";
                              else if (ord.payment_status === 'FAILED') payBadge = "bg-red-50 text-[#c0392b]";

                              return (
                                <tr
                                  key={`${ord.id}-${idx}`}
                                  onClick={() => setAdminSelectedOrder(ord)}
                                  className={`border-b border-border-design cursor-pointer hover:bg-off transition-colors ${
                                    isSelected ? 'bg-[rgba(39,174,96,0.05)]' : ''
                                  }`}
                                >
                                  <td className={`py-4 px-2 font-bold ${isSelected ? 'text-g1' : 'text-g3'}`}>
                                    #{ord.order_number.substring(0, 12)}
                                  </td>
                                  <td className="py-4 px-2 text-txt font-semibold">
                                    {ord.user.first_name} {ord.user.last_name}
                                  </td>
                                  <td className="py-4 px-2">
                                    <span className={`py-1 px-2 rounded font-bold text-[11px] ${
                                      ord.type === 'Wholesale'
                                        ? 'bg-[rgba(142,68,173,0.15)] text-pu'
                                        : 'bg-[rgba(52,152,219,0.15)] text-[#2980b9]'
                                    }`}>
                                      {ord.type}
                                    </span>
                                  </td>
                                  <td className="py-4 px-2 text-muted">{ord.category}</td>
                                  <td className="py-4 px-2 font-semibold">{ord.total_items}</td>
                                  <td className="py-4 px-2 font-bold text-g3">
                                    RM {parseFloat(ord.total_amount).toFixed(2)}
                                  </td>
                                  <td className="py-4 px-2">
                                    <span className={`py-1 px-2 rounded font-bold text-[11px] ${payBadge}`}>
                                      {ord.payment_status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-2">
                                    <span className={`py-1 px-2 rounded font-bold text-[11px] ${delBadge}`}>
                                      {ord.order_status === 'PROCESSING' ? 'Packed' : ord.order_status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-2 text-muted">{formatDate(ord.created_at)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Pagination Footer */}
                    {adminOrdersTotalPages > 1 && (
                      <div className="flex justify-between items-center mt-6 pt-6 border-t border-border-design text-muted text-[14px]">
                        <div>
                          Showing {(adminOrdersPage - 1) * 10 + 1} - {Math.min(adminOrdersPage * 10, adminOrdersTotalCount)} of {adminOrdersTotalCount} orders
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={adminOrdersPage === 1}
                            onClick={() => setAdminOrdersPage(adminOrdersPage - 1)}
                            className="px-3 py-1.5 bg-white border border-border-design rounded font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Prev
                          </button>
                          {Array.from({ length: adminOrdersTotalPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setAdminOrdersPage(i + 1)}
                              className={`px-3 py-1.5 border rounded font-semibold cursor-pointer transition ${
                                adminOrdersPage === i + 1
                                  ? 'bg-g1 border-g1 text-white'
                                  : 'bg-white border-border-design text-gray-700 hover:bg-off'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            disabled={adminOrdersPage === adminOrdersTotalPages}
                            onClick={() => setAdminOrdersPage(adminOrdersPage + 1)}
                            className="px-3 py-1.5 bg-white border border-border-design rounded font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: ORDER DETAILS DRAWER */}
                  {/* On Mobile: slide-over overlay. On Desktop: side-by-side card. */}
                  <div className={`
                    ${adminSelectedOrder ? 'flex' : 'hidden lg:flex'}
                    fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0 lg:block
                    justify-end bg-black/40 lg:bg-transparent backdrop-blur-[2px] lg:backdrop-blur-none
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setAdminSelectedOrder(null);
                    }
                  }}
                  >
                    <div
                      className="
                        w-full max-w-[480px] lg:w-full lg:max-w-none h-full lg:h-auto bg-white 
                        lg:border border-border-design lg:rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] 
                        flex flex-col animate-slide-in-right lg:animate-none
                      "
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!adminSelectedOrder ? (
                        <div className="p-12 text-center text-muted font-semibold text-[14px]">
                          Select an order to view details.
                        </div>
                      ) : (
                        <>
                          {/* Header */}
                          <div className="p-6 border-b border-border-design flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-[18px] font-extrabold text-g3 shrink truncate max-w-[180px] sm:max-w-[200px]">
                                  #{adminSelectedOrder.order_number.substring(0, 12)}
                                </h3>
                                <span className={`py-1 px-2 rounded font-extrabold text-[10px] ${
                                  adminSelectedOrder.type === 'Wholesale'
                                    ? 'bg-[rgba(142,68,173,0.15)] text-pu'
                                    : 'bg-[rgba(52,152,219,0.15)] text-[#2980b9]'
                                }`}>
                                  {adminSelectedOrder.type.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[12px] text-muted">
                                {formatDate(adminSelectedOrder.created_at)}
                              </div>
                            </div>
                            <button
                              onClick={() => setAdminSelectedOrder(null)}
                              className="lg:hidden p-2 text-muted hover:text-g3 bg-off rounded-full border-none cursor-pointer transition active:scale-95"
                            >
                              <i className="fa-solid fa-xmark text-[16px]"></i>
                            </button>
                          </div>

                          <div className="p-6 overflow-y-auto flex-1 text-left">
                            {/* Quick Actions */}
                            {adminSelectedOrder.order_status !== 'CANCELLED' && adminSelectedOrder.order_status !== 'DELIVERED' && (
                              <div className="grid grid-cols-2 gap-2 mb-6">
                                {getNextStatus(adminSelectedOrder.order_status) && (
                                  <button
                                    onClick={() => handleUpdateStatus(adminSelectedOrder.id, adminSelectedOrder.order_status)}
                                    className="py-2.5 bg-g1 text-white border-none rounded-lg font-bold cursor-pointer text-[12px] transition hover:bg-g3 active:scale-95"
                                  >
                                    {getStatusButtonText(adminSelectedOrder.order_status)}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCancelOrder(adminSelectedOrder.id)}
                                  className="py-2.5 bg-white text-[#e74c3c] border border-[#e74c3c] rounded-lg font-bold cursor-pointer text-[12px] transition hover:bg-red-50 active:scale-95"
                                >
                                  Cancel Order
                                </button>
                              </div>
                            )}

                            {/* Invoice Action */}
                            <div className="mb-6">
                              <button
                                onClick={() => setSelectedInvoiceOrder(adminSelectedOrder)}
                                className="w-full py-2.5 bg-[#0B8F3A]/10 hover:bg-[#0B8F3A]/20 text-[#0B8F3A] border border-[#0B8F3A]/30 rounded-lg font-bold cursor-pointer text-[13px] transition flex items-center justify-center gap-2 active:scale-95"
                              >
                                <i className="fa-solid fa-file-invoice"></i>
                                View & Print Invoice
                              </button>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-6">
                              <h4 className="text-[14px] font-bold text-g3 mb-3 uppercase tracking-wide">Customer & Shipping</h4>
                              <div className="bg-off p-4 rounded-lg border border-border-design">
                                <div className="font-bold text-txt mb-1">
                                  {adminSelectedOrder.shippingAddress?.full_name || `${adminSelectedOrder.user.first_name} ${adminSelectedOrder.user.last_name}`}
                                </div>
                                <div className="text-[13px] text-muted mb-3">
                                  Contact: {adminSelectedOrder.shippingAddress?.phone || 'N/A'} | {adminSelectedOrder.user.email}
                                </div>
                                <div className="text-[13px] text-txt leading-relaxed">
                                  {adminSelectedOrder.shippingAddress?.address_line1}
                                  {adminSelectedOrder.shippingAddress?.address_line2 && (
                                    <><br />{adminSelectedOrder.shippingAddress.address_line2}</>
                                  )}
                                  <br />
                                  {adminSelectedOrder.shippingAddress?.postal_code} {adminSelectedOrder.shippingAddress?.city}
                                  <br />
                                  {adminSelectedOrder.shippingAddress?.state}, {adminSelectedOrder.shippingAddress?.country}
                                </div>
                              </div>
                            </div>

                            {/* Bulk Order Section */}
                            {adminSelectedOrder.type === 'Wholesale' && (
                              <div className="mb-6">
                                <h4 className="text-[14px] font-bold text-pu mb-3 uppercase tracking-wide">Bulk Order Info</h4>
                                <div className="bg-[rgba(142,68,173,0.05)] p-4 rounded-lg border border-[rgba(142,68,173,0.2)]">
                                  <div className="flex justify-between mb-2 text-[13px]">
                                    <span className="text-muted">Total Quantity:</span>
                                    <span className="font-bold text-g3">{adminSelectedOrder.total_items} Units</span>
                                  </div>
                                  <div className="flex justify-between mb-2 text-[13px]">
                                    <span className="text-muted">Classification:</span>
                                    <span className="font-bold text-pu">Wholesale pricing threshold met</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Items & Pricing */}
                            <div className="mb-6">
                              <h4 className="text-[14px] font-bold text-g3 mb-3 uppercase tracking-wide">Order Details</h4>
                              <table className="w-full border-collapse text-[13px]">
                                <tbody>
                                  {adminSelectedOrder.items.map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="border-b border-border-design">
                                      <td className="py-3">
                                        <div className="font-bold text-g3">{item.product_name}</div>
                                        {item.variant_name && (
                                          <div className="text-muted text-[11px]">{item.variant_name}</div>
                                        )}
                                      </td>
                                      <td className="py-3 text-right">
                                        {item.quantity} x RM {parseFloat(item.unit_price).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="flex justify-between mt-4 text-[13px]">
                                <span className="text-muted">Subtotal</span>
                                <span className="font-semibold">RM {parseFloat(adminSelectedOrder.subtotal).toFixed(2)}</span>
                              </div>
                              {parseFloat(adminSelectedOrder.discount_amount) > 0 && (
                                <div className="flex justify-between mt-2 text-[13px]">
                                  <span className="text-muted">Discount</span>
                                  <span className="font-semibold text-[#e74c3c]">- RM {parseFloat(adminSelectedOrder.discount_amount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between mt-2 text-[13px]">
                                <span className="text-muted">Shipping</span>
                                <span className="font-semibold">RM {parseFloat(adminSelectedOrder.shipping_charge).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between mt-4 pt-4 border-t-2 border-border-design text-[16px]">
                                <span className="font-extrabold text-g3">Order Total</span>
                                <span className="font-extrabold text-g1">RM {parseFloat(adminSelectedOrder.total_amount).toFixed(2)}</span>
                              </div>
                              {adminSelectedOrder.payment && (
                                <div className="mt-3 text-[12px] text-muted flex items-center gap-1.5">
                                  <span className="inline-block w-2 h-2 bg-g1 rounded-full"></span>
                                  Paid via {adminSelectedOrder.payment.payment_method}
                                </div>
                              )}
                            </div>

                            {/* Shipping & Timeline */}
                            <div>
                              <h4 className="text-[14px] font-bold text-g3 mb-3 uppercase tracking-wide">Timeline & Status</h4>
                              <div className="relative pl-4 border-l-2 border-border-design">
                                <div className="relative mb-4">
                                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-g1 rounded-full"></div>
                                  <div className="font-bold text-[13px] text-g3">Order Placed</div>
                                  <div className="text-[11px] text-muted">{formatDate(adminSelectedOrder.created_at)}</div>
                                </div>

                                <div className="relative mb-4">
                                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                    ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(adminSelectedOrder.order_status)
                                      ? 'bg-g1' : 'bg-border-design'
                                  }`}></div>
                                  <div className={`font-bold text-[13px] ${
                                    ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(adminSelectedOrder.order_status)
                                      ? 'text-g3' : 'text-muted'
                                  }`}>Confirmed</div>
                                </div>

                                <div className="relative mb-4">
                                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                    ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(adminSelectedOrder.order_status)
                                      ? 'bg-[#3498db] shadow-[0_0_0_3px_rgba(52,152,219,0.2)]'
                                      : 'bg-border-design'
                                  }`}></div>
                                  <div className={`font-bold text-[13px] ${
                                    ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(adminSelectedOrder.order_status)
                                      ? 'text-[#3498db]' : 'text-muted'
                                  }`}>Packed (Processing)</div>
                                </div>

                                <div className="relative mb-4">
                                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                    ['SHIPPED', 'DELIVERED'].includes(adminSelectedOrder.order_status)
                                      ? 'bg-[#9b59b6]' : 'bg-border-design'
                                  }`}></div>
                                  <div className={`font-bold text-[13px] ${
                                    ['SHIPPED', 'DELIVERED'].includes(adminSelectedOrder.order_status)
                                      ? 'text-[#9b59b6]' : 'text-muted'
                                  }`}>Shipped</div>
                                </div>

                                <div className="relative mb-4">
                                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                    adminSelectedOrder.order_status === 'DELIVERED'
                                      ? 'bg-g1' : 'bg-border-design'
                                  }`}></div>
                                  <div className={`font-bold text-[13px] ${
                                    adminSelectedOrder.order_status === 'DELIVERED'
                                      ? 'text-g1' : 'text-muted'
                                  }`}>Delivered</div>
                                </div>

                                {adminSelectedOrder.order_status === 'CANCELLED' && (
                                  <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-[#e74c3c] rounded-full"></div>
                                    <div className="font-bold text-[13px] text-[#e74c3c]">Cancelled</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </div>
      )}
      {/* 4. INVOICE VIEW MODAL */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[2000] p-4 invoice-modal-container">
          <div className="bg-white rounded-2xl border border-border-design max-w-[800px] w-full p-8 shadow-2xl relative animate-fade-in text-left max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            
            {/* Header Controls (Hidden during print) */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-design print:hidden">
              <h3 className="font-extrabold text-[16px] text-g3 uppercase tracking-wide flex items-center gap-2">
                <i className="fa-solid fa-file-invoice-dollar text-[18px]"></i>
                Chennis Order Invoice
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-4 py-2 bg-g1 hover:bg-g3 text-white border-none rounded-xl text-[13px] font-bold cursor-pointer transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <i className="fa-solid fa-download"></i> {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0B8F3A] hover:bg-[#0B8F3A]/80 text-white border border-[#0B8F3A]/20 rounded-xl text-[13px] font-bold cursor-pointer transition flex items-center gap-2 active:scale-95"
                >
                  <i className="fa-solid fa-print"></i> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-txt border-none rounded-xl text-[13px] font-bold cursor-pointer transition active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="invoice-printable-area flex flex-col gap-6">
              
               {/* Logo and Company Details */}
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-border-design">
                <div>
                  <img src={logoBase64} alt="Chennis Logo" className="h-12 w-auto mb-2" />
                  <h4 className="font-black text-[18px] text-g3 mb-1">{storeSettings?.storeName || 'Chennis Building Materials'}</h4>
                  <p className="text-[12px] text-gray-500 leading-normal">
                    {storeSettings?.businessAddress || 'No 12, Jalan Meranti Jaya, Industrial Park, 47100 Puchong, Selangor, Malaysia'}
                    <br />
                    Email: {storeSettings?.contactEmail || 'accounts@chennis.com'} | Tel: {storeSettings?.contactPhone || '+603-8080 1234'}
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-[32px] font-black text-g1 uppercase tracking-wide leading-none mb-2">INVOICE</h2>
                  <div className="text-[13px] text-txt flex flex-col gap-1">
                    <div><strong>Invoice No:</strong> INV-{selectedInvoiceOrder.order_number || selectedInvoiceOrder.id.substring(0, 10).toUpperCase()}</div>
                    <div><strong>Date:</strong> {new Date(selectedInvoiceOrder.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><strong>Payment Status:</strong> <span className={`font-bold uppercase ${selectedInvoiceOrder.payment_status === 'PAID' ? 'text-g1' : 'text-orange-600'}`}>{selectedInvoiceOrder.payment_status}</span></div>
                    <div><strong>Terms:</strong> {selectedInvoiceOrder.type === 'Wholesale' ? 'Net 30 Days' : 'Due Upon Receipt'}</div>
                  </div>
                </div>
              </div>

              {/* Billing and Shipping info */}
              <div className="grid grid-cols-2 gap-8 pb-6 border-b border-border-design">
                <div>
                  <h5 className="font-bold text-[12px] text-gray-400 uppercase tracking-wide mb-2">Invoice To</h5>
                  <div className="text-[13.5px] text-txt leading-relaxed">
                    <strong className="text-[15px] text-g3 block mb-0.5">
                      {selectedInvoiceOrder.shippingAddress?.full_name || `${selectedInvoiceOrder.user?.first_name || ''} ${selectedInvoiceOrder.user?.last_name || 'Customer'}`}
                    </strong>
                    {selectedInvoiceOrder.user?.email && <div>Email: {selectedInvoiceOrder.user.email}</div>}
                    {selectedInvoiceOrder.shippingAddress?.phone && <div>Tel: {selectedInvoiceOrder.shippingAddress.phone}</div>}
                  </div>
                </div>
                <div>
                  <h5 className="font-bold text-[12px] text-gray-400 uppercase tracking-wide mb-2">Ship To</h5>
                  <div className="text-[13.5px] text-txt leading-relaxed">
                    {selectedInvoiceOrder.shippingAddress ? (
                      <>
                        <strong>{selectedInvoiceOrder.shippingAddress.full_name}</strong>
                        <br />
                        {selectedInvoiceOrder.shippingAddress.address_line1}
                        {selectedInvoiceOrder.shippingAddress.address_line2 && <><br />{selectedInvoiceOrder.shippingAddress.address_line2}</>}
                        <br />
                        {selectedInvoiceOrder.shippingAddress.postal_code} {selectedInvoiceOrder.shippingAddress.city}
                        <br />
                        {selectedInvoiceOrder.shippingAddress.state}, {selectedInvoiceOrder.shippingAddress.country}
                      </>
                    ) : (
                      <span className="text-gray-400">No delivery address provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Product list table */}
              <div>
                <table className="w-full border-collapse text-[13px] text-left">
                  <thead>
                    <tr className="border-b border-g3/20 bg-gray-50 text-g3 font-bold">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoiceOrder.items?.map((item: any, idx: number) => {
                      const itemTotal = parseFloat(item.unit_price) * item.quantity;
                      return (
                        <tr key={idx}>
                          <td className="py-3 px-3">
                            <div className="font-bold text-g3">{item.product?.name || item.product_name || 'Item'}</div>
                            {item.variant_name && item.variant_name !== 'Default Variant' && (
                              <div className="text-[11.5px] text-muted font-medium mt-0.5">Variant: {item.variant_name}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-gray-700">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-gray-700">RM {parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-bold text-g3">RM {itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary calculations */}
              <div className="flex justify-end pt-4 border-t border-border-design">
                <div className="w-[300px] flex flex-col gap-2.5 text-[13.5px]">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>RM {parseFloat(selectedInvoiceOrder.total_amount).toFixed(2)}</span>
                  </div>
                  {selectedInvoiceOrder.type === 'Wholesale' && (
                    <div className="flex justify-between text-orange-600 font-semibold">
                      <span>Wholesale Discount Applied:</span>
                      <span>Included</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>SST (6%):</span>
                    <span>RM {(parseFloat(selectedInvoiceOrder.total_amount) * 0.06).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-black text-g3 pt-2.5 border-t border-g3/20">
                    <span>Total Due:</span>
                    <span>RM {(parseFloat(selectedInvoiceOrder.total_amount) * 1.06).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="mt-12 text-center text-[12px] text-gray-400 border-t border-border-design pt-6 leading-relaxed">
                Thank you for doing business with {storeSettings?.storeName || 'Chennis'}. 
                <br />
                For any queries regarding this invoice, please email <strong>{storeSettings?.contactEmail || 'billing@chennis.com'}</strong> or call <strong>{storeSettings?.contactPhone || '+603-8080 1234'}</strong>.
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalViews;

