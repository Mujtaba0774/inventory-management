import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle,
  Calendar,
  Package,
  Edit2, 
  Trash2, 
  X, 
  Save
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useNotification } from '../hooks/useNotification';
import { useConfirm } from '../hooks/useConfirm';
import { useLanguage } from '../hooks/useLanguage';
import Pagination from './Pagination';

export const DamagesHistory = () => {
  const { products, stockMovements, updateStockMovement, deleteStockMovement } = useProducts();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const { t, td, tEnum } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingMovement, setEditingMovement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(0);
  const [tempDate, setTempDate] = useState('');
  const [tempReason, setTempReason] = useState('');
  const [tempReference, setTempReference] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const categories = [...new Set(products.map(p => p.category))];

  const damageReasons = ['Damage', 'Loss', 'Return to Vendor'];

  const damageMovements = stockMovements.filter(m => m.type === 'out' && damageReasons.includes(m.reason))
    .filter(movement => {
      const product = products.find(p => p.id === movement.productId);
      const matchesSearch = !searchTerm || 
        product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product?.category === selectedCategory;
      const movementDate = new Date(movement.date);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      const matchesDate = (!from || movementDate >= from) && (!to || movementDate <= to);
      return matchesSearch && matchesCategory && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate, selectedCategory, stockMovements.length]);

  const totalPages = Math.max(1, Math.ceil(damageMovements.length / PAGE_SIZE));
  const pagedDamageMovements = damageMovements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalDamageQuantity = damageMovements.reduce((sum, m) => sum + m.quantity, 0);
  const totalDamageValue = damageMovements.reduce((sum, m) => {
    const product = products.find(p => p.id === m.productId);
    return sum + (m.quantity * (product?.cost || 0));
  }, 0);

  const handleEdit = (movement) => {
    setEditingMovement(movement);
    setTempQuantity(movement.quantity);
    setTempDate(movement.date);
    setTempReason(movement.reason);
    setTempReference(movement.reference || '');
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    if (editingMovement) {
      try {
        await updateStockMovement(editingMovement.id, {
          quantity: tempQuantity,
          date: tempDate,
          reason: tempReason,
          reference: tempReference
        });
        showNotification({
          type: 'success',
          title: t('damages.updated'),
          message: t('damages.updatedMessage'),
        });
      } catch (error) {
        showNotification({
          type: 'error',
          title: t('damages.updateFailed'),
          message: error.message || t('damages.updateFailedMessage'),
        });
      }
    }
    setShowModal(false);
    setEditingMovement(null);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: t('damages.deleteTitle'),
      message: t('damages.deleteMessage'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteStockMovement(id);
      showNotification({
        type: 'success',
        title: t('damages.deleted'),
        message: t('damages.deletedMessage'),
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: t('damages.deleteFailed'),
        message: error.message || t('damages.deleteFailedMessage'),
      });
    }
  };

  return (
    <div className="space-y-6">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  
  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">
    {t('damages.title')}
  </h1>

  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-slate-400">
    
    {/* Icon + First Stat */}
    <div className="flex items-center gap-1 w-1/2 sm:w-auto">
      <Calendar className="h-4 w-4 flex-shrink-0 dark:text-slate-200" />
      <span>{t('damages.total', { count: damageMovements.length })}</span>
    </div>

    <span className="w-1/2 sm:w-auto">
      {t('damages.qty', { count: totalDamageQuantity })}
    </span>

    <span className="w-1/2 sm:w-auto">
      {t('damages.value', { amount: totalDamageValue.toLocaleString() })}
    </span>
  </div>
</div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg dark:border dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t('damages.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field ltr:pl-10 rtl:pr-10"
            />
          </div>

          <div className="relative">
            <input
              id="from-date-input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-field no-native-picker ltr:pr-10 rtl:pl-10"
            />
            <button
              type="button"
              onClick={() => document.querySelector('#from-date-input').showPicker?.() || document.querySelector('#from-date-input').focus()}
              className="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white"
              aria-hidden
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <input
              id="to-date-input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input-field no-native-picker ltr:pr-10 rtl:pl-10"
            />
            <button
              type="button"
              onClick={() => document.querySelector('#to-date-input').showPicker?.() || document.querySelector('#to-date-input').focus()}
              className="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white"
              aria-hidden
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">{t('common.allCategories')}</option>
            {categories.map(category => (
              <option key={category} value={category}>{td(category)}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>{t('damages.results', { count: damageMovements.length })}</span>
          </div>
        </div>
      </div>

      {/* Damages Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg dark:border dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{t('damages.transactions')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colDate')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colProduct')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colSku')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colCategory')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colQuantity')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colCost')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colTotalLoss')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colReason')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colReference')}</th>
                <th className="px-6 py-3 text-start font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-sm whitespace-nowrap">{t('damages.colActions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {pagedDamageMovements.map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                const totalLoss = movement.quantity * (product?.cost || 0);
                return (
                  <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">
                      {formatDate(movement.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-50 whitespace-nowrap">{td(product?.name)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap numeric-cell">{product?.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">{td(product?.category)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-50 whitespace-nowrap">{movement.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap numeric-cell">₨ {product?.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600 dark:text-red-400 whitespace-nowrap numeric-cell">₨ {totalLoss.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">{tEnum('reasons', movement.reason)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">{movement.reference || t('common.na')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(movement)}
                          className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title={t('common.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(movement.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {damageMovements.length > 0 && (
          <div className="border-t border-gray-200 dark:border-slate-700">
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
        )}
      </div>

      {damageMovements.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-50 mb-2">{t('damages.noneFound')}</h3>
          <p className="text-gray-500 dark:text-slate-400">
            {searchTerm || fromDate || toDate || selectedCategory
              ? t('damages.adjustFilters')
              : t('damages.noRecords')
            }
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingMovement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">{t('damages.editDamage')}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('common.quantity')}</label>
                <input
                  type="number"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(parseInt(e.target.value) || 0)}
                  className="input-field"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('common.date')}</label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('common.reason')}</label>
                <select
                  value={tempReason}
                  onChange={(e) => setTempReason(e.target.value)}
                  className="input-field"
                >
                  <option value="Damage">{tEnum('reasons', 'Damage')}</option>
                  <option value="Loss">{tEnum('reasons', 'Loss')}</option>
                  <option value="Return to Vendor">{tEnum('reasons', 'Return to Vendor')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('damages.colReference')}</label>
                <input
                  type="text"
                  value={tempReference}
                  onChange={(e) => setTempReference(e.target.value)}
                  className="input-field"
                  placeholder={t('damages.referencePlaceholder')}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg flex items-center space-x-2 font-medium transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{t('common.update')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};