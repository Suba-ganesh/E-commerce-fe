import React, { useState, useEffect, useCallback } from 'react';
import { wholesaleService } from '../../services/wholesaleService';
import type { WholesaleApplication } from '../../services/wholesaleService';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';

export const AdminWholesaleManager: React.FC = () => {
  const toast = useToast();
  const modal = useModal();

  const [subTab, setSubTab] = useState<'applications' | 'catalog'>('applications');

  // Applications States
  const [applications, setApplications] = useState<WholesaleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Edit Partner details state
  const [editingApp, setEditingApp] = useState<WholesaleApplication | null>(null);
  const [editForm, setEditForm] = useState({
    company_name: '',
    company_registration: '',
    business_type: '',
    estimated_volume: '',
    notes: '',
    assigned_discount: 0,
    assigned_tier: 'Gold Distributor',
    status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Product Catalog States
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [importingCsv, setImportingCsv] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await wholesaleService.adminGetApplications({
        page,
        limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      if (res.success) {
        setApplications(res.applications);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load wholesale applications');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, toast]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await productService.getProducts({
        page: productPage,
        limit: 10,
        search: productSearch || undefined,
      });
      if (res.data) {
        setProducts(res.data.data || []);
        setProductTotalPages(res.data.meta?.totalPages || 1);
        setProductTotal(res.data.meta?.total || 0);
      }
    } catch (err: any) {
      toast.error('Failed to load catalog products');
    } finally {
      setLoadingProducts(false);
    }
  }, [productPage, productSearch, toast]);

  useEffect(() => {
    if (subTab === 'applications') {
      fetchApplications();
    } else {
      fetchProducts();
    }
  }, [subTab, fetchApplications, fetchProducts]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    try {
      setSubmittingEdit(true);
      const res = await wholesaleService.adminUpdateApplication(editingApp.id, {
        company_name: editForm.company_name,
        company_registration: editForm.company_registration,
        business_type: editForm.business_type,
        estimated_volume: editForm.estimated_volume || undefined,
        notes: editForm.notes || undefined,
        assigned_discount: Number(editForm.assigned_discount),
        assigned_tier: editForm.assigned_tier,
        status: editForm.status,
      });

      if (res.success) {
        toast.success(`Wholesale application settings updated successfully!`);
        setEditingApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update partner application.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteApplication = async (appId: string, company: string) => {
    if (await modal.confirm('Delete Application', `Are you sure you want to delete the wholesale application for "${company}"? If they are approved, their role will be reverted back to CUSTOMER.`)) {
      try {
        const res = await wholesaleService.adminDeleteApplication(appId);
        if (res.success || (res as any).data?.success) {
          toast.success(`Wholesale application for "${company}" has been successfully deleted.`);
          fetchApplications();
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete application.');
      }
    }
  };

  const handleQuickAdjustWholesalePrice = async (prodId: string, name: string, currentPrice: number, currentWholesale: any) => {
    const wholesaleStr = await modal.prompt(
      `Adjust Wholesale Price for ${name}`, 
      currentWholesale !== null && currentWholesale !== undefined ? String(currentWholesale) : String(currentPrice), 
      `Enter new wholesale price (RM). Retail Price: RM ${parseFloat(String(currentPrice)).toFixed(2)}`
    );
    if (wholesaleStr === null) return;
    
    try {
      await productService.updateProduct(prodId, {
        wholesale_price: parseFloat(wholesaleStr)
      });
      toast.success(`Wholesale price updated successfully for "${name}"!`);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update wholesale price');
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setImportingCsv(true);
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid.');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const skuIdx = headers.indexOf('sku');
      const priceIdx = headers.indexOf('wholesaleprice');
      
      if (skuIdx === -1 || priceIdx === -1) {
        toast.error('CSV must contain "SKU" and "WholesalePrice" columns.');
        return;
      }
      
      let successCount = 0;
      let failCount = 0;
      
      const allProdRes = await productService.getProducts({ limit: 500 });
      const allProducts = allProdRes.data?.data || [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',');
        const sku = columns[skuIdx]?.trim();
        const wholesalePriceStr = columns[priceIdx]?.trim();
        
        if (!sku || !wholesalePriceStr) continue;
        
        const matchingProduct = allProducts.find((p: any) => p.sku === sku);
        if (matchingProduct) {
          try {
            await productService.updateProduct(matchingProduct.id, {
              wholesale_price: parseFloat(wholesalePriceStr)
            });
            successCount++;
          } catch (err) {
            failCount++;
          }
        } else {
          failCount++;
        }
      }
      
      toast.success(`Import complete! Updated ${successCount} products. Failed/unmatched: ${failCount}`);
      fetchProducts();
    } catch (err: any) {
      toast.error('Failed to parse and import CSV file.');
    } finally {
      setImportingCsv(false);
      e.target.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: 'bg-[rgba(39,174,96,0.15)] text-[#27ae60] font-bold text-[12px] px-3 py-1 rounded-full border border-[rgba(39,174,96,0.1)]',
      PENDING: 'bg-[rgba(243,156,18,0.15)] text-[#f39c12] font-bold text-[12px] px-3 py-1 rounded-full border border-[rgba(243,156,18,0.1)]',
      REJECTED: 'bg-[rgba(231,76,60,0.15)] text-[#e74c3c] font-bold text-[12px] px-3 py-1 rounded-full border border-[rgba(231,76,60,0.1)]',
    };
    return (
      <span className={styles[status] || styles.PENDING}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full text-left flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[24px] font-black text-g3">Wholesale Management</h2>
          <p className="text-[13.5px] text-muted -mt-0.5">Manage partner account applications, procurement tiers, and wholesale product prices.</p>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex border border-border-design bg-white p-1 rounded-xl shadow-sm gap-2 select-none self-start">
        <button
          onClick={() => setSubTab('applications')}
          className={`py-2 px-5 rounded-lg text-[13px] font-bold cursor-pointer border-none transition-all ${
            subTab === 'applications'
              ? 'bg-g1 text-white shadow-sm'
              : 'bg-transparent text-muted hover:text-txt hover:bg-gray-50'
          }`}
        >
          Partner Applications
        </button>
        <button
          onClick={() => setSubTab('catalog')}
          className={`py-2 px-5 rounded-lg text-[13px] font-bold cursor-pointer border-none transition-all ${
            subTab === 'catalog'
              ? 'bg-g1 text-white shadow-sm'
              : 'bg-transparent text-muted hover:text-txt hover:bg-gray-50'
          }`}
        >
          Wholesale Catalog & Prices
        </button>
      </div>

      {subTab === 'applications' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-off border border-border-design rounded-2xl p-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by company, registration, SSM or buyer name..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[13.5px] bg-white text-txt"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-muted"></i>
            </div>
            <div className="w-full md:w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[13.5px] bg-white cursor-pointer text-txt"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 border-4 border-g1/10 border-t-g1 rounded-full animate-spin"></div>
                <span className="text-[13.5px] font-bold text-muted">Loading applications...</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-20 text-center text-gray-500 text-[13.5px] font-semibold">
                No wholesale applications found matching filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-off border-b border-border-design text-[12.5px] font-black text-g3 uppercase tracking-wider select-none">
                      <th className="p-4 pl-6">Submitted Date</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Company Name & SSM</th>
                      <th className="p-4">Business Info</th>
                      <th className="p-4">Status & Tier</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-design/60 text-[13.5px]">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-off/35 transition-colors">
                        <td className="p-4 pl-6 text-muted font-medium">
                          {new Date(app.created_at).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-g3">
                            {app.user ? `${app.user.first_name} ${app.user.last_name}` : 'Unknown'}
                          </div>
                          <div className="text-[12px] text-muted">{app.user?.email}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-g3">{app.company_name}</div>
                          <div className="text-[12px] text-muted">SSM: {app.company_registration}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-g3">{app.business_type}</div>
                          <div className="text-[12px] text-muted">Volume: {app.estimated_volume || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 align-start items-start">
                            {getStatusBadge(app.status)}
                            {app.status === 'APPROVED' && (
                              <div className="text-[11.5px] font-semibold text-gray-500">
                                {app.assigned_tier || 'Gold Distributor'}{' '}
                                <span className="text-orange-600 font-extrabold">({app.assigned_discount || 0}% Off)</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex gap-2.5 justify-end items-center">
                            <button
                              onClick={() => {
                                setEditingApp(app);
                                setEditForm({
                                  company_name: app.company_name,
                                  company_registration: app.company_registration,
                                  business_type: app.business_type,
                                  estimated_volume: app.estimated_volume || '',
                                  notes: app.notes || '',
                                  assigned_discount: app.assigned_discount || 0,
                                  assigned_tier: app.assigned_tier || 'Gold Distributor',
                                  status: app.status,
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg py-1.5 px-3 text-[11.5px] font-bold cursor-pointer transition active:scale-95 whitespace-nowrap"
                            >
                              <i className="fa-solid fa-pen-to-square mr-1"></i> Edit/Review
                            </button>
                            <button
                              onClick={() => handleDeleteApplication(app.id, app.company_name)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg py-1.5 px-3 text-[11.5px] font-bold cursor-pointer transition active:scale-95 whitespace-nowrap"
                            >
                              <i className="fa-solid fa-trash mr-1"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border-design flex justify-between items-center bg-gray-50/50">
                <span className="text-[13px] text-muted font-medium">
                  Showing page {page} of {totalPages} ({total} applications)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-9 h-9 rounded-lg border border-border-design bg-white flex items-center justify-center text-txt hover:bg-off cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <i className="fa-solid fa-chevron-left text-[12px]"></i>
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="w-9 h-9 rounded-lg border border-border-design bg-white flex items-center justify-center text-txt hover:bg-off cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <i className="fa-solid fa-chevron-right text-[12px]"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Wholesale Pricing & Product Sheet */}
          <div className="bg-[#EBF7F0] rounded-2xl border border-g1/10 p-6 mb-2">
            <h4 className="font-extrabold text-[15px] text-[#0B8F3A] mb-2 uppercase tracking-wide">Wholesale Catalog Sheet</h4>
            <p className="text-[13.5px] text-txt leading-relaxed">
              Define the wholesale price per item below. Authorized wholesale buyers will automatically receive these specialized prices when logged in.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 bg-off border border-border-design rounded-2xl p-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[13.5px] bg-white text-txt"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-muted"></i>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-3 px-5 text-[13px] font-bold cursor-pointer transition shadow-sm flex items-center gap-2 select-none">
                <i className="fa-solid fa-file-import"></i>
                {importingCsv ? 'Importing...' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv"
                  disabled={importingCsv}
                  onChange={handleImportCsv}
                  className="hidden"
                />
              </label>
              <a
                href="data:text/csv;charset=utf-8,SKU,WholesalePrice%0ASKU-DEFAULT-1,10.00%0ASKU-DEFAULT-2,15.50"
                download="wholesale_template.csv"
                className="bg-white border border-border-design hover:bg-gray-50 text-txt rounded-xl py-3 px-5 text-[13px] font-bold cursor-pointer transition select-none flex items-center gap-2 decoration-none"
              >
                <i className="fa-solid fa-download"></i> Template
              </a>
            </div>
          </div>

          <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
            {loadingProducts ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 border-4 border-g1/10 border-t-g1 rounded-full animate-spin"></div>
                <span className="text-[13.5px] font-bold text-muted">Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-gray-500 text-[13.5px] font-semibold">
                No products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-off border-b border-border-design text-[12.5px] font-black text-g3 uppercase tracking-wider select-none">
                      <th className="p-4 pl-6">Product</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Retail Price</th>
                      <th className="p-4">Wholesale Price</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-design/60 text-[13.5px]">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-off/35 transition-colors">
                        <td className="p-4 pl-6 font-bold text-g3">{prod.name}</td>
                        <td className="p-4 text-muted">{prod.sku || '-'}</td>
                        <td className="p-4 font-semibold text-gray-700">RM {parseFloat(prod.price).toFixed(2)}</td>
                        <td className="p-4 font-bold text-orange-600">
                          {prod.wholesale_price ? `RM ${parseFloat(prod.wholesale_price).toFixed(2)}` : 'Not Set'}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleQuickAdjustWholesalePrice(prod.id, prod.name, prod.price, prod.wholesale_price)}
                            className="bg-g1 hover:bg-g3 text-white border-none rounded-lg py-1.5 px-3.5 text-[12px] font-bold cursor-pointer transition shadow-sm active:scale-95"
                          >
                            Set Price
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {productTotalPages > 1 && (
              <div className="p-4 border-t border-border-design flex justify-between items-center bg-gray-50/50">
                <span className="text-[13px] text-muted font-medium">
                  Showing page {productPage} of {productTotalPages} ({productTotal} products)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={productPage === 1}
                    onClick={() => setProductPage(p => p - 1)}
                    className="w-9 h-9 rounded-lg border border-border-design bg-white flex items-center justify-center text-txt hover:bg-off cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <i className="fa-solid fa-chevron-left text-[12px]"></i>
                  </button>
                  <button
                    disabled={productPage === productTotalPages}
                    onClick={() => setProductPage(p => p + 1)}
                    className="w-9 h-9 rounded-lg border border-border-design bg-white flex items-center justify-center text-txt hover:bg-off cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <i className="fa-solid fa-chevron-right text-[12px]"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Partner Edit / Review Modal */}
      {editingApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-2xl border border-border-design max-w-[500px] w-full p-6 shadow-xl relative animate-fade-in text-left max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-[18px] text-g3 mb-4 uppercase tracking-wide border-b border-border-design pb-2">
              Edit/Review Wholesale Partner Details
            </h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.company_name}
                  onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                  className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">SSM / Registration Number</label>
                <input
                  type="text"
                  required
                  value={editForm.company_registration}
                  onChange={(e) => setEditForm({ ...editForm, company_registration: e.target.value })}
                  className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Business Type</label>
                  <input
                    type="text"
                    required
                    value={editForm.business_type}
                    onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                    className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Estimated Volume</label>
                  <input
                    type="text"
                    value={editForm.estimated_volume}
                    onChange={(e) => setEditForm({ ...editForm, estimated_volume: e.target.value })}
                    className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                />
              </div>

              <div className="border-t border-border-design pt-4 my-2">
                <h4 className="text-[13.5px] font-bold text-g3 uppercase tracking-wide mb-3">Approval Parameters</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Assigned Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={editForm.assigned_discount}
                      onChange={(e) => setEditForm({ ...editForm, assigned_discount: Number(e.target.value) })}
                      className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Procurement Tier</label>
                    <select
                      value={editForm.assigned_tier}
                      onChange={(e) => setEditForm({ ...editForm, assigned_tier: e.target.value })}
                      className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt cursor-pointer"
                    >
                      <option value="Gold Distributor">Gold Distributor</option>
                      <option value="Silver Partner">Silver Partner</option>
                      <option value="Bronze Partner">Bronze Partner</option>
                      <option value="Platinum Partner">Platinum Partner</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Application Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border-none rounded-xl text-[13px] font-bold cursor-pointer text-txt transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 bg-g1 hover:bg-g3 border-none rounded-xl text-[13px] font-bold cursor-pointer text-white transition disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
