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
import { useLanguage } from '../hooks/useLanguage';
import { calculatePercentageChange, formatPercentage } from '../utils/percentageCalculator';

export const Analytics = ({ onOpenProductsView, onEditProduct, onNavigateToSalesHistory }) => {
  const { products, stockMovements, getLowStockProducts, getTotalValue } = useProducts();
  const { t, td, tEnum, language } = useLanguage();
  const toNumber = (value) => Number(value ?? 0);
  const batchSummaryByProduct = useBatchSummary(
    useMemo(() => products.map((product) => product.id), [products])
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
        label: labelDate.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB', { month: 'long', year: 'numeric' }),
      });
    });

    return [...monthMap.values()].sort((a, b) => b.value.localeCompare(a.value));
  }, [stockMovements, language]);

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

  const openProductsView = (kind, labelKey, sortBy = 'name') => {
    if (!onOpenProductsView) return;
    onOpenProductsView({ kind, labelKey, sortBy });
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', label: t('products.outOfStock') };
    if (product.stock <= product.minStock) return { color: 'text-orange-600', bg: 'bg-orange-100', label: t('products.lowStock') };
    return { color: 'text-green-600', bg: 'bg-green-100', label: t('products.inStock') };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50 pb-2">{t('analytics.title')}</h1>
        <div className="flex  items-center space-x-3">
          <div>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">{t('analytics.allTime')}</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-200 whitespace-nowrap">
            <Calendar className="h-4 w-4 inline ltr:mr-1 rtl:ml-1 dark:text-slate-200" />
            {t('analytics.lastUpdated', { date: new Date().toLocaleDateString() })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => openProductsView('all', 'presets.allProducts')}
          className="card accent-bar p-4 border-l-4 border-blue-500 dark:border-l-blue-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >   
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.totalProducts')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{products.length}</p>
              
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('all', 'presets.byStockValue', 'value')}
          className="card accent-bar p-4 border-l-4 border-green-500 dark:border-l-green-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.totalStockValue')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalValue.toLocaleString()}</p>
              
            </div>
            <div className="bg-green-500 p-3 rounded-lg flex items-center justify-center font-bold">
              ₨
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('lowStock', 'presets.lowStock')}
          className="card accent-bar p-4 border-l-4 border-orange-500 dark:border-l-orange-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.lowStockItems')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{lowStockProducts.length}</p>
              
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('outOfStock', 'presets.outOfStock')}
          className="card accent-bar p-4 border-l-4 border-red-500 dark:border-l-red-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.outOfStock')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{outOfStockProducts.length}</p>
              
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('profitable', 'presets.profitable')}
          className="card accent-bar p-4 border-l-4 border-purple-500 dark:border-l-purple-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.totalProfit')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalProfit.toLocaleString()}</p>
              
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'presets.withSales')}
          className="card accent-bar p-4 border-l-4 border-indigo-500 dark:border-l-indigo-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.totalSalesQty')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">{totalSalesQuantity}</p>
              
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'presets.withSales', 'value')}
          className="card accent-bar p-4 border-l-4 border-yellow-500 dark:border-l-yellow-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.salesValue')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {totalSalesValue.toLocaleString()}</p>
              
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg flex items-center justify-center font-bold">
              ₨
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'presets.netProfit')}
          className="card accent-bar p-4 border-l-4 border-emerald-500 dark:border-l-emerald-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.netRealizedProfit')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {netRealizedProfit.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('damaged', 'presets.damaged')}
          className="card accent-bar p-4 border-l-4 border-rose-500 dark:border-l-rose-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.damageLossValue')}</p>
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
          className="card accent-bar p-4 border-l-4 border-cyan-500 dark:border-l-cyan-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.avgSaleValue')}</p>
              <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50">₨ {averageSaleValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-cyan-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openProductsView('sold', 'presets.sellThrough')}
          className="card accent-bar p-4 border-l-4 border-slate-500 dark:border-l-slate-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.sellThroughRate')}</p>
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
          className="card accent-bar p-4 border-l-4 border-red-400 dark:border-l-red-400  text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{t('analytics.damageLossQty')}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">{t('analytics.salesHistory')}</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400">{t('analytics.transactionsCount', { count: salesMovements.length })}</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {salesMovements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('analytics.noSales')}</p>
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
                    className="w-full flex items-center justify-between px-2.5 py-3 bg-blue-50 dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-600  hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors text-start"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-50">{td(product?.name)}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{formatDate(movement.date)} - {movement.reference || t('common.na')}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-blue-600 dark:text-blue-400">{t('analytics.unitsOut', { count: movement.quantity })}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-300">{t('analytics.valueLine', { amount: saleValue.toLocaleString() })}</p>
                      <p className={`text-xs font-medium ${saleProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t('analytics.profitLine', { amount: saleProfit.toLocaleString() })}
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">{t('analytics.damageReport')}</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400">{t('analytics.incidentsCount', { count: damageMovements.length })}</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {damageMovements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('analytics.noDamage')}</p>
            ) : (
              damageMovements.map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                const lossValue = movement.quantity * (product?.cost || 0);
                return (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={() => onEditProduct?.(product)}
                    className="w-full flex items-center justify-between px-2.5 py-5 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-600 hover:bg-red-100 dark:hover:bg-gray-800 transition-colors text-start"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-50">{td(product?.name)}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-200">{tEnum('reasons', movement.reason)} - {formatDate(movement.date)}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-red-600 dark:text-red-400">{t('analytics.unitsOut', { count: movement.quantity })}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-300">{t('analytics.lossLine', { amount: lossValue.toLocaleString() })}</p>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">{t('analytics.profitBreakdown')}</h2>
          </div>
          <span className="text-sm text-gray-500">{t('analytics.unrealizedProfit')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-green-200 dark:bg-green-600 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">{t('analytics.totalPotentialProfit')}</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">₨ {totalProfit.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">{t('analytics.basedOnStock')}</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">{t('analytics.averageMargin')}</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{averageMargin}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">{t('analytics.acrossAllProducts')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-200 dark:bg-yellow-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">{t('analytics.highMarginProducts')}</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{products.filter(p => ((p.price - p.cost) / p.price * 100) > 30).length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">{t('analytics.highMarginNote')}</p>
            </div>
            <div className="bg-red-200 dark:bg-red-600 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-50">{t('analytics.lowMarginProducts')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-300">{products.filter(p => ((p.price - p.cost) / p.price * 100) < 15).length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-50">{t('analytics.lowMarginNote')}</p>
            </div>
          </div>
        </div>
      </div>

 
      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card accent-bar p-4 border-l-4 border-orange-500 dark:border-l-orange-500">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{t('analytics.lowStockAlert')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onEditProduct?.(product)}
                className="p-4 bg-orange-50 dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-gray-600 hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors text-start"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-slate-50">{td(product.name)}</h3>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full force-ltr">
                    {product.sku}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-300">
                  <span>{t('analytics.current', { count: product.stock })}</span>
                  <span>{t('analytics.min', { count: product.minStock })}</span>
                </div>
                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                  {t('analytics.reorder', { count: Math.max(product.minStock * 2 - product.stock, 0) })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
