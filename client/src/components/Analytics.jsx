import React, { useMemo, useState } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  PieChart
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useBatchSummary } from '../hooks/useBatchSummary';
import { calculatePercentageChange, formatPercentage } from '../utils/percentageCalculator';

export const Analytics = ({ onOpenProductsView, onEditProduct, onNavigateToSalesHistory }) => {
  const { products, stockMovements, getLowStockProducts, getTotalValue } = useProducts();
  const toNumber = (value) => Number(value ?? 0);
  const batchSummaryByProduct = useBatchSummary(
    useMemo(() => products.map((product) => product.id), [products])
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTotalProfit = () => {
    return products.reduce((total, product) => {
      const effectiveStock = Number(batchSummaryByProduct[product.id]?.totalQuantity ?? 0);
      return total + (effectiveStock * (toNumber(product.price) - toNumber(product.cost)));
    }, 0);
  };

  const effectiveStockByProductId = useMemo(() => {
    return Object.fromEntries(products.map((product) => [String(product.id), Number(batchSummaryByProduct[product.id]?.totalQuantity ?? 0)]));
  }, [batchSummaryByProduct, products]);

  const totalProfit = getTotalProfit();

  const getMonthKey = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getPreviousMonthKey = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
  };

  const getMetricsForPeriod = (movements, monthKey) => {
    const filteredMovements = monthKey === 'all' 
      ? movements 
      : movements.filter(m => getMonthKey(m.date) === monthKey);

    const salesMovements = filteredMovements.filter(m => m.type === 'out' && m.reason === 'Sale');
    const damageMovements = filteredMovements.filter(m => m.type === 'out' && (m.reason === 'Damage' || m.reason === 'Loss'));

    const totalSalesQty = salesMovements.reduce((sum, m) => sum + m.quantity, 0);
    const totalSalesVal = salesMovements.reduce((sum, m) => {
      const product = products.find(p => p.id === m.productId);
      return sum + (m.quantity * toNumber(product?.price));
    }, 0);

    const totalSalesProfit = salesMovements.reduce((sum, m) => {
      const product = products.find(p => p.id === m.productId);
      const unitProfit = toNumber(product?.price) - toNumber(product?.cost);
      return sum + (m.quantity * unitProfit);
    }, 0);

    const totalDamageQty = damageMovements.reduce((sum, m) => sum + m.quantity, 0);

    return {
      salesQty: totalSalesQty,
      salesValue: totalSalesVal,
      salesProfit: totalSalesProfit,
      damageQty: totalDamageQty
    };
  };

  const getPercentageChangeForMetric = (currentMonth, previousMonth, metricKey) => {
    const currentMetrics = getMetricsForPeriod(stockMovements, currentMonth);
    const previousMetrics = getMetricsForPeriod(stockMovements, previousMonth);
    
    const currentValue = currentMetrics[metricKey] || 0;
    const previousValue = previousMetrics[metricKey] || 0;
    
    return formatPercentage(calculatePercentageChange(currentValue, previousValue));
  };

  const monthOptions = useMemo(() => {
    const monthMap = new Map();

    stockMovements.forEach((movement) => {
      const key = getMonthKey(movement.date);
      if (!key || monthMap.has(key)) return;

      const [year, month] = key.split('-').map(Number);
      const labelDate = new Date(year, month - 1, 1);
      monthMap.set(key, {
        value: key,
        label: labelDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      });
    });

    return [...monthMap.values()].sort((a, b) => b.value.localeCompare(a.value));
  }, [stockMovements]);

  const [selectedMonth, setSelectedMonth] = useState('all');

  // Calculate percentage change for selected month vs previous month
  const previousMonth = selectedMonth === 'all' ? 'all' : getPreviousMonthKey(selectedMonth);
  
  const salesValuePercentage = selectedMonth === 'all' 
    ? '+0%' 
    : getPercentageChangeForMetric(selectedMonth, previousMonth, 'salesValue');
  
  const salesQtyPercentage = selectedMonth === 'all' 
    ? '+0%' 
    : getPercentageChangeForMetric(selectedMonth, previousMonth, 'salesQty');
  
  const salesProfitPercentage = selectedMonth === 'all' 
    ? '+0%' 
    : getPercentageChangeForMetric(selectedMonth, previousMonth, 'salesProfit');
  
  const damageQtyPercentage = selectedMonth === 'all' 
    ? '+0%' 
    : getPercentageChangeForMetric(selectedMonth, previousMonth, 'damageQty');

  const selectedStockMovements = selectedMonth === 'all'
    ? stockMovements
    : stockMovements.filter((movement) => getMonthKey(movement.date) === selectedMonth);

  const salesMovements = selectedStockMovements.filter(m => m.type === 'out' && m.reason === 'Sale');
  const damageMovements = selectedStockMovements.filter(m => m.type === 'out' && (m.reason === 'Damage' || m.reason === 'Loss'));

  const totalSalesQuantity = salesMovements.reduce((sum, m) => sum + m.quantity, 0);
  const totalSalesValue = salesMovements.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    return sum + (m.quantity * (product?.price || 0));
  }, 0);

  const totalSalesProfit = salesMovements.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    const unitProfit = (product?.price || 0) - (product?.cost || 0);
    return sum + (m.quantity * unitProfit);
  }, 0);

  const totalDamageQuantity = damageMovements.reduce((sum, m) => sum + m.quantity, 0);
  const totalLossValue = damageMovements.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    return sum + (m.quantity * (product?.cost || 0));
  }, 0);

  const netRealizedProfit = totalSalesProfit - totalLossValue;
  const averageSaleValue = totalSalesQuantity > 0 ? totalSalesValue / totalSalesQuantity : 0;
  const inventoryUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const sellThroughRate = inventoryUnits > 0 ? (totalSalesQuantity / (inventoryUnits + totalSalesQuantity)) * 100 : 0;
  const averageMargin = (() => {
    const margins = products
      .map((p) => {
        const price = Number(p.price ?? 0);
        const cost = Number(p.cost ?? 0);
        if (!Number.isFinite(price) || price <= 0) return null;
        return ((price - cost) / price) * 100;
      })
      .filter((m) => Number.isFinite(m));

    if (margins.length === 0) return '0';
    const avg = margins.reduce((s, m) => s + m, 0) / margins.length;
    return avg.toFixed(1);
  })();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'stock':
          return b.stock - a.stock;
        case 'value':
          return (b.stock * b.price) - (a.stock * a.price);
        case 'lastUpdated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const lowStockProducts = getLowStockProducts();
  const totalValue = getTotalValue();
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const openProductsView = (kind, label, sortBy = 'name') => {
    if (!onOpenProductsView) return;
    onOpenProductsView({ kind, label, sortBy });
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Out of Stock' };
    if (product.stock <= product.minStock) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Low Stock' };
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'In Stock' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50 pb-2">Analytics & Reports</h1>
        <div className="flex  items-center space-x-3">
          <div>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">All Time</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-200 whitespace-nowrap">
            <Calendar className="h-4 w-4 inline mr-1 dark:text-slate-200" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => openProductsView('all', 'All Products')}
          className="card p-4 border-l-4 border-blue-500 dark:border-l-blue-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >   
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Products</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{products.length}</p>
              
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('all', 'Products by Stock Value', 'value')}
          className="card p-4 border-l-4 border-green-500 dark:border-l-green-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Stock Value</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalValue.toLocaleString()}</p>
              
            </div>
            <div className="bg-green-500 p-3 rounded-lg flex items-center justify-center font-bold">
              ₨
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('lowStock', 'Low Stock Products')}
          className="card p-4 border-l-4 border-orange-500 dark:border-l-orange-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Low Stock Items</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{lowStockProducts.length}</p>
              
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('outOfStock', 'Out of Stock Products')}
          className="card p-4 border-l-4 border-red-500 dark:border-l-red-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Out of Stock</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{outOfStockProducts.length}</p>
              
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('profitable', 'Profitable Products')}
          className="card p-4 border-l-4 border-purple-500 dark:border-l-purple-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Profit</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalProfit.toLocaleString()}</p>
              
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'Products With Sales')}
          className="card p-4 border-l-4 border-indigo-500 dark:border-l-indigo-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Sales Qty</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{totalSalesQuantity}</p>
              
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'Products With Sales', 'value')}
          className="card p-4 border-l-4 border-yellow-500 dark:border-l-yellow-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Sales Value</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalSalesValue.toLocaleString()}</p>
              
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg flex items-center justify-center font-bold">
              ₨
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'Products Contributing to Net Profit')}
          className="card p-4 border-l-4 border-emerald-500 dark:border-l-emerald-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Net Realized Profit</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {netRealizedProfit.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('damaged', 'Damaged/Lost Products')}
          className="card p-4 border-l-4 border-rose-500 dark:border-l-rose-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Damage/Loss Value</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalLossValue.toLocaleString()}</p>
            </div>
            <div className="bg-rose-500 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'Products With Sales', 'value')}
          className="card p-4 border-l-4 border-cyan-500 dark:border-l-cyan-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Avg Sale Value / Unit</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {averageSaleValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-cyan-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'Sell-through Products')}
          className="card p-4 border-l-4 border-slate-500 dark:border-l-slate-500 text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Sell-through Rate</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{sellThroughRate.toFixed(1)}</p>
            </div>
            <div className="bg-slate-500 p-3 rounded-lg">
              <PieChart className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('damaged', 'Damaged/Lost Products')}
          className="card p-4 border-l-4 border-red-400 dark:border-l-red-400  text-left hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Damage/Loss Qty</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{totalDamageQuantity}</p>
              
            </div>
            <div className="bg-red-400 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>
      </div>

      {/* Reports Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales History */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Sales History</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400">{salesMovements.length} transactions</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {salesMovements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sales recorded yet</p>
            ) : (
              salesMovements.map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                const saleValue = product ? movement.quantity * toNumber(product.price) : 0;
                const saleProfit = product ? movement.quantity * (toNumber(product.price) - toNumber(product.cost)) : 0;
                return (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={() => onNavigateToSalesHistory?.()}
                    className="w-full flex items-center justify-between px-2.5 py-3 bg-blue-50 dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-600  hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-50">{product?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{formatDate(movement.date)} - {movement.reference || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600 dark:text-blue-400">- {movement.quantity} units</p>
                      <p className="text-sm text-gray-500 dark:text-slate-300">Value: ₨ {saleValue.toLocaleString()}</p>
                      <p className={`text-xs font-medium ${saleProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        Profit: ₨ {saleProfit.toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Damage/Loss Report */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Damage & Loss Report</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400">{damageMovements.length} incidents</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {damageMovements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No damage or loss recorded</p>
            ) : (
              damageMovements.map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                const lossValue = movement.quantity * (product?.cost || 0);
                return (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={() => onEditProduct?.(product)}
                    className="w-full flex items-center justify-between px-2.5 py-5 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-600 hover:bg-red-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-50">{product?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-200">{movement.reason} - {formatDate(movement.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">- {movement.quantity} units</p>
                      <p className="text-sm text-gray-500 dark:text-slate-300">Loss: ₨ {lossValue.toLocaleString()}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <PieChart className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Profit Breakdown</h2>
          </div>
          <span className="text-sm text-gray-500">Unrealized profit in current stock</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-green-200 dark:bg-green-600 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">Total Potential Profit</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">₨ {totalProfit.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">Based on current stock levels</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">Average Margin</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{averageMargin}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">Across all products</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-200 dark:bg-yellow-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">High Margin Products</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{products.filter(p => ((p.price - p.cost) / p.price * 100) > 30).length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">Products with 30% margin</p>
            </div>
            <div className="bg-red-200 dark:bg-red-600 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">Low Margin Products</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-300">{products.filter(p => ((p.price - p.cost) / p.price * 100) < 15).length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">Products with 15% margin</p>
            </div>
          </div>
        </div>
      </div>

 
      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card p-4 border-l-4 border-orange-500 dark:border-l-orange-500">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">Low Stock Alert</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onEditProduct?.(product)}
                className="p-4 bg-orange-50 dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-gray-600 hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-slate-50">{product.name}</h3>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                    {product.sku}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-300">
                  <span>Current: {product.stock}</span>
                  <span>Min: {product.minStock}</span>
                </div>
                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                  Reorder: {Math.max(product.minStock * 2 - product.stock, 0)} units recommended
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
