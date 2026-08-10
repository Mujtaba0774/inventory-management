import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Plus,
  Package,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useBatchSummary } from '../hooks/useBatchSummary';
import { useNotification } from '../hooks/useNotification';
import { useConfirm } from '../hooks/useConfirm';
import { useLanguage } from '../hooks/useLanguage';

export const ProductList = ({ onEditProduct, onAddProduct, presetFilter }) => {
  const { products, stockMovements, deleteProduct } = useProducts();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const { t, td } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [activePresetKind, setActivePresetKind] = useState('all');
  // Stored as a dictionary key so the banner re-translates on language change.
  const [activePresetLabelKey, setActivePresetLabelKey] = useState('products.allProducts');

  const toNumber = (value) => Number(value ?? 0);

  useEffect(() => {
    setActivePresetKind(presetFilter?.kind ?? 'all');
    setActivePresetLabelKey(presetFilter?.labelKey ?? 'products.allProducts');
    setSortBy(presetFilter?.sortBy ?? 'name');
    setSearchTerm('');
    setSelectedCategory('');
  }, [presetFilter]);

  const soldProductIds = useMemo(() => {
    return new Set(
      stockMovements
        .filter((movement) => movement.type === 'out' && movement.reason === 'Sale')
        .map((movement) => String(movement.productId))
    );
  }, [stockMovements]);

  const damagedProductIds = useMemo(() => {
    return new Set(
      stockMovements
        .filter((movement) => movement.type === 'out' && (movement.reason === 'Damage' || movement.reason === 'Loss'))
        .map((movement) => String(movement.productId))
    );
  }, [stockMovements]);

  const categories = [...new Set(products.map(p => p.category))];

  const batchSummaryByProduct = useBatchSummary(
    useMemo(() => products.map((product) => product.id), [products])
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const batchSummary = batchSummaryByProduct[product.id];
        const effectiveStock = Number(batchSummary?.totalQuantity ?? 0);
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        let matchesPreset = true;

        switch (activePresetKind) {
          case 'lowStock':
            matchesPreset = effectiveStock > 0 && effectiveStock <= product.minStock;
            break;
          case 'outOfStock':
            matchesPreset = effectiveStock === 0;
            break;
          case 'profitable':
            matchesPreset = toNumber(product.price) > toNumber(product.cost);
            break;
          case 'sold':
            matchesPreset = soldProductIds.has(String(product.id));
            break;
          case 'damaged':
            matchesPreset = damagedProductIds.has(String(product.id));
            break;
          default:
            matchesPreset = true;
        }

        return matchesSearch && matchesCategory && matchesPreset;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name': return a.name.localeCompare(b.name);
          case 'stock': {
            const aSummary = batchSummaryByProduct[a.id];
            const bSummary = batchSummaryByProduct[b.id];
            const aStock = Number(aSummary?.totalQuantity ?? 0);
            const bStock = Number(bSummary?.totalQuantity ?? 0);
            return aStock - bStock;
          }
          case 'price': return toNumber(a.price) - toNumber(b.price);
          case 'value': {
            const aStock = Number(batchSummaryByProduct[a.id]?.totalQuantity ?? 0);
            const bStock = Number(batchSummaryByProduct[b.id]?.totalQuantity ?? 0);
            return (bStock * toNumber(b.price)) - (aStock * toNumber(a.price));
          }
          default: return 0;
        }
      });
  }, [activePresetKind, batchSummaryByProduct, damagedProductIds, products, searchTerm, selectedCategory, soldProductIds, sortBy]);

  const handleDelete = async (product) => {
    const confirmed = await confirm({
      title: t('products.deleteTitle'),
      message: t('products.deleteMessage', { name: product.name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);
      showNotification({
        type: 'success',
        title: t('products.deleted'),
        message: t('products.deletedMessage', { name: product.name }),
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: t('products.deleteFailed'),
        message: error.message || t('products.deleteFailedMessage'),
      });
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', label: t('products.outOfStock') };
    if (stock <= minStock) return { color: 'text-orange-600', bg: 'bg-orange-100', label: t('products.lowStock') };
    return { color: 'text-green-600', bg: 'bg-green-100', label: t('products.inStock') };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">{t('products.title')}</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1">{t('products.subtitle')}</p>
        </div>
        <button
          onClick={onAddProduct}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white shadow-md transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>{t('products.addProduct')}</span>
        </button>
      </div>

      {activePresetKind !== 'all' && (
        <div className="card-lg accent-bar p-4 border-l-4 border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center justify-between">
            <p className="font-medium text-primary-900 dark:text-primary-300">
              📋 {t('products.showing')} <span className="font-bold">{t(activePresetLabelKey)}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setActivePresetKind('all');
                setActivePresetLabelKey('products.allProducts');
              }}
              className="text-sm font-semibold text-primary-700 hover:text-primary-900  dark:text-primary-300 dark:hover:text-primary-100 transition-colors"
            >
              {t('common.clearFilter')} <span className="ltr:inline rtl:hidden">→</span><span className="ltr:hidden rtl:inline">←</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="card-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field-lg ltr:pl-12 rtl:pr-12"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field-lg"
          >
            <option value="">{t('common.allCategories')}</option>
            {categories.map(category => (
              <option key={category} value={category}>{td(category)}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field-lg"
          >
            <option value="name">{t('products.sortByName')}</option>
            <option value="stock">{t('products.sortByStock')}</option>
            <option value="price">{t('products.sortByPrice')}</option>
            <option value="value">{t('products.sortByValue')}</option>
          </select>
        </div>

        <div className="mt-4 flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Filter className="h-5 w-5 text-primary-500" />
          <span>{t('products.displaying', { shown: filteredProducts.length, total: products.length })}</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const price = toNumber(product.price);
          const cost = toNumber(product.cost);
          const batchSummary = batchSummaryByProduct[product.id];
          const effectiveStock = Number(batchSummary?.totalQuantity ?? 0);
          const stockStatus = getStockStatus(effectiveStock, product.minStock);
          const profitMargin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0.0';

          return (
            // <div key={product.id} className="card-lg overflow-hidden hover:shadow-lg-soft group animate-slide-up">
            //   <div className="p-6">
            //     <div className="flex items-start justify-between mb-4">
            //       <div className="flex-1 pr-2">
            //         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{product.name}</h3>
            //         <div className="flex items-center space-x-2">
            //           <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-600 text-primary-700 dark:text-primary-200">{product.category}</span>
            //           <span className="text-xs text-gray-500 dark:text-gray-200">SKU: {product.sku}</span>
            //         </div>
            //       </div>
            //       <div className="flex space-x-1">
            //         <button
            //           onClick={() => onEditProduct(product)}
            //           className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            //           title="Edit product"
            //         >
            //           <Edit2 className="h-5 w-5" />
            //         </button>
            //         <button
            //           onClick={() => handleDelete(product)}
            //           className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            //           title="Delete product"
            //         >
            //           <Trash2 className="h-5 w-5" />
            //         </button>
            //       </div>
            //     </div>

            //     <div className="space-y-4">
            //       {/* Stock Status */}
            //       <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
            //         <div className="flex items-center space-x-2">
            //           <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            //           <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Stock</span>
            //         </div>
            //         <div className="flex items-center space-x-2">
            //           <span className="text-2xl font-bold text-gray-900 dark:text-white">{effectiveStock}</span>
            //           <span className={`px-3 py-1 pt-1.5 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
            //             {stockStatus.label}
            //           </span>
            //         </div>
            //       </div>

            //       {/* Low Stock Warning */}
            //       {effectiveStock < product.minStock && (
            //         <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-700 rounded-lg border border-red-200 dark:border-red-500">
            //           <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-100 flex-shrink-0" />
            //           <span className="text-sm font-medium text-red-700 dark:text-red-100">Min stock: {product.minStock}</span>
            //         </div>
            //       )}

            //       {/* Pricing */}
            //       <div className="space-y-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
            //         <div className="flex items-center justify-between">
            //           <span className="text-sm text-gray-600 dark:text-gray-200">Selling Price</span>
            //           <span className="text-2xl font-bold text-primary-600 dark:text-primary-500">₨ {price.toLocaleString()}</span>
            //         </div>

            //         <div className="flex items-center justify-between text-sm">
            //           <span className="text-gray-600 dark:text-gray-200">Cost Price</span>
            //           <span className="text-gray-900 font-medium dark:text-gray-200">₨ {cost.toLocaleString()}</span>
            //         </div>

            //         <div className="flex items-center justify-between pt-2 border-t border-secondary-200">
            //           <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profit Margin</span>
            //           <span className={`text-lg font-bold ${profitMargin > 20 ? 'text-green-600' : profitMargin > 10 ? 'text-yellow-600' : 'text-orange-600'}`}>
            //             {profitMargin}%
            //           </span>
            //         </div>
            //       </div>

            //       {/* Batch Information */}
            //       <div className="space-y-2">
            //         <p className="text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide">Batch Information</p>
            //         <div className="flex items-center justify-between text-sm">
            //           <span className="text-gray-600 dark:text-gray-200">Batches:</span>
            //           <span className="font-semibold text-gray-900 dark:text-gray-200">{batchSummaryByProduct[product.id]?.count ?? 0}</span>
            //         </div>
            //         {batchSummaryByProduct[product.id]?.batches?.length > 0 && (
            //           <div className="space-y-2 rounded-lg bg-gray-50 dark:bg-slate-700 p-3 text-xs border border-gray-200 dark:border-gray-500">
            //             {batchSummaryByProduct[product.id].batches.slice(0, 1).map((batch) => (
            //               <div key={batch.id} className="flex items-center justify-between gap-2">
            //                 <span className="font-medium text-gray-700 dark:text-gray-300">
            //                   {batch.batchNumber}{batch.vendorName ? ` (${batch.vendorName})` : ''}
            //                 </span>
            //                 <span className="text-gray-600 dark:text-gray-200">
            //                   {batch.quantity} @ ₨{Number(batch.unitPrice || 0).toFixed(0)}
            //                 </span>
            //               </div>
            //             ))}
            //             {batchSummaryByProduct[product.id].batches.length > 1 && (
            //               <p className="text-gray-500 dark:text-gray-200 italic pt-1 border-t border-gray-200 dark:border-gray-500">
            //                 +{batchSummaryByProduct[product.id].batches.length - 1} more
            //               </p>
            //             )}
            //           </div>
            //         )}
            //       </div>

            //       {/* Total Value */}
            //       <div className="pt-3 border-t border-gray-200 dark:border-gray-500">
            //         <div className="flex items-center justify-between">
            //           <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value</span>
            //           <span className="text-xl font-bold text-primary-600 dark:text-primary-500">
            //             ₨ {(effectiveStock * price).toLocaleString()}
            //           </span>
            //         </div>
            //       </div>
            //     </div>
            //   </div>

            //   {/* Footer */}
            //   <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-gray-500 bottom-0">
            //     <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-200">
            //       <span>📅 Added: {product.dateAdded}</span>
            //       <span>🔄 Updated: {product.lastUpdated}</span>
            //     </div>
            //   </div>
            // </div>
            <div key={product.id} className="card-lg overflow-hidden hover:shadow-lg dark:hover:shadow-glow-purple transition-all flex flex-col h-full ">
              <div className="px-4 pt-4 pb-1 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 ltr:pr-2 rtl:pl-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{td(product.name)}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-600 text-primary-700 dark:text-primary-200">{td(product.category)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-200">{t('common.sku')}: <span className="force-ltr">{product.sku}</span></span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                      title={t('products.editProduct')}
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title={t('products.deleteProduct')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  {/* Stock Status */}
                  <div className="flex items-center justify-between ">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <span className="text-md font-medium text-gray-600 dark:text-gray-400">{t('products.inStock')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{effectiveStock}</span>
                      <span className={`px-3 py-1 pt-1.5 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Low Stock Warning */}
                  {effectiveStock < product.minStock && (
                    <div className="flex items-center space-x-2 my-2 p-3 bg-red-50 dark:bg-red-700 rounded-lg border border-red-200 dark:border-red-500">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-100 flex-shrink-0" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-100">{t('products.minStock', { count: product.minStock })}</span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-md text-gray-600 dark:text-gray-200">{t('products.sellingPrice')}</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-500 force-ltr">₨ {price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-md">
                      <span className="text-gray-600 dark:text-gray-200">{t('products.costPrice')}</span>
                      <span className="text-gray-900 font-medium dark:text-gray-200 force-ltr">₨ {cost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-500">
                      <span className="text-md font-medium text-gray-700 dark:text-gray-300">{t('products.profitMargin')}</span>
                      <span className={`text-lg font-bold force-ltr ${profitMargin > 20 ? 'text-green-600' : profitMargin > 10 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {profitMargin}%
                      </span>
                    </div>
                  </div>

                  {/* Batch Information */}
                  <div className="mt-2">
                    <p className="text-md font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide">{t('products.batchInformation')}</p>
                    <div className="flex items-center justify-between text-md">
                      <span className="text-gray-600 dark:text-gray-200">{t('products.batches')}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{batchSummaryByProduct[product.id]?.count ?? 0}</span>
                    </div>
                    {batchSummaryByProduct[product.id]?.batches?.length > 0 && (
                      <div className="text-md">
                        {batchSummaryByProduct[product.id].batches.slice(0, 1).map((batch) => (
                          <div key={batch.id} className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {batch.batchNumber}{batch.vendorName ? ` (${td(batch.vendorName)})` : ''}
                            </span>
                            <span className="text-gray-600 dark:text-gray-200 force-ltr">
                              {batch.quantity} @ ₨{Number(batch.unitPrice || 0).toFixed(0)}
                            </span>
                          </div>
                        ))}
                        {batchSummaryByProduct[product.id].batches.length > 1 && (
                          <p className="text-gray-500 dark:text-gray-200 italic">
                            {t('products.more', { count: batchSummaryByProduct[product.id].batches.length - 1 })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total Value */}
                  <div className="border-t border-gray-200 dark:border-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.totalValue')}</span>
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-500 force-ltr">
                        ₨ {(effectiveStock * price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer — always pinned to bottom */}
              <div className="px-6 py-3 bg-gray-100 dark:bg-slate-700 border-t border-gray-200 dark:border-gray-500">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-200">
                  <span>📅 {t('products.added', { date: product.dateAdded })}</span>
                  <span>🔄 {t('products.updated', { date: product.lastUpdated })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <Package className="empty-state-icon" />
          <h3 className="empty-state-title">{t('products.noneFound')}</h3>
          <p className="empty-state-text">
            {searchTerm || selectedCategory
              ? t('products.adjustSearch')
              : t('products.getStarted')
            }
          </p>
          <button
            onClick={onAddProduct}
            className="btn-primary-lg flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>{t('products.addFirstProduct')}</span>
          </button>
        </div>
      )}

    </div>
  );
};