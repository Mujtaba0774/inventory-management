import React, { useMemo } from 'react';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useBatchSummary } from '../hooks/useBatchSummary';
import { useLanguage } from '../hooks/useLanguage';
import { calculatePercentageChange, formatPercentage } from '../utils/percentageCalculator';

export const Dashboard = ({ onEditProduct, onNavigateToSalesHistory }) => {
  const { products, stockMovements, getLowStockProducts, getTotalValue, getTopSellingProducts } = useProducts();
  const { t, td } = useLanguage();
  
  // Helper function to get sales for a date range
  const getSalesForDateRange = (startDate, endDate) => {
    return stockMovements.filter(m => {
      const movementDate = new Date(m.date);
      return m.type === 'out' && m.reason === 'Sale' && movementDate >= startDate && movementDate <= endDate;
    });
  };

  // Get current period (last 7 days) and previous period (7 days before that)
  const now = new Date();
  const current7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previous7DaysAgo = new Date(current7DaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

  const currentSales = getSalesForDateRange(current7DaysAgo, now);
  const previousSales = getSalesForDateRange(previous7DaysAgo, current7DaysAgo);

  const lowStockProducts = getLowStockProducts();
  const totalValue = getTotalValue();
  const topSellingProducts = useMemo(() => getTopSellingProducts(), [getTopSellingProducts]);
  const batchSummaryByProduct = useBatchSummary(
    useMemo(() => topSellingProducts.slice(0, 6).map((product) => product.id), [topSellingProducts])
  );

  const getEffectiveStock = (product) => {
    const batchSummary = batchSummaryByProduct[product.id];
    return Number(batchSummary?.totalQuantity ?? 0);
  };

  const dashboardLowStockProducts = useMemo(() => {
    return products.filter((product) => {
      const batchSummary = batchSummaryByProduct[product.id];
      const effectiveStock = Number(batchSummary?.totalQuantity ?? 0);
      return effectiveStock > 0 && effectiveStock <= product.minStock;
    });
  }, [batchSummaryByProduct, products]);
  
  const salesMovements = stockMovements.filter(m => m.type === 'out' && m.reason === 'Sale');
  const totalSalesValue = salesMovements.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    return sum + (m.quantity * (product?.price || 0));
  }, 0);
  const totalSalesQuantity = salesMovements.reduce((sum, m) => sum + m.quantity, 0);
  const recentSales = salesMovements.slice(0, 5);

  // Calculate current and previous sales values for percentage
  const currentSalesValue = currentSales.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    return sum + (m.quantity * (product?.price || 0));
  }, 0);

  const previousSalesValue = previousSales.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    return sum + (m.quantity * (product?.price || 0));
  }, 0);

  const currentSalesQty = currentSales.reduce((sum, m) => sum + m.quantity, 0);
  const previousSalesQty = previousSales.reduce((sum, m) => sum + m.quantity, 0);

  // Calculate percentage changes
  const salesValueChange = formatPercentage(calculatePercentageChange(currentSalesValue, previousSalesValue));
  const salesQtyChange = formatPercentage(calculatePercentageChange(currentSalesQty, previousSalesQty));
  const recentSalesChange = formatPercentage(calculatePercentageChange(recentSales.length, Math.max(1, previousSales.slice(0, 5).length)));

  const stats = [
    {
      title: t('dashboard.totalProducts'),
      value: products.length,
      icon: Package,
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      title: t('dashboard.totalInventoryValue'),
      value: `₨ ${totalValue.toLocaleString()}`,
      icon: ShoppingCart,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: t('dashboard.salesThisWeek'),
      value: `₨ ${currentSalesValue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-secondary-500 to-secondary-600',
    },
    {
      title: t('dashboard.totalSold'),
      value: totalSalesQuantity,
      icon: ShoppingCart,
      gradient: 'from-accent-500 to-accent-600',
    },
    {
      title: t('dashboard.lowStockAlerts'),
      value: dashboardLowStockProducts.length,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
    },
    {
      title: t('dashboard.recentSales'),
      value: recentSales.length,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
    }
  ];

  const getChangeColor = (positive) => {
    return positive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">{t('dashboard.title')}</h1>
          <p className="text-gray-500 dark:text-slate-200 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="text-end hidden lg:block">
          <p className="text-sm text-gray-500 dark:text-slate-200">{t('dashboard.lastUpdated')}</p>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const isPositive = stat.positive;
          const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;
          
          return (
            <div key={index} className="card accent-bar p-4 border-l-4 border-blue-500 dark:border-l-blue-500 text-start hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-200 mb-1">{stat.title}</p>
                  <p className="text-xl md:text-2xl  lg:text-3xl  font-bold text-gray-900 dark:text-slate-50 ">{stat.value}</p>
                </div>

                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-medium lg:mt-2  group-hover:shadow-lg transition-all`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="card-lg p-6  animate-slide-up dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center cursor-pointer justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">{t('dashboard.lowStockAlerts')}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-200 mt-1">{t('dashboard.itemsRequiringAttention')}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-white p-1.5 rounded-md bg-red-600" />
          </div>
          
          <div className="space-y-3">
            {dashboardLowStockProducts.length === 0 ? (
              <div className="empty-state dark:text-slate-200 ">
                <Package className="empty-state-icon dark:text-slate-500" />
                <p className="text-gray-500 dark:text-slate-200 ">{t('dashboard.noLowStock')}</p>
              </div>
            ) : (
              dashboardLowStockProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onEditProduct?.(product)}
                  className="w-full p-4 bg-gradient-to-r from-red-200 to-red-100 dark:from-red-800 dark:to-red-700 rounded-xl border border-red-200 dark:border-red-800 hover:from-red-100 hover:to-red-150 dark:hover:from-red-900 dark:hover:to-red-800 transition-all duration-200 text-start group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-slate-50 group-hover:text-red-700">
                        {td(product.name)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{t('common.sku')}: <span className="force-ltr">{product.sku}</span></p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 force-ltr">
                        {getEffectiveStock(product)} / {product.minStock}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-200">{t('dashboard.currentMin')}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card-lg p-6 animate-slide-up dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">{t('dashboard.recentSales')}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-200  mt-1">{t('dashboard.latestTransactions')}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="empty-state dark:text-slate-200 ">
                <ShoppingCart className="empty-state-icon dark:text-slate-500" />
                <p className="text-gray-500 dark:text-slate-200 ">{t('dashboard.noRecentSales')}</p>
              </div>
            ) : (
              recentSales.map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                const saleValue = movement.quantity * (product?.price || 0);
                return (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={() => onNavigateToSalesHistory?.()}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-800 hover:from-green-300 hover:to-green-200 dark:hover:from-green-900 dark:hover:to-green-800 transition-all duration-200 text-start group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-green-200 dark:bg-green-800 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-slate-50">{td(product?.name)}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-300 force-ltr">{movement.date}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-green-600 dark:text-green-400">{movement.quantity} {t('common.units')}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-300 force-ltr">₨ {saleValue.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="card-lg p-6 animate-slide-up dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">{t('dashboard.topSelling')}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-200  mt-1">{t('dashboard.bestSellers')}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-secondary-100 dark:bg-secondary-100 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-secondary-600 dark:text-secondary-700" />
          </div>
        </div>

        {topSellingProducts.length === 0 ? (
          <div className="empty-state dark:text-slate-200 ">
            <Package className="empty-state-icon dark:text-slate-500" />
            <p className="text-gray-500 dark:text-slate-200 ">{t('dashboard.noTopSelling')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSellingProducts.map((product, index) => {
              const effectiveStock = getEffectiveStock(product);
              const isLowStock = effectiveStock > 0 && effectiveStock <= product.minStock;
              
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onEditProduct?.(product)}
                  className="card p-4 group overflow-hidden bg-gray-100 dark:bg-slate-700 dark:border-slate-600 hover:shadow-lg dark:hover:shadow-glow-purple transition-all"
                >
                  <div className="absolute top-2 ltr:right-4 rtl:left-4 text-4xl font-bold text-gray-500 dark:text-slate-200  group-hover:text-gray-200 dark:group-hover:text-slate-500 transition-colors">
                    #{index + 1}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isLowStock
                          ? 'bg-red-600 dark:bg-red-600 text-red-100 dark:text-red-50'
                          : 'bg-green-400 dark:bg-green-600 text-green-900 dark:text-green-50'
                      }`}>
                        {t('dashboard.inStockCount', { count: effectiveStock })}
                      </div>
                      {isLowStock && (
                        <AlertTriangle className="absolute h-7 w-7 text-white p-1 rounded-sm bg-red-600 ltr:right-14 rtl:left-14" />
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-slate-50 mb-2 line-clamp-2">{td(product.name)}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-300 mb-4">{td(product.category)}</p>
                    
                    <div className="border-t border-gray-300 dark:border-slate-200  pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-primary-700 dark:text-primary-500 force-ltr">₨ {product.price}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-300">{t('common.sku')}: <span className="force-ltr">{product.sku}</span></span>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-slate-200  space-y-1">
                        <p>{batchSummaryByProduct[product.id]?.count ?? 0} {t('dashboard.batches')}</p>
                        <p>{batchSummaryByProduct[product.id]?.totalQuantity ?? 0} {t('dashboard.totalQty')}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};