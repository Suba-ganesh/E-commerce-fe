import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';
import { notificationService, type Notification } from '../../services/notificationService';
import { formatDate } from '../../utils/helpers';

export const AdminNotificationManager: React.FC = () => {
  const toast = useToast();
  const modal = useModal();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [stats, setStats] = useState<{ total: number; unread: number }>({ total: 0, unread: 0 });

  // Create notification modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    message: '',
    broadcast: false,
    user_id: '',
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAdminNotifications({
        page,
        limit: 15,
        search: search || undefined,
        unread_only: unreadOnly || undefined,
      });
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setTotalPages(res.data.pagination.total_pages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, search, unreadOnly, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await notificationService.getAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.warning('Please enter a notification title');
      return;
    }
    try {
      const res = await notificationService.adminCreateNotification({
        title: createForm.title,
        message: createForm.message || undefined,
        broadcast: createForm.broadcast,
        user_id: createForm.broadcast ? undefined : createForm.user_id || undefined,
      });
      if (res.success) {
        toast.success(createForm.broadcast ? 'Broadcast notification sent to all users!' : 'Notification created successfully!');
        setShowCreateModal(false);
        setCreateForm({ title: '', message: '', broadcast: false, user_id: '' });
        setPage(1);
        fetchNotifications();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      toast.error('Failed to create notification');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const confirmed = await modal.confirm(
      'Delete Notification',
      'Are you sure you want to delete this notification? This action cannot be undone.'
    );
    if (confirmed) {
      try {
        const res = await notificationService.adminDeleteNotification(id);
        if (res.success) {
          toast.success('Notification deleted successfully');
          fetchNotifications();
          fetchStats();
        }
      } catch (error) {
        console.error('Failed to delete notification:', error);
        toast.error('Failed to delete notification');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-black text-g3 leading-none">Notification Management</h2>
          <p className="text-gray-500 text-[13.5px] mt-1.5 font-semibold">Send, manage, and track all system notifications.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-g1 hover:bg-g3 text-white border-none rounded-xl text-[13px] font-bold cursor-pointer transition shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> New Notification
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-border-design rounded-xl shadow-sm">
          <div className="text-[12px] text-muted font-semibold mb-1">Total Notifications</div>
          <div className="text-[28px] font-extrabold text-g3">{stats.total}</div>
        </div>
        <div className="p-4 bg-white border border-border-design rounded-xl shadow-sm">
          <div className="text-[12px] text-muted font-semibold mb-1">Unread</div>
          <div className="text-[28px] font-extrabold text-red-500">{stats.unread}</div>
        </div>
        <div className="p-4 bg-white border border-border-design rounded-xl shadow-sm">
          <div className="text-[12px] text-muted font-semibold mb-1">Read Rate</div>
          <div className="text-[28px] font-extrabold text-g1">
            {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border-design rounded-xl p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Search by title, message, or user email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border-design rounded-lg outline-none text-[13px] focus:border-g1 bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-g1 text-white border-none rounded-lg font-semibold cursor-pointer hover:bg-g3 transition text-[13px]"
            >
              Search
            </button>
          </div>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-txt cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }}
              className="accent-g1 cursor-pointer"
            />
            Unread only
          </label>
        </form>
      </div>

      {/* Notifications Table */}
      <div className="bg-white border border-border-design rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted font-semibold flex flex-col gap-2 items-center">
            <div className="w-8 h-8 border-4 border-g1 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[14px]">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted font-semibold text-[14px]">
            <i className="fa-solid fa-bell-slash text-[32px] text-muted/30 block mb-3"></i>
            No notifications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px] text-left">
              <thead>
                <tr className="border-b-2 border-border-design text-muted">
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Message</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-design">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-off transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${notif.is_read ? 'bg-gray-300' : 'bg-g1'}`}></span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-txt">
                        {notif.user ? `${notif.user.first_name} ${notif.user.last_name}` : '—'}
                      </div>
                      {notif.user && (
                        <div className="text-[11px] text-muted">{notif.user.email}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`${!notif.is_read ? 'font-bold text-g3' : 'font-semibold text-txt'}`}>
                        {notif.title}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[200px] truncate">
                      {notif.message || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {formatDate(notif.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="px-3 py-1.5 bg-transparent border border-red-200 text-red-600 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-border-design text-muted text-[14px]">
            <div>
              Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, totalCount)} of {totalCount}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white border border-border-design rounded font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 border rounded font-semibold cursor-pointer transition ${
                      page === pageNum
                        ? 'bg-g1 border-g1 text-white'
                        : 'bg-white border-border-design text-gray-700 hover:bg-off'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white border border-border-design rounded font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-2xl border border-border-design max-w-[500px] w-full p-6 shadow-xl relative animate-fade-in text-left">
            <h3 className="font-extrabold text-[18px] text-g3 mb-4 uppercase tracking-wide border-b border-border-design pb-2">
              Create Notification
            </h3>
            <form onSubmit={handleCreateNotification} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Order Shipped"
                  className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Message (Optional)</label>
                <textarea
                  value={createForm.message}
                  onChange={(e) => setCreateForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Notification body text..."
                  rows={3}
                  className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="broadcast"
                  checked={createForm.broadcast}
                  onChange={(e) => setCreateForm(f => ({ ...f, broadcast: e.target.checked, user_id: '' }))}
                  className="accent-g1 cursor-pointer"
                />
                <label htmlFor="broadcast" className="text-[12.5px] font-semibold text-gray-600 cursor-pointer">
                  Broadcast to all active users
                </label>
              </div>
              {!createForm.broadcast && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">User ID (Optional)</label>
                  <input
                    type="text"
                    value={createForm.user_id}
                    onChange={(e) => setCreateForm(f => ({ ...f, user_id: e.target.value }))}
                    placeholder="Leave empty for no specific user"
                    className="border border-border-design rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-g1 bg-white text-txt"
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border-none rounded-xl text-[13px] font-bold cursor-pointer text-txt transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-g1 hover:bg-g3 border-none rounded-xl text-[13px] font-bold cursor-pointer text-white transition"
                >
                  Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationManager;