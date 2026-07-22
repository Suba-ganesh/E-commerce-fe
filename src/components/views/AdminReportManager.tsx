import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { KPIData, RevenueTrend, ProductPerformance, InventoryHealth, CustomerAnalytics, WholesaleAnalytics, VelocityMatrix } from '../../services/analyticsService';
import { analyticsService } from '../../services/analyticsService';

export const AdminReportManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [wholesaleAnalytics, setWholesaleAnalytics] = useState<WholesaleAnalytics | null>(null);
  const [velocityMatrix, setVelocityMatrix] = useState<VelocityMatrix | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [distributorFilter, setDistributorFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [kpiRes, trendsRes, productsRes, inventoryRes, customerRes, wholesaleRes, velocityRes] = await Promise.all([
        analyticsService.getKPIDashboard(),
        analyticsService.getRevenueTrends(6),
        analyticsService.getProductPerformance(10),
        analyticsService.getInventoryHealth(),
        analyticsService.getCustomerAnalytics(),
        analyticsService.getWholesaleAnalytics(),
        analyticsService.getVelocityMatrix(),
      ]);

      if (kpiRes.success) setKpiData(kpiRes.data);
      if (trendsRes.success) setRevenueTrends(trendsRes.data);
      if (productsRes.success) setProductPerformance(productsRes.data);
      if (inventoryRes.success) setInventoryHealth(inventoryRes.data);
      if (customerRes.success) setCustomerAnalytics(customerRes.data);
      if (wholesaleRes.success) setWholesaleAnalytics(wholesaleRes.data);
      if (velocityRes.success) setVelocityMatrix(velocityRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (categoryFilter !== 'all') filters.categoryId = categoryFilter;
      if (customerTypeFilter !== 'all') filters.customerType = customerTypeFilter;
      if (distributorFilter !== 'all') filters.distributorId = distributorFilter;
      if (productSearch) filters.productSearch = productSearch;

      const response = await analyticsService.getFilteredAnalytics(filters);
      if (response.success) {
        // Update relevant data with filtered results
        const filteredData = response.data;
        // You can update specific sections with filtered data
        console.log('Filtered analytics:', filteredData);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `RM ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `RM ${(value / 1000).toFixed(0)}K`;
    }
    return `RM ${value.toFixed(2)}`;
  };

  if (loading && !kpiData) {
    return (
      <div className="flex flex-col gap-6 w-full text-left">
        <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
          <h2 className="text-[28px] font-extrabold text-g3 m-0">Reports & Analytics</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        <h2 className="text-[22px] lg:text-[28px] font-extrabold text-g3 m-0">Reports & Analytics</h2>
        <div className="flex gap-2 lg:gap-3 flex-wrap">
          <button 
            onClick={() => window.print()}
            className="px-3 lg:px-4 py-2 lg:py-2.5 bg-transparent border border-border-design text-g3 rounded-lg font-bold cursor-pointer hover:bg-off transition text-[12px] lg:text-[13px]"
          >
            Export PDF
          </button>
          <button 
            onClick={() => window.print()}
            className="px-3 lg:px-4 py-2 lg:py-2.5 bg-transparent border border-border-design text-g3 rounded-lg font-bold cursor-pointer hover:bg-off transition text-[12px] lg:text-[13px]"
          >
            Export Excel
          </button>
          <button 
            onClick={() => window.print()}
            className="px-3 lg:px-4 py-2 lg:py-2.5 bg-g1 border-none text-white rounded-lg font-bold cursor-pointer hover:bg-g3 transition shadow-sm text-[12px] lg:text-[13px]"
          >
            Print Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border-design rounded-xl p-3 lg:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-3 lg:gap-4 items-start lg:items-center">
        <div className="font-extrabold text-g3 text-[12px] lg:text-[14px] mb-2 lg:mb-0">FILTERS:</div>
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full lg:w-auto">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-border-design rounded-lg outline-none cursor-pointer font-inherit text-[12px] lg:text-[13px] text-gray-700 bg-white" 
          />
          <span className="text-muted font-bold text-[12px] lg:text-[13px]">to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-border-design rounded-lg outline-none cursor-pointer font-inherit text-[12px] lg:text-[13px] text-gray-700 bg-white" 
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full lg:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-border-design rounded-lg outline-none cursor-pointer bg-white text-[12px] lg:text-[13px] text-gray-700 font-medium"
          >
            <option value="all">All Categories</option>
            <option value="food">Food & Grocery</option>
            <option value="cosmetics">Cosmetics</option>
            <option value="construction">Construction Materials</option>
          </select>

          <select 
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-border-design rounded-lg outline-none cursor-pointer bg-white text-[12px] lg:text-[13px] text-gray-700 font-medium"
          >
            <option value="all">All Customer Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>

          <select 
            value={distributorFilter}
            onChange={(e) => setDistributorFilter(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-border-design rounded-lg outline-none cursor-pointer bg-white text-[12px] lg:text-[13px] text-gray-700 font-medium"
          >
            <option value="all">All Distributors</option>
            {/* Add distributor options dynamically */}
          </select>

          <input 
            type="text" 
            placeholder="Search Product..." 
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-border-design rounded-lg outline-none cursor-pointer font-inherit text-[12px] lg:text-[13px] text-gray-700 bg-white"
          />

          <button 
            onClick={handleApplyFilters}
            className="px-4 lg:px-6 py-2 bg-g1 text-white rounded-lg font-bold cursor-pointer hover:bg-g3 transition text-[12px] lg:text-[13px]"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Executive KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Total Revenue</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-g1/10 rounded-lg flex items-center justify-center text-g1">
              <i className="fa-solid fa-dollar-sign text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? formatCompact(kpiData.totalRevenue) : 'RM 0'}
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Monthly Revenue</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-calendar text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? formatCompact(kpiData.monthlyRevenue) : 'RM 0'}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Total Orders</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
              <i className="fa-solid fa-cart-shopping text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? kpiData.totalOrders.toLocaleString() : '0'}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Avg Order Value</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
              <i className="fa-solid fa-receipt text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? formatCurrency(kpiData.averageOrderValue) : 'RM 0.00'}
          </div>
          <div className="text-[10px] lg:text-sm font-semibold text-red-600">
            ↓ 1.2% vs Last Month
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Total Customers</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <i className="fa-solid fa-users text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? kpiData.totalCustomers.toLocaleString() : '0'}
          </div>
          <div className="text-[10px] lg:text-sm font-semibold text-green-600">
            ↑ 240 New This Month
          </div>
        </div>

        {/* Wholesale Buyers */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Wholesale Buyers</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
              <i className="fa-solid fa-building text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? kpiData.wholesaleBuyers.toLocaleString() : '0'}
          </div>
          <div className="text-[10px] lg:text-sm font-semibold text-muted">
            Steady
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-muted uppercase tracking-wide">Inventory Value</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
              <i className="fa-solid fa-warehouse text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold text-g3 mb-1 lg:mb-2">
            {kpiData ? formatCompact(kpiData.inventoryValue) : 'RM 0'}
          </div>
          <div className="text-[10px] lg:text-sm font-semibold text-yellow-600">
            Optimized
          </div>
        </div>

        {/* Overall Growth */}
        <div className="bg-g1 rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-white">
          <div className="flex justify-between items-start mb-2 lg:mb-4">
            <div className="text-[10px] lg:text-sm font-bold text-white/80 uppercase tracking-wide">Overall Growth</div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-arrow-trend-up text-[12px] lg:text-[14px]"></i>
            </div>
          </div>
          <div className="text-[20px] lg:text-[32px] font-extrabold mb-1 lg:mb-2">
            +{kpiData ? kpiData.overallGrowth.toFixed(1) : '0.0'}%
          </div>
          <div className="text-[10px] lg:text-sm font-semibold text-white/80">
            Projected Q4
          </div>
        </div>
      </div>

      {/* Sales Analytics - Revenue Trends */}
      <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <h3 className="text-[16px] lg:text-[18px] font-extrabold text-g3 mb-4 lg:mb-6">Sales Analytics</h3>
        
        {/* Revenue Chart */}
        <div className="mb-6 lg:mb-8">
          <h4 className="text-[12px] lg:text-sm font-bold text-muted mb-3 lg:mb-4">Monthly Revenue Trends (6 Months)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => formatCompact(value)}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="revenue" fill="#27ae60" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Velocity Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-border-design rounded-xl p-6">
            <h4 className="text-sm font-bold text-g3 mb-4">Velocity Matrix</h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted mb-1">Daily Sales Average</div>
                <div className="text-2xl font-extrabold text-g3">
                  {velocityMatrix ? formatCurrency(velocityMatrix.dailySalesAverage) : 'RM 0'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Weekly Sales Average</div>
                <div className="text-2xl font-extrabold text-g3">
                  {velocityMatrix ? formatCurrency(velocityMatrix.weeklySalesAverage) : 'RM 0'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Conversion Rate</div>
                <div className="text-2xl font-extrabold text-g3">
                  {velocityMatrix ? `${velocityMatrix.conversionRate}%` : '0%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance & Inventory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Product Performance */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-[16px] lg:text-[18px] font-extrabold text-g3 mb-4 lg:mb-6">Product Performance</h3>
          <div className="space-y-3 lg:space-y-4">
            {productPerformance.map((product, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1 lg:mb-2">
                  <div className="text-[12px] lg:text-sm font-semibold text-g3 flex-1">
                    {index + 1}. {product.productName}
                  </div>
                  <div className="text-[12px] lg:text-sm font-bold text-g3 ml-2 lg:ml-4">
                    {product.unitsSold.toLocaleString()} Units
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 lg:h-2 overflow-hidden">
                  <div 
                    className="bg-g1 h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((product.unitsSold / (productPerformance[0]?.unitsSold || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {productPerformance.length > 0 && (
            <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-border-design">
              <div className="text-[11px] lg:text-sm font-bold text-muted mb-2">WORST PERFORMING</div>
              {productPerformance.length > 5 && (
                <div className="flex justify-between items-center">
                  <div className="text-[11px] lg:text-sm font-semibold text-g3">
                    {productPerformance[productPerformance.length - 1].productName}
                  </div>
                  <div className="text-[11px] lg:text-sm font-bold text-red-600">
                    {productPerformance[productPerformance.length - 1].unitsSold} Units
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inventory Health Reports */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-[16px] lg:text-[18px] font-extrabold text-g3 mb-4 lg:mb-6">Inventory Health Reports</h3>
          <div className="space-y-3 lg:space-y-4">
            {/* Fast Moving */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 lg:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[11px] lg:text-sm font-bold text-green-700">Fast Moving Stock</div>
                  <div className="text-[10px] lg:text-xs text-green-600 mt-0.5 lg:mt-1">Items turning over less than 14 days</div>
                </div>
                <div className="text-xl lg:text-2xl font-extrabold text-green-700">
                  {inventoryHealth ? `${inventoryHealth.fastMoving.percentage}%` : '0%'}
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 lg:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[11px] lg:text-sm font-bold text-red-700">Low Stock Alerts</div>
                  <div className="text-[10px] lg:text-xs text-red-600 mt-0.5 lg:mt-1">Items requiring immediate PO</div>
                </div>
                <div className="text-xl lg:text-2xl font-extrabold text-red-700">
                  {inventoryHealth ? inventoryHealth.lowStock.count : 0}
                </div>
              </div>
            </div>

            {/* Slow Moving */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 lg:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[11px] lg:text-sm font-bold text-yellow-700">Slow Moving Stock</div>
                  <div className="text-[10px] lg:text-xs text-yellow-600 mt-0.5 lg:mt-1">Items in warehouse greater than 90 days</div>
                </div>
                <div className="text-xl lg:text-2xl font-extrabold text-yellow-700">
                  {inventoryHealth ? `${inventoryHealth.slowMoving.percentage}%` : '0%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Analytics & Wholesale & Regional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Customer Analytics */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-[16px] lg:text-[18px] font-extrabold text-g3 mb-4 lg:mb-6">Customer Analytics</h3>
          
          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <div className="border border-border-design rounded-xl p-3 lg:p-4 text-center">
              <div className="text-2xl lg:text-3xl font-extrabold text-g3 mb-0.5 lg:mb-1">
                {customerAnalytics ? `${customerAnalytics.returningPercentage}%` : '0%'}
              </div>
              <div className="text-[10px] lg:text-xs font-semibold text-muted uppercase">Returning</div>
            </div>
            <div className="border border-border-design rounded-xl p-3 lg:p-4 text-center">
              <div className="text-2xl lg:text-3xl font-extrabold text-g3 mb-0.5 lg:mb-1">
                {customerAnalytics ? `${customerAnalytics.newPercentage}%` : '0%'}
              </div>
              <div className="text-[10px] lg:text-xs font-semibold text-muted uppercase">New</div>
            </div>
          </div>

          {/* Customer Type Pie Chart */}
          {customerAnalytics && (
            <div className="mb-4 lg:mb-6">
              <h4 className="text-[12px] lg:text-sm font-bold text-muted mb-3 lg:mb-4">Customer Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Returning', value: customerAnalytics.returningPercentage, color: '#27ae60' },
                      { name: 'New', value: customerAnalytics.newPercentage, color: '#3498db' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Returning', value: customerAnalytics.returningPercentage, color: '#27ae60' },
                      { name: 'New', value: customerAnalytics.newPercentage, color: '#3498db' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2 lg:space-y-3">
            <div className="text-[11px] lg:text-sm font-bold text-muted mb-2 lg:mb-3">CUSTOMER SEGMENTS BY SPEND</div>
            {customerAnalytics && Object.entries(customerAnalytics.segments).map(([key, segment]) => (
              <div key={key} className="flex justify-between items-center">
                <div className="text-[11px] lg:text-sm text-g3">{segment.range}</div>
                <div className="text-[11px] lg:text-sm font-bold text-g3">{segment.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wholesale & Regional */}
        <div className="bg-white border border-border-design rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-[16px] lg:text-[18px] font-extrabold text-g3 mb-4 lg:mb-6">Wholesale & Regional</h3>
          
          <div className="mb-4 lg:mb-6">
            <div className="text-[11px] lg:text-sm font-bold text-muted mb-2 lg:mb-3">TOP DISTRIBUTORS BY REVENUE</div>
            <div className="space-y-2">
              {wholesaleAnalytics?.topDistributors.map((distributor, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="text-[11px] lg:text-sm text-g3">
                    {index + 1}. {distributor.name}
                  </div>
                  <div className="text-[11px] lg:text-sm font-bold text-g3">
                    {formatCompact(distributor.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] lg:text-sm font-bold text-muted mb-2 lg:mb-3">REGIONAL SPLIT</div>
            <div className="space-y-2 lg:space-y-3">
              {wholesaleAnalytics?.regionalSplit.map((region, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[11px] lg:text-sm text-g3">{region.region}</div>
                    <div className="text-[11px] lg:text-sm font-bold text-g3">{region.percentage}%</div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 lg:h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${index === 0 ? 'bg-g1' : 'bg-yellow-500'}`}
                      style={{ width: `${region.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};