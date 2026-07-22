import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { reviewService } from '../../services/reviewService';
import type { Review, ReviewStats, RatingDistributionItem, TopRatedProductItem } from '../../services/reviewService';

export const AdminReviewManager: React.FC = () => {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [distribution, setDistribution] = useState<RatingDistributionItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopRatedProductItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<{ total: number; total_pages: number } | null>(null);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Debounce search input to avoid hitting backend on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch reviews list
  const fetchReviewsList = useCallback(async () => {
    try {
      const response = await reviewService.getAdminReviews({
        page,
        limit,
        search: debouncedSearch || undefined,
        rating: ratingFilter,
      });
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setPagination({
          total: response.data.pagination.total,
          total_pages: response.data.pagination.total_pages,
        });
      }
    } catch (error) {
      console.error('Failed to fetch reviews list:', error);
      toast.error('Failed to load reviews list');
    }
  }, [page, limit, debouncedSearch, ratingFilter, toast]);

  // Fetch stats and overview dashboards
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, distRes, topRes] = await Promise.all([
        reviewService.getAdminReviewStats(),
        reviewService.getAdminRatingDistribution(),
        reviewService.getAdminTopRatedProducts(5),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (distRes.success && distRes.data) {
        setDistribution(distRes.data);
      }
      if (topRes.success && topRes.data) {
        setTopProducts(topRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews analytics:', error);
      toast.error('Failed to load reviews analytics statistics');
    }
  }, [toast]);

  // Combined fetch function
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchReviewsList(), fetchDashboardData()]);
    setLoading(false);
  }, [fetchReviewsList, fetchDashboardData]);

  // Trigger load on state change
  useEffect(() => {
    fetchAllData();
  }, [page, debouncedSearch, ratingFilter]);

  // Handle delete action
  const handleDeleteReview = async (id: number) => {
    try {
      const response = await reviewService.adminDeleteReview(id);
      if (response.success) {
        toast.success('Review deleted successfully');
        setSelectedReview(null);
        // If we are deleting the last item on the page, go to the previous page
        if (reviews.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchAllData();
        }
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  // Helper star and date formatting
  const renderStars = (rating: number) => {
    return (
      <span className="text-[#f1c40f] text-[14px] whitespace-nowrap">
        {'★'.repeat(rating)}
        <span className="text-border-design">{'★'.repeat(5 - rating)}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate positive / critical highlights
  const fiveStarCount = distribution.find((d) => d.stars === 5)?.count || 0;
  const oneStarCount = distribution.find((d) => d.stars === 1)?.count || 0;

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[28px] font-extrabold text-g3 m-0 leading-[1.2]">Reviews & Ratings Management</h2>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">Total Reviews</div>
            <div className="w-10 h-10 bg-[rgba(52,152,219,0.1)] rounded-xl flex items-center justify-center text-[#3498db]">
              <i className="fa-solid fa-comments"></i>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">
            {loading && !stats ? '...' : stats?.total_reviews.toLocaleString() || 0}
          </div>
          <div className="text-[13px] font-semibold text-[#27ae60] mt-3">Active Customer Feedback</div>
        </div>

        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">Average Rating</div>
            <div className="w-10 h-10 bg-[rgba(241,196,15,0.1)] rounded-xl flex items-center justify-center text-[#f1c40f]">
              <i className="fa-solid fa-star"></i>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">
            {loading && !stats ? '...' : stats?.average_rating || '0.0'}
          </div>
          <div className="text-[13px] font-semibold text-muted mt-3">Across all products</div>
        </div>

        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">This Month</div>
            <div className="w-10 h-10 bg-[rgba(39,174,96,0.1)] rounded-xl flex items-center justify-center text-g1">
              <i className="fa-solid fa-calendar-days"></i>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">
            {loading && !stats ? '...' : stats?.reviews_this_month.toLocaleString() || 0}
          </div>
          <div className="text-[13px] font-semibold text-g1 mt-3">New submissions</div>
        </div>

        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">5-Star Reviews</div>
            <div className="w-10 h-10 bg-[rgba(46,204,113,0.1)] rounded-xl flex items-center justify-center text-[#2ecc71]">
              <i className="fa-solid fa-face-smile"></i>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">
            {loading && !stats ? '...' : fiveStarCount.toLocaleString()}
          </div>
          <div className="text-[13px] font-semibold text-muted mt-3">Excellent experiences</div>
        </div>

        <div className="p-5 bg-white border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[14px] font-semibold text-muted">1-Star Reviews</div>
            <div className="w-10 h-10 bg-[rgba(231,76,60,0.1)] rounded-xl flex items-center justify-center text-[#e74c3c]">
              <i className="fa-solid fa-face-frown"></i>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-g3 leading-none">
            {loading && !stats ? '...' : oneStarCount.toLocaleString()}
          </div>
          <div className="text-[13px] font-semibold text-[#e74c3c] mt-3">Critical issues flag</div>
        </div>
      </div>

      {/* Graphs & Sub-Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-[16px] font-extrabold text-g3 mb-4">Rating Distribution</h3>
          <div className="flex flex-col gap-3">
            {distribution.length === 0 ? (
              <div className="text-muted text-center py-6 text-[13px]">No distribution data available</div>
            ) : (
              distribution.map((r) => {
                const colors: Record<number, string> = {
                  5: '#27ae60',
                  4: '#2ecc71',
                  3: '#f1c40f',
                  2: '#e67e22',
                  1: '#e74c3c',
                };
                return (
                  <div key={r.stars} className="flex items-center gap-4">
                    <span className="font-bold w-10 text-[13px]">{r.stars} ★</span>
                    <div className="flex-1 h-2 bg-border-design rounded-full overflow-hidden">
                      <div
                        style={{ width: `${r.pct}%`, backgroundColor: colors[r.stars] }}
                        className="h-full transition-all duration-500"
                      ></div>
                    </div>
                    <span className="text-muted text-[12px] w-12 text-right">
                      {r.count.toLocaleString()} ({r.pct}%)
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Highest Rated Products */}
        <div className="bg-white p-6 rounded-2xl border border-border-design shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-[16px] font-extrabold text-g3 mb-4">Highest Rated Products</h3>
            <div className="flex flex-col gap-3">
              {topProducts.length === 0 ? (
                <div className="text-muted text-center py-6 text-[13px]">No product ratings available yet</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div
                    key={p.product_id}
                    className={`flex justify-between items-center ${
                      idx < topProducts.length - 1 ? 'border-b border-border-design pb-2.5' : ''
                    }`}
                  >
                    <div className="font-semibold text-g3 text-[13px] truncate max-w-[70%]">{p.product_name}</div>
                    <div className="font-extrabold text-g1 text-[13px] flex items-center gap-1.5 shrink-0">
                      <span>{p.average_rating} ★</span>
                      <span className="text-[11px] text-muted font-semibold">({p.review_count} {p.review_count === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Reviews List Block */}
      <div className="border border-border-design rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-border-design bg-white flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or product..."
              className="px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none min-w-[250px] placeholder-gray-400 text-gray-700"
            />
            <select
              value={ratingFilter || ''}
              onChange={(e) => {
                const val = e.target.value;
                setRatingFilter(val ? parseInt(val, 10) : undefined);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-border-design rounded-lg text-[13px] outline-none cursor-pointer bg-white text-gray-700 font-medium"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Loading Overlay / Spinner */}
        {loading && reviews.length === 0 ? (
          <div className="p-12 text-center text-muted font-semibold flex flex-col gap-2 items-center">
            <div className="w-8 h-8 border-4 border-g1 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[14px]">Loading reviews data...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-muted font-semibold text-[14px]">
            No reviews found matching the filters.
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile/tablet */}
            <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full border-collapse text-[13px] text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border-design bg-off text-muted">
                    <th className="p-4 font-semibold">Review ID</th>
                    <th className="p-4 font-semibold">Customer Name</th>
                    <th className="p-4 font-semibold">Product Name</th>
                    <th className="p-4 font-semibold">Rating</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-design">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-off transition-colors">
                      <td className="p-4 font-bold text-g3 whitespace-nowrap">#REV-{rev.id}</td>
                      <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">
                        {rev.user.first_name} {rev.user.last_name}
                      </td>
                      <td className="p-4 text-muted whitespace-nowrap font-medium max-w-[200px] truncate">
                        {rev.product.name}
                      </td>
                      <td className="p-4">{renderStars(rev.rating)}</td>
                      <td className="p-4 text-muted font-semibold whitespace-nowrap">{formatDate(rev.created_at)}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReview(rev)}
                          className="px-3 py-1.5 bg-border-design hover:bg-gray-200 border-none rounded font-bold text-gray-700 cursor-pointer transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="lg:hidden divide-y divide-border-design">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 hover:bg-off transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-g3 text-[14px] leading-tight mb-1">#REV-{rev.id}</h4>
                      <p className="text-[11px] text-gray-500">
                        {rev.user.first_name} {rev.user.last_name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Product</span>
                      <span className="text-gray-800 font-semibold text-[12px] block truncate">{rev.product.name}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Rating</span>
                      {renderStars(rev.rating)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                    <div className="text-[11px] text-gray-500">
                      <span className="font-semibold">Date:</span> {formatDate(rev.created_at)}
                    </div>
                    <button
                      onClick={() => setSelectedReview(rev)}
                      className="px-3 py-2 bg-border-design hover:bg-gray-200 border-none rounded-lg text-[12px] font-bold text-gray-700 cursor-pointer transition-colors active:scale-95"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total_pages > 1 && (
              <div className="p-4 border-t border-border-design bg-white flex justify-between items-center flex-wrap gap-4 text-[13px]">
                <span className="text-muted font-medium">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-white border border-border-design rounded hover:bg-gray-50 font-semibold text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.total_pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 py-1.5 border rounded font-bold cursor-pointer transition-colors ${
                        page === i + 1
                          ? 'bg-g1 border-g1 text-white'
                          : 'bg-white border-border-design text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === pagination.total_pages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-white border border-border-design rounded hover:bg-gray-50 font-semibold text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Details Overlay Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-border-design transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border-design flex justify-between items-center bg-gray-50">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-g1 bg-[rgba(39,174,96,0.1)] px-2.5 py-1 rounded-full">
                  #REV-{selectedReview.id}
                </span>
                <h3 className="text-[18px] font-black text-g3 mt-2.5 mb-0">Review Details</h3>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="w-8 h-8 rounded-full bg-white border border-border-design flex items-center justify-center text-muted hover:text-g3 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border-design">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold block mb-1">Customer</span>
                  <span className="font-bold text-gray-800 text-[13px]">
                    {selectedReview.user.first_name} {selectedReview.user.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold block mb-1">Product</span>
                  <span className="font-bold text-gray-800 text-[13px] block truncate">
                    {selectedReview.product.name}
                  </span>
                </div>
              </div>

              <div className="pb-4 border-b border-border-design">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold">Rating & Date</span>
                  <span className="text-[12px] text-muted font-bold">
                    {formatDate(selectedReview.created_at)}
                  </span>
                </div>
                <div>{renderStars(selectedReview.rating)}</div>
              </div>

              <div>
                <span className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold block mb-2">Review Content</span>
                <div className="bg-gray-50 rounded-xl p-4 border border-border-design">
                  {selectedReview.title && (
                    <h4 className="font-extrabold text-[14px] text-g3 mb-2">{selectedReview.title}</h4>
                  )}
                  <p className="text-[13px] text-gray-600 m-0 leading-relaxed italic">
                    "{selectedReview.description || 'No description provided.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-design bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                    handleDeleteReview(selectedReview.id);
                  }
                }}
                className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white border-none rounded-lg font-bold text-[13px] cursor-pointer transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-trash-can"></i> Delete Review
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 border border-border-design rounded-lg font-bold text-[13px] text-gray-700 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
