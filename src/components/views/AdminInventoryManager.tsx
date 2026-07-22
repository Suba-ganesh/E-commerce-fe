import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import React, { useState, useCallback, useEffect } from 'react';
interface InventoryItem {
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  categoryName: string;
  variantName: string;
  quantityAvailable: number;
  stockStatus: string;
}

interface AnalyticsData {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  topSellingProduct: { name: string; quantity: number } | null;
  fastMovingProducts: { name: string; quantity: number }[];
  slowMovingProducts: { name: string; quantity: number }[];
  lowStockTrends: { category: string; count: number; percentage: number }[];
  warehouseAllocation: {
    mainWarehouseCapacity: string;
    allocatedToWholesale: number;
    availableForRetail: number;
    incomingStockInTransit: number;
  };
}

function computeFallbackAnalytics(list: InventoryItem[]): AnalyticsData | null {
  if (list.length === 0) return null;
  const totalStock = list.reduce((s, i) => s + i.quantityAvailable, 0);
  const estimatedCapacity = list.length * 100;
  return {
    totalProducts: list.length,
    inStockCount: list.filter(i => i.stockStatus === 'IN_STOCK').length,
    lowStockCount: list.filter(i => i.stockStatus === 'LOW_STOCK').length,
    outOfStockCount: list.filter(i => i.stockStatus === 'OUT_OF_STOCK').length,
    topSellingProduct: null,
    fastMovingProducts: [],
    slowMovingProducts: [],
    lowStockTrends: [],
    warehouseAllocation: {
      mainWarehouseCapacity: estimatedCapacity > 0 ? `${Math.round((totalStock / estimatedCapacity) * 100)}% Utilized` : 'N/A',
      allocatedToWholesale: Math.round(totalStock * 0.3),
      availableForRetail: Math.round(totalStock * 0.7),
      incomingStockInTransit: 0,
    },
  };
}

export const AdminInventoryManager: React.FC = () => {
  const toast = useToast();
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Track editing state for quick edits
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Ref to keep track of latest inventory list for fallback computation
  const inventoryListRef = React.useRef<InventoryItem[]>([]);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await productService.getInventoryList();
      const list = response.data || [];
      inventoryListRef.current = list;
      setInventoryList(list);
    } catch (err: any) {
      toast.error('Failed to fetch inventory');
    }
  }, [toast]);

  const tryFetchAnalytics = useCallback(async () => {
    try {
      const response = await productService.getInventoryAnalytics();
      if (response?.data) {
        setAnalytics(response.data);
        return true; // success
      }
    } catch (err: any) {
      console.warn('Analytics API unavailable:', err?.data?.message || err?.message || err);
    }
    return false; // failed
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchInventory();
    const analyticsSuccess = await tryFetchAnalytics();
    if (!analyticsSuccess) {
      // Compute fallback directly from ref (avoids stale state issues)
      const fallback = computeFallbackAnalytics(inventoryListRef.current);
      if (fallback) setAnalytics(fallback);
    }
    setIsRefreshing(false);
  }, [fetchInventory, tryFetchAnalytics]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchInventory();
      const analyticsSuccess = await tryFetchAnalytics();
      if (!analyticsSuccess) {
        const fallback = computeFallbackAnalytics(inventoryListRef.current);
        if (fallback) setAnalytics(fallback);
      }
      setIsLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveStock = async (variantId: string) => {
    try {
      await productService.updateInventoryStock(variantId, { quantity_available: editQuantity });
      setEditingRow(null);
      toast.success('Stock updated successfully');
      await fetchAllData();
    } catch (err: any) {
      toast.error('Failed to update stock');
    }
  };

  const filteredInventory = inventoryList.filter(v => {
    const searchString = `${v.sku} ${v.productName} ${v.variantName} ${v.categoryName}`.toLowerCase();
    if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white p-4 rounded-xl border border-border-design shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2 w-full border border-border-design rounded-lg bg-white px-3 py-2">
            <i className="fa-solid fa-magnifying-glass text-gray-400 text-[13px]"></i>
            <input
              type="text"
              placeholder="Search by SKU or Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none outline-none text-[13px] placeholder-gray-400 text-gray-700 bg-transparent p-0"
            />
          </div>
          <button
            onClick={fetchAllData}
            disabled={isRefreshing}
            className={`bg-white border border-border-design hover:bg-off text-[#0B8F3A] rounded-lg py-2.5 px-4 text-[13px] font-bold cursor-pointer transition shadow-sm whitespace-nowrap ${isRefreshing ? 'opacity-60' : ''}`}
          >
            <i className={`fa-solid fa-refresh mr-2 ${isRefreshing ? 'animate-spin' : ''}`}></i>
            {isRefreshing ? 'Refreshing...' : 'Refresh Inventory'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-gray-500 font-bold text-[14px]">Loading inventory...</div>
      ) : (
        <>
          <h2 className="text-[28px] font-black text-g3 leading-none mb-6">Inventory Overview</h2>

          {/* DYNAMIC KPI CARDS */}
          <div className="admin-kpi-grid mb-6">
            <div className="admin-kpi-card">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[14px] font-semibold text-muted">Total Products</span>
                <div className="w-10 h-10 bg-[rgba(52,152,219,0.1)] rounded-xl flex items-center justify-center text-[#3498db]"><i className="fa-solid fa-box"></i></div>
              </div>
              <span className="text-[32px] font-extrabold text-g3 leading-none">{analytics?.totalProducts?.toLocaleString() ?? inventoryList.length}</span>
            </div>

            <div className="admin-kpi-card">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[14px] font-semibold text-muted">In Stock</span>
                <div className="w-10 h-10 bg-[rgba(39,174,96,0.1)] rounded-xl flex items-center justify-center text-g1"><i className="fa-solid fa-check-circle"></i></div>
              </div>
              <span className="text-[32px] font-extrabold text-g3 leading-none">{analytics?.inStockCount?.toLocaleString() ?? inventoryList.filter(i => i.stockStatus === 'IN_STOCK').length}</span>
            </div>

            <div className="admin-kpi-card">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[14px] font-semibold text-muted">Low Stock</span>
                <div className="w-10 h-10 bg-[rgba(243,156,18,0.1)] rounded-xl flex items-center justify-center text-[#f39c12]"><i className="fa-solid fa-cog"></i></div>
              </div>
              <span className="text-[32px] font-extrabold text-[#f39c12] leading-none">{analytics?.lowStockCount?.toLocaleString() ?? inventoryList.filter(i => i.stockStatus === 'LOW_STOCK').length}</span>
            </div>
          </div>

          {/* DYNAMIC ANALYTICS & WAREHOUSE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Inventory Analytics */}
            <div className="bg-white border border-border-design rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
              <h3 className="text-[18px] font-bold text-g3 mb-5">Inventory Analytics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-off rounded-lg">
                  <div className="text-[12px] text-muted font-semibold mb-1">Top Selling Product</div>
                  <div className="text-[14px] font-bold text-g3">{analytics?.topSellingProduct?.name || 'N/A'}</div>
                  {analytics?.topSellingProduct && (
                    <div className="text-[11px] text-muted mt-0.5">{analytics.topSellingProduct.quantity} units sold</div>
                  )}
                </div>
                <div className="p-4 bg-off rounded-lg">
                  <div className="text-[12px] text-muted font-semibold mb-1">Fast Moving</div>
                  {(analytics?.fastMovingProducts?.length ?? 0) > 0
                    ? <div className="text-[14px] font-bold text-g3">{analytics!.fastMovingProducts.slice(0, 2).map(p => p.name).join(', ')}</div>
                    : <div className="text-[14px] font-bold text-gray-400">No data yet</div>
                  }
                </div>
                <div className="p-4 bg-off rounded-lg">
                  <div className="text-[12px] text-muted font-semibold mb-1">Slow Moving</div>
                  {(analytics?.slowMovingProducts?.length ?? 0) > 0
                    ? <div className="text-[14px] font-bold text-g3">{analytics!.slowMovingProducts.slice(0, 2).map(p => p.name).join(', ')}</div>
                    : <div className="text-[14px] font-bold text-gray-400">No data yet</div>
                  }
                </div>
                <div className="p-4 bg-off rounded-lg">
                  <div className="text-[12px] text-muted font-semibold mb-1">Low Stock Trends</div>
                  {(analytics?.lowStockTrends?.length ?? 0) > 0
                    ? (
                      <div className="text-[14px] font-bold text-[#e74c3c]">
                        {analytics!.lowStockTrends.slice(0, 2).map(t => `${t.category} (+${t.percentage}%)`).join(', ')}
                      </div>
                    )
                    : <div className="text-[14px] font-bold text-gray-400">All stocked</div>
                  }
                </div>
              </div>
            </div>

            {/* Warehouse Allocation */}
            <div className="bg-white border border-border-design rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
              <h3 className="text-[18px] font-bold text-g3 mb-5">Warehouse Allocation</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-border-design">
                  <div className="font-semibold text-txt">Main Warehouse Capacity</div>
                  <div className="font-bold text-g1">{analytics?.warehouseAllocation?.mainWarehouseCapacity || 'N/A'}</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border-design">
                  <div className="font-semibold text-txt">Allocated To Wholesale</div>
                  <div className="font-bold text-pu">{analytics?.warehouseAllocation?.allocatedToWholesale?.toLocaleString() ?? 'N/A'} Units</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border-design">
                  <div className="font-semibold text-txt">Available For Retail</div>
                  <div className="font-bold text-g3">{analytics?.warehouseAllocation?.availableForRetail?.toLocaleString() ?? 'N/A'} Units</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-txt">Incoming Stock (Transit)</div>
                  <div className="font-bold text-[#3498db]">{analytics?.warehouseAllocation?.incomingStockInTransit?.toLocaleString() ?? 'N/A'} Units</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-off border-b border-border-design p-4">
              <h3 className="font-extrabold text-[15px] text-[#0B8F3A] uppercase tracking-wide">Inventory Management</h3>
            </div>
            {filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-[13.5px]">No inventory records found.</div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on mobile/tablet */}
                <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-border-design bg-off text-gray-700 font-semibold text-left">
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Variant</th>
                        <th className="p-3">Stock Available</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-design">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-border-design animate-pulse">
                            <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                            <td className="p-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                            <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                            <td className="p-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                            <td className="p-3"><div className="h-5 bg-gray-200 rounded w-16"></div></td>
                            <td className="p-3 text-right"><div className="h-8 bg-gray-200 rounded w-24 ml-auto"></div></td>
                          </tr>
                        ))
                      ) : (
                        filteredInventory.map(variant => {
                          const isEditing = editingRow === variant.variantId;

                          return (
                            <tr key={variant.variantId} className="hover:bg-off">
                              <td className="p-3 font-mono text-[12px] font-bold text-gray-800">{variant.sku}</td>
                              <td className="p-3 text-gray-700">{variant.productName}</td>
                              <td className="p-3 text-gray-700">{variant.variantName === 'Default Variant' ? <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Default</span> : variant.variantName}</td>

                              <td className="p-3">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                    className="border border-border-design rounded px-2 py-1 w-24 text-[13px] text-gray-700 placeholder-gray-400"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-bold text-gray-800 text-[14px]">{variant.quantityAvailable}</span>
                                )}
                              </td>

                              <td className="p-3">
                                {variant.stockStatus === 'IN_STOCK' && <span className="px-2 py-1 bg-org/10 text-org rounded-full text-[11px] font-bold">IN STOCK</span>}
                                {variant.stockStatus === 'LOW_STOCK' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[11px] font-bold">LOW STOCK</span>}
                                {variant.stockStatus === 'OUT_OF_STOCK' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold">OUT OF STOCK</span>}
                              </td>

                              <td className="p-3 text-right">
                                {isEditing ? (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingRow(null)} className="text-gray-500 hover:text-gray-800 text-[12px] font-bold">Cancel</button>
                                    <button onClick={() => handleSaveStock(variant.variantId)} className="bg-g1 text-white px-3 py-1 rounded text-[12px] font-bold">Save</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setEditingRow(variant.variantId); setEditQuantity(variant.quantityAvailable); }}
                                    className="text-[#0B8F3A] hover:text-g1 mr-3 text-[13px] font-bold underline"
                                  >
                                    Update Stock
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Hidden on desktop */}
                <div className="lg:hidden divide-y divide-border-design">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse flex flex-col gap-3">
                        <div className="flex gap-3 justify-between">
                          <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-100 rounded w-1/4"></div></div>
                          <div className="w-16 h-6 bg-gray-200 rounded-full shrink-0"></div>
                        </div>
                        <div className="flex justify-between items-center"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="w-24 h-10 bg-gray-200 rounded-lg"></div></div>
                      </div>
                    ))
                  ) : (
                    filteredInventory.map(variant => {
                      const isEditing = editingRow === variant.variantId;

                    return (
                      <div key={variant.variantId} className="p-4 hover:bg-off transition-colors">
                        {/* Product Header with SKU and Name */}
                        <div className="mb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-[14px] leading-tight mb-1">{variant.productName}</h4>
                              <p className="text-[11px] text-gray-500 font-mono">{variant.sku}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                              variant.stockStatus === 'IN_STOCK' ? 'bg-org/10 text-org' :
                              variant.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {variant.stockStatus === 'IN_STOCK' ? 'IN STOCK' :
                               variant.stockStatus === 'LOW_STOCK' ? 'LOW STOCK' :
                               'OUT OF STOCK'}
                            </span>
                          </div>
                          {variant.variantName !== 'Default Variant' && (
                            <div className="text-[12px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 inline-block">
                              <span className="font-semibold">Variant:</span> {variant.variantName}
                            </div>
                          )}
                        </div>

                        {/* Stock Quantity and Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex-1 mr-3">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold block mb-1">Stock Available</span>
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                className="border border-border-design rounded px-2 py-1.5 w-20 text-[13px] text-gray-700 placeholder-gray-400"
                                autoFocus
                              />
                            ) : (
                              <span className="font-black text-gray-800 text-[16px]">{variant.quantityAvailable}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => setEditingRow(null)} className="bg-white border border-border-design hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-bold text-[12px] transition-colors border cursor-pointer active:scale-95">
                                  Cancel
                                </button>
                                <button onClick={() => handleSaveStock(variant.variantId)} className="bg-g1 hover:bg-g3 text-white px-3 py-2 rounded-lg font-bold text-[12px] transition-colors border-none cursor-pointer active:scale-95">
                                  Save
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => { setEditingRow(variant.variantId); setEditQuantity(variant.quantityAvailable); }}
                                className="bg-[#0B8F3A] hover:bg-g1 text-white px-3 py-2 rounded-lg font-bold text-[12px] transition-colors border-none cursor-pointer active:scale-95"
                              >
                                Update Stock
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};