import React, { useState, useEffect, useCallback } from 'react';
import {
  getDistributors,
  getDistributorStats,
  createDistributor,
  updateDistributor,
  deleteDistributor,
  updateDistributorStatus,
} from '../../services/distributorService';
import type { Distributor, DistributorStats, DistributorFormData } from '../../services/distributorService';

// ======================== TYPES ========================

const emptyForm: DistributorFormData = {
  contact_person: '',
  phone_number: '',
  email: '',
  vehicle_no: '',
  region: '',
  territory: '',
  company_name: '',
  notes: '',
};

// ======================== HELPER ========================

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-[rgba(39,174,96,0.15)] text-[#27ae60]',
    PENDING: 'bg-[rgba(243,156,18,0.15)] text-[#f39c12]',
    SUSPENDED: 'bg-[rgba(231,76,60,0.15)] text-[#e74c3c]',
    INACTIVE: 'bg-gray-100 text-gray-500',
  };
  return styles[status] || styles.PENDING;
};

const formatDate = (d?: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ======================== MAIN COMPONENT ========================

export const AdminDistributorManager: React.FC = () => {
  // ── State ──
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [formData, setFormData] = useState<DistributorFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Distributor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // View detail
  const [viewingDistributor, setViewingDistributor] = useState<Distributor | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Data Fetching ──
  const fetchDistributors = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;
      const res = await getDistributors(params);
      const result = res.data;
      setDistributors(result.data || result.distributors || []);
      setTotalPages(result.meta?.totalPages || 1);
      setTotal(result.meta?.total || 0);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load distributors', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, regionFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDistributorStats();
      setStats(res.data?.data || res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Search debounce ──
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => setSearch(value), 400));
  };

  // ── Modal Handlers ──
  const openAddModal = () => {
    setEditingDistributor(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (d: Distributor) => {
    setEditingDistributor(d);
    setFormData({
      contact_person: d.contact_person,
      phone_number: d.phone_number,
      email: d.email || '',
      vehicle_no: d.vehicle_no || '',
      region: d.region,
      territory: d.territory || '',
      company_name: d.company_name || '',
      notes: d.notes || '',
    });
    setShowModal(true);
  };

  const handleFormChange = (field: keyof DistributorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.contact_person.trim()) {
      showToast('Driver name is required', 'error');
      return;
    }
    if (!formData.phone_number.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!formData.region.trim()) {
      showToast('Distribution area is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDistributor) {
        await updateDistributor(editingDistributor.id, formData);
        showToast('Distributor updated successfully');
      } else {
        await createDistributor(formData);
        showToast('Distributor created successfully');
      }
      setShowModal(false);
      fetchDistributors();
      fetchStats();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const confirmDelete = (d: Distributor) => {
    setDeleteTarget(d);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDistributor(deleteTarget.id);
      showToast('Distributor deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchDistributors();
      fetchStats();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Status change ──
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateDistributorStatus(id, status);
      showToast(`Status changed to ${status}`);
      fetchDistributors();
      fetchStats();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Status change failed', 'error');
    }
  };

  // ── View Detail ──
  const openDetail = (d: Distributor) => {
    setViewingDistributor(d);
    setShowDetail(true);
  };

  // ── Derived stats ──
  const getDistinctRegions = () => {
    const regions = new Set(distributors.map((d) => d.region).filter(Boolean));
    return Array.from(regions);
  };

  // ====================== RENDER ======================

  return (
    <div className="flex flex-col gap-6 w-full text-left relative">

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-xl text-white font-semibold text-[13px] transition-all animate-slide-down ${
            toast.type === 'success' ? 'bg-[#27ae60]' : 'bg-[#e74c3c]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-[28px] font-extrabold text-g3 m-0">Distributor Management</h2>
          <p className="text-muted text-[13px] mt-1 m-0">
            Register and manage distributors — driver name, vehicle no, distribution area & more
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-g1 hover:bg-g3 text-white border-none rounded-lg py-2.5 px-5 text-[14px] font-bold cursor-pointer transition shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Add Distributor
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">Total Distributors</div>
            <div className="w-10 h-10 bg-[rgba(39,174,96,0.1)] rounded-xl flex items-center justify-center text-g1"><i className="fa-solid fa-users"></i></div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">{stats?.total_distributors ?? total}</div>
        </div>
        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">Active Distributors</div>
            <div className="w-10 h-10 bg-[rgba(52,152,219,0.1)] rounded-xl flex items-center justify-center text-[#3498db]"><i className="fa-solid fa-check-circle"></i></div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">{stats?.active_distributors ?? 0}</div>
        </div>
        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">Pending Approvals</div>
            <div className="w-10 h-10 bg-[rgba(243,156,18,0.1)] rounded-xl flex items-center justify-center text-[#f39c12]"><i className="fa-solid fa-clock"></i></div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">{stats?.pending_distributors ?? 0}</div>
        </div>
        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">Distribution Areas</div>
            <div className="w-10 h-10 bg-[rgba(142,68,173,0.1)] rounded-xl flex items-center justify-center text-pu"><i className="fa-solid fa-location-dot"></i></div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">{getDistinctRegions().length || 0}</div>
        </div>
      </div>

      {/* ── Filters & Actions ── */}
      <div className="border border-border-design rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-border-design bg-white flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search driver, vehicle no, area..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none min-w-[250px] placeholder-gray-400 text-gray-700"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none cursor-pointer bg-white text-gray-700 font-medium"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none cursor-pointer bg-white text-gray-700 font-medium"
            >
              <option value="">All Areas</option>
              {stats?.regional_distribution?.map((r) => (
                <option key={r.region} value={r.region}>{r.region}</option>
              ))}
            </select>
          </div>
          <span className="text-gray-400 text-[12px] font-medium">
            {total} distributor{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="p-10 text-center text-muted">
            <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
            <p className="text-[13px]">Loading distributors...</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && distributors.length === 0 && (
          <div className="p-10 text-center">
            <div className="text-4xl text-gray-300 mb-3"><i className="fa-solid fa-truck"></i></div>
            <p className="text-gray-500 text-[14px] font-medium">No distributors found</p>
            <p className="text-gray-400 text-[12px] mt-1">Click "Add Distributor" to register the first one</p>
          </div>
        )}

        {/* ── Desktop Table ── */}
        {!loading && distributors.length > 0 && (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-[13px] text-left">
                <thead>
                  <tr className="border-b border-border-design bg-off text-muted">
                    <th className="p-4 font-semibold">Driver Name</th>
                    <th className="p-4 font-semibold">Phone</th>
                    <th className="p-4 font-semibold">Vehicle No</th>
                    <th className="p-4 font-semibold">Distribution Area</th>
                    <th className="p-4 font-semibold">Quantity / Orders</th>
                    <th className="p-4 font-semibold">Date Added</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-design">
                  {distributors.map((d) => (
                    <tr key={d.id} className="hover:bg-off transition-colors">
                      <td className="p-4 font-bold text-g3 whitespace-nowrap">
                        <div>{d.contact_person}</div>
                        {d.company_name && <div className="text-[11px] text-gray-400 font-normal">{d.company_name}</div>}
                      </td>
                      <td className="p-4 text-muted whitespace-nowrap font-medium">{d.phone_number}</td>
                      <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">{d.vehicle_no || '-'}</td>
                      <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">{d.region}</td>
                      <td className="p-4 font-bold text-gray-800 whitespace-nowrap">
                        {d.active_orders ?? d.total_orders ?? 0} orders
                      </td>
                      <td className="p-4 text-muted whitespace-nowrap font-medium text-[12px]">{formatDate(d.created_at)}</td>
                      <td className="p-4">
                        <select
                          value={d.status}
                          onChange={(e) => handleStatusChange(d.id, e.target.value)}
                          className={`px-2 py-1 rounded text-[11px] font-bold border-none outline-none cursor-pointer ${getStatusBadge(d.status)}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span onClick={() => openDetail(d)} className="text-g1 font-semibold cursor-pointer mr-3 hover:underline text-[12px]">View</span>
                        <span onClick={() => openEditModal(d)} className="text-muted font-semibold cursor-pointer mr-3 hover:underline text-[12px]">Edit</span>
                        <span onClick={() => confirmDelete(d)} className="text-[#e74c3c] font-semibold cursor-pointer hover:underline text-[12px]">Delete</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card View ── */}
            <div className="lg:hidden divide-y divide-border-design">
              {distributors.map((d) => (
                <div key={d.id} className="p-4 hover:bg-off transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-g3 text-[14px] leading-tight mb-1">{d.contact_person}</h4>
                      {d.company_name && <p className="text-[11px] text-gray-500">{d.company_name}</p>}
                    </div>
                    <select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d.id, e.target.value)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border-none outline-none cursor-pointer shrink-0 ${getStatusBadge(d.status)}`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Phone</span>
                      <span className="text-gray-800 font-semibold text-[12px]">{d.phone_number}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Vehicle</span>
                      <span className="text-gray-800 font-semibold text-[12px]">{d.vehicle_no || '-'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Area</span>
                      <span className="text-gray-800 font-semibold text-[12px]">{d.region}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Orders</span>
                      <span className="text-gray-800 font-bold text-[13px]">{d.active_orders ?? d.total_orders ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                    <div className="text-[11px] text-gray-500 truncate mr-2">
                      <span className="font-semibold">Added:</span> {formatDate(d.created_at)}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <span onClick={() => openDetail(d)} className="text-g1 font-semibold px-3 py-2 rounded-lg text-[12px] bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">View</span>
                      <span onClick={() => openEditModal(d)} className="text-muted font-semibold px-3 py-2 rounded-lg text-[12px] bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">Edit</span>
                      <span onClick={() => confirmDelete(d)} className="text-[#e74c3c] font-semibold px-3 py-2 rounded-lg text-[12px] bg-red-50 hover:bg-red-100 cursor-pointer transition-colors">Delete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border-design flex justify-between items-center">
                <span className="text-[12px] text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-border-design rounded-lg text-[12px] font-semibold text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-off transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-border-design rounded-lg text-[12px] font-semibold text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-off transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════ */}
      {/* ── ADD / EDIT MODAL ── */}
      {/* ════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-border-design sticky top-0 bg-white z-10">
              <h3 className="text-[18px] font-extrabold text-g3 m-0">
                {editingDistributor ? 'Edit Distributor' : 'Register New Distributor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer border-none text-lg">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driver Name */}
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Driver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmad Bin Ismail"
                    value={formData.contact_person}
                    onChange={(e) => handleFormChange('contact_person', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Vehicle No */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle No</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC 1234"
                    value={formData.vehicle_no}
                    onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +60 12-345 6789"
                    value={formData.phone_number}
                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="driver@example.com"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Distribution Area */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Distribution Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kuala Lumpur"
                    value={formData.region}
                    onChange={(e) => handleFormChange('region', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Territory */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Territory / Sub-area</label>
                  <input
                    type="text"
                    placeholder="e.g. Cheras"
                    value={formData.territory}
                    onChange={(e) => handleFormChange('territory', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Company / Business Name</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.company_name}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    placeholder="Additional notes about this distributor..."
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none focus:border-g1 transition placeholder-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border-design">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-border-design rounded-lg text-[13px] font-bold text-gray-600 cursor-pointer hover:bg-off transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 bg-g1 hover:bg-g3 text-white border-none rounded-lg text-[13px] font-bold cursor-pointer disabled:opacity-50 transition flex items-center gap-2"
              >
                {submitting && <i className="fa-solid fa-spinner fa-spin"></i>}
                {editingDistributor ? 'Update' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* ── DELETE CONFIRM ── */}
      {/* ════════════════════════════════════════ */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-6 text-center">
            <div className="text-4xl text-[#e74c3c] mb-4"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h3 className="text-[18px] font-extrabold text-g3 mb-2">Delete Distributor?</h3>
            <p className="text-gray-500 text-[13px] mb-1">
              Are you sure you want to delete <strong>{deleteTarget.contact_person}</strong>?
            </p>
            <p className="text-gray-400 text-[12px] mb-5">This will deactivate the distributor record.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                className="px-5 py-2.5 border border-border-design rounded-lg text-[13px] font-bold text-gray-600 cursor-pointer hover:bg-off transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-[#e74c3c] hover:bg-red-700 text-white border-none rounded-lg text-[13px] font-bold cursor-pointer transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* ── DETAIL VIEW ── */}
      {/* ════════════════════════════════════════ */}
      {showDetail && viewingDistributor && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-border-design sticky top-0 bg-white z-10">
              <h3 className="text-[18px] font-extrabold text-g3 m-0">Distributor Details</h3>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer border-none text-lg">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-g1/10 flex items-center justify-center text-g1 font-bold text-lg">
                    {viewingDistributor.contact_person.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-g3 text-[15px]">{viewingDistributor.contact_person}</h4>
                    {viewingDistributor.company_name && (
                      <p className="text-gray-500 text-[12px]">{viewingDistributor.company_name}</p>
                    )}
                  </div>
                  <span className={`ml-auto px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(viewingDistributor.status)}`}>
                    {viewingDistributor.status}
                  </span>
                </div>

                <DetailRow label="Phone" value={viewingDistributor.phone_number} />
                <DetailRow label="Email" value={viewingDistributor.email || '-'} />
                <DetailRow label="Vehicle No" value={viewingDistributor.vehicle_no || '-'} />
                <DetailRow label="Distribution Area" value={viewingDistributor.region} />
                <DetailRow label="Territory" value={viewingDistributor.territory || '-'} />
                <DetailRow label="Total Orders" value={String(viewingDistributor.total_orders || 0)} />
                <DetailRow label="Status" value={viewingDistributor.status} />
                <DetailRow label="Date Added" value={formatDate(viewingDistributor.created_at)} />
                {viewingDistributor.notes && <DetailRow label="Notes" value={viewingDistributor.notes} />}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border-design">
              <button
                onClick={() => { setShowDetail(false); openEditModal(viewingDistributor); }}
                className="px-5 py-2.5 bg-g1 hover:bg-g3 text-white border-none rounded-lg text-[13px] font-bold cursor-pointer transition"
              >
                Edit Distributor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ======================== SUB-COMPONENTS ========================

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-500 text-[12px] font-semibold">{label}</span>
    <span className="text-gray-800 text-[13px] font-medium">{value}</span>
  </div>
);

export default AdminDistributorManager;