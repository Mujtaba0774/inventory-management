import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useBatchSummary } from '../hooks/useBatchSummary';
import Pagination from './Pagination';

export const CurrentStock = ({ onEditProduct }) => {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all');

  const toNumber = (value) => Number(value ?? 0);

  const categories = [...new Set(products.map(p => p.category))];

  const batchSummaryByProduct = useBatchSummary(
    useMemo(() => products.map((product) => product.id), [products])
  );

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { color: 'text-red-600 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900', label: 'Out of Stock', icon: '🔴' };
    if (stock <= minStock) return { color: 'text-orange-600 dark:text-amber-200', bg: 'bg-amber-100 dark:bg-amber-700', label: 'Low Stock', icon: '🟠' };
    return { color: 'text-green-600 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900', label: 'In Stock', icon: '🟢' };
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const batchSummary = batchSummaryByProduct[product.id];
        const effectiveStock = Number(batchSummary?.totalQuantity ?? 0);
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;

        let matchesFilter = true;
        switch (filterType) {
          case 'lowStock':
            matchesFilter = effectiveStock > 0 && effectiveStock <= product.minStock;
            break;
          case 'outOfStock':
            matchesFilter = effectiveStock === 0;
            break;
          case 'inStock':
            matchesFilter = effectiveStock > product.minStock;
            break;
          default:
            matchesFilter = true;
        }

        return matchesSearch && matchesCategory && matchesFilter;
      })
      .sort((a, b) => {
        const aSummary = batchSummaryByProduct[a.id];
        const bSummary = batchSummaryByProduct[b.id];
        const aStock = Number(aSummary?.totalQuantity ?? 0);
        const bStock = Number(bSummary?.totalQuantity ?? 0);

        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'stock':
            return aStock - bStock;
          case 'stockDesc':
            return bStock - aStock;
          case 'category':
            return a.category.localeCompare(b.category);
          default:
            return 0;
        }
      });
  }, [products, searchTerm, selectedCategory, sortBy, filterType, batchSummaryByProduct]);

  // Pagination (10 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    // reset to first page when filters/search change
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => Number(batchSummaryByProduct[p.id]?.totalQuantity ?? 0) === 0).length;
  const lowStockCount = products.filter(p => {
    const stock = Number(batchSummaryByProduct[p.id]?.totalQuantity ?? 0);
    return stock > 0 && stock <= p.minStock;
  }).length;
  const totalStockValue = products.reduce((sum, p) => {
    const stock = Number(batchSummaryByProduct[p.id]?.totalQuantity ?? 0);
    return sum + (stock * toNumber(p.price));
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">Current Stock</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-blue-500 dark:border-l-blue-500  hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-green-500 dark:border-l-green-500 hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">₨ {totalStockValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-yellow-500 dark:border-l-yellow-500 hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-red-500 dark:border-l-red-500 hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">All Items</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock (Low to High)</option>
            <option value="stockDesc">Sort by Stock (High to Low)</option>
            <option value="category">Sort by Category</option>
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>{filteredProducts.length} of {totalProducts} products</span>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg dark:border dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Product</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">SKU</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Category</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Current Stock</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Min Level</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Unit Price</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Total Value</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {pagedProducts.map((product) => {
                const batchSummary = batchSummaryByProduct[product.id];
                const effectiveStock = Number(batchSummary?.totalQuantity ?? 0);
                const stockStatus = getStockStatus(effectiveStock, product.minStock);
                const totalValue = effectiveStock * toNumber(product.price);

                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-slate-50 font-medium whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400 whitespace-nowrap">{product.sku}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400 whitespace-nowrap">{product.category}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900 dark:text-slate-50">{effectiveStock}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-slate-400 whitespace-nowrap">{product.minStock}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        <span>{stockStatus.icon}</span>
                        <span>{stockStatus.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900 dark:text-slate-50 whitespace-nowrap">₨ {toNumber(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-slate-50 whitespace-nowrap">₨ {totalValue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onEditProduct?.(product)}
                        className="px-3 py-1 text-sm bg-primary-600 dark:bg-primary-700 text-white rounded-full hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > 0 && (
          <div className="border-t border-gray-200 dark:border-slate-700">
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-slate-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};
