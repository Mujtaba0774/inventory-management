import React, { useState, useEffect } from 'react';
import { X, Save, Package, Edit2, Trash2 } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useNotification } from '../hooks/useNotification';
import { useConfirm } from '../hooks/useConfirm';
import { useLanguage } from '../hooks/useLanguage';

const DEFAULT_PRODUCT_CATEGORIES = [
  'Chocolates',
  'Candies',
  'Lollipops',
  'Gummies & Jelly',
  'Chips',
  'Crisps (Slanty, Kurleez)',
  'Biscuits',
  'Nimko',
  'Gajak',
  'Rewari',
];

const ADD_NEW_CATEGORY_VALUE = '__add_new_category__';
const ADD_NEW_VENDOR_VALUE = '__add_new_vendor__';

export const ProductForm = ({ product, onClose }) => {
  const { products, addProduct, updateProduct, getBatchesForProduct, updateBatch, deleteBatch } = useProducts();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const { t, td } = useLanguage();
  const [productBatches, setProductBatches] = useState([]);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editBatchData, setEditBatchData] = useState({ quantity: 0, unit_price: 0 });
  const [categories, setCategories] = useState(DEFAULT_PRODUCT_CATEGORIES);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [vendors, setVendors] = useState([]);
  const [isAddingNewVendor, setIsAddingNewVendor] = useState(false);
  const [newVendor, setNewVendor] = useState('');
  const toNumber = (value) => Number(value ?? 0);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    stock: 0,
    minStock: 0,
    price: 0,
    cost: 0,
    description: '',
    vendor: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      const nextCategories = new Set(DEFAULT_PRODUCT_CATEGORIES);

      (products ?? []).forEach((item) => {
        if (typeof item?.category === 'string' && item.category.trim()) {
          nextCategories.add(item.category.trim());
        }
      });

      try {
        if (!globalThis.__USE_MOCK_DATA__) {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const data = await response.json();
            (data.categories ?? []).forEach((category) => {
              if (typeof category?.name === 'string' && category.name.trim()) {
                nextCategories.add(category.name.trim());
              }
            });
          }
        }
      } catch (error) {
        // Keep fallback + product-derived categories when API categories are unavailable.
      }

      if (!cancelled) {
        setCategories(Array.from(nextCategories));
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [products]);

  useEffect(() => {
    let cancelled = false;

    const loadVendors = async () => {
      const nextVendors = new Set();

      (products ?? []).forEach((item) => {
        if (typeof item?.vendor === 'string' && item.vendor.trim()) {
          nextVendors.add(item.vendor.trim());
        }
      });

      try {
        if (!globalThis.__USE_MOCK_DATA__) {
          const response = await fetch('/api/vendors');
          if (response.ok) {
            const data = await response.json();
            (data.vendors ?? data.vendors ?? data.vendors ?? []).forEach((vendor) => {
              if (typeof vendor?.name === 'string' && vendor.name.trim()) {
                nextVendors.add(vendor.name.trim());
              }
            });
          }
        }
      } catch (error) {
        // Keep product-derived vendors when API vendors are unavailable.
      }

      if (!cancelled) {
        setVendors(Array.from(nextVendors));
      }
    };

    loadVendors();

    return () => {
      cancelled = true;
    };
  }, [products]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        sku: product.sku,
        stock: product.stock,
        minStock: product.minStock,
        price: product.price,
        cost: product.cost,
        description: product.description,
        vendor: product.vendor ?? ''
      });
    }
    // load batches for the product when editing
    const loadBatches = async () => {
      try {
        if (product && getBatchesForProduct) {
          const batches = await getBatchesForProduct(product.id);
          setProductBatches(batches ?? []);

          const total = (batches ?? []).reduce((sum, b) => sum + Number(b.quantity ?? 0), 0);
          setFormData(prev => ({
            ...prev,
            stock: total,
          }));
        } else {
          setProductBatches([]);
        }
      } catch (err) {
        setProductBatches([]);
      }
    };

    loadBatches();
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = t('productForm.errNameRequired');
    if (!formData.category.trim()) newErrors.category = t('productForm.errCategoryRequired');
    if (!formData.sku.trim()) newErrors.sku = t('productForm.errSkuRequired');
    if (formData.stock < 0) newErrors.stock = t('productForm.errStockNegative');
    if (formData.minStock < 0) newErrors.minStock = t('productForm.errMinStockNegative');
    if (formData.price <= 0) newErrors.price = t('productForm.errPricePositive');
    if (formData.cost < 0) newErrors.cost = t('productForm.errCostNegative');
    if (formData.cost >= formData.price) newErrors.cost = t('productForm.errCostBelowPrice');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (product) {
        await updateProduct(product.id, formData);
        showNotification({
          type: 'success',
          title: t('productForm.updated'),
          message: t('productForm.updatedMessage', { name: formData.name }),
        });
      } else {
        await addProduct(formData);
        showNotification({
          type: 'success',
          title: t('productForm.added'),
          message: t('productForm.addedMessage', { name: formData.name }),
        });
      }

      onClose();
    } catch (error) {
      const message = error.message || t('productForm.saveFailedMessage');

      setErrors((prev) => ({
        ...prev,
        submit: message,
      }));

      showNotification({
        type: 'error',
        title: t('productForm.saveFailed'),
        message,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategorySelectChange = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === ADD_NEW_CATEGORY_VALUE) {
      setIsAddingNewCategory(true);
      setNewCategory('');
      setFormData((prev) => ({ ...prev, category: '' }));
    } else {
      setIsAddingNewCategory(false);
      setNewCategory('');
      setFormData((prev) => ({ ...prev, category: selectedValue }));
    }

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const addCategoryOption = (value) => {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) return;

    setCategories((prev) => (
      prev.includes(normalizedValue) ? prev : [...prev, normalizedValue]
    ));
  };

  const handleNewCategoryChange = (e) => {
    const value = e.target.value;

    setNewCategory(value);
    setFormData((prev) => ({ ...prev, category: value }));

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const handleNewCategoryBlur = () => {
    const trimmed = newCategory.trim();

    setNewCategory(trimmed);
    setFormData((prev) => ({ ...prev, category: trimmed }));
    addCategoryOption(trimmed);
  };

  const handleVendorSelectChange = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === ADD_NEW_VENDOR_VALUE) {
      setIsAddingNewVendor(true);
      setNewVendor('');
      setFormData((prev) => ({ ...prev, vendor: '' }));
    } else {
      setIsAddingNewVendor(false);
      setNewVendor('');
      setFormData((prev) => ({ ...prev, vendor: selectedValue }));
    }

    if (errors.vendor) {
      setErrors((prev) => ({ ...prev, vendor: '' }));
    }
  };

  const addVendorOption = (value) => {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) return;

    setVendors((prev) => (
      prev.includes(normalizedValue) ? prev : [...prev, normalizedValue]
    ));
  };

  const handleNewVendorChange = (e) => {
    const value = e.target.value;

    setNewVendor(value);
    setFormData((prev) => ({ ...prev, vendor: value }));

    if (errors.vendor) {
      setErrors((prev) => ({ ...prev, vendor: '' }));
    }
  };

  const handleNewVendorBlur = () => {
    const trimmed = newVendor.trim();

    setNewVendor(trimmed);
    setFormData((prev) => ({ ...prev, vendor: trimmed }));
    addVendorOption(trimmed);
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch.id);
    setEditBatchData({
      quantity: Number(batch.quantity ?? 0),
      unit_price: Number(batch.unit_price ?? 0),
    });
  };

  const handleSaveBatchEdit = async () => {
    try {
      if (editBatchData.quantity <= 0) {
        showNotification({
          type: 'warning',
          title: t('productForm.invalidQuantity'),
          message: t('productForm.invalidQuantityMessage'),
        });
        return;
      }
      if (editBatchData.unit_price < 0) {
        showNotification({
          type: 'warning',
          title: t('productForm.invalidPrice'),
          message: t('productForm.invalidPriceMessage'),
        });
        return;
      }

      await updateBatch(editingBatch, {
        quantity: editBatchData.quantity,
        unit_price: editBatchData.unit_price,
      });
      
      setProductBatches(prev => prev.map(b => 
        String(b.id) === String(editingBatch)
          ? { ...b, ...editBatchData }
          : b
      ));
      setEditingBatch(null);
      
      showNotification({
        type: 'success',
        title: t('productForm.batchUpdated'),
        message: t('productForm.batchUpdatedMessage'),
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: t('productForm.batchUpdateFailed'),
        message: error.message || t('productForm.batchUpdateFailedMessage'),
      });
    }
  };

  const handleDeleteBatch = async (batch) => {
    const confirmed = await confirm({
      title: t('productForm.batchDeleteTitle'),
      message: t('productForm.batchDeleteMessage', { count: batch.quantity }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });

    if (!confirmed) return;

    try {
      await deleteBatch(batch.id);
      setProductBatches(prev => prev.filter(b => String(b.id) !== String(batch.id)));
      
      showNotification({
        type: 'success',
        title: t('productForm.batchDeleted'),
        message: t('productForm.batchDeletedMessage'),
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: t('productForm.batchDeleteFailed'),
        message: error.message || t('productForm.batchDeleteFailedMessage'),
      });
    }
  };

const loadBatches = async () => {
  try {
    if (product && getBatchesForProduct) {
      const batches = await getBatchesForProduct(product.id);
      setProductBatches(batches ?? []);

      const total = (batches ?? []).reduce((sum, b) => sum + Number(b.quantity ?? 0), 0);
      setFormData(prev => ({
        ...prev,
        stock: total,
      }));
    } else {
      setProductBatches([]);
    }
  } catch (err) {
    setProductBatches([]);
  }
};

const categoryOptions = formData.category && !categories.includes(formData.category)
  ? [formData.category, ...categories]
  : categories;

const vendorOptions = formData.vendor && !vendors.includes(formData.vendor)
  ? [formData.vendor, ...vendors]
  : vendors;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
              {product ? t('productForm.editTitle') : t('productForm.addTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.productName')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
                placeholder={t('productForm.productNamePlaceholder')}
              />
              {errors.name && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.category')}
              </label>
              <select
                name="category"
                value={isAddingNewCategory ? ADD_NEW_CATEGORY_VALUE : formData.category}
                onChange={handleCategorySelectChange}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.category ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
              >
                <option value="">{t('productForm.selectCategory')}</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{td(cat)}</option>
                ))}
                <option value={ADD_NEW_CATEGORY_VALUE}>{t('productForm.addNewCategory')}</option>
              </select>
              {isAddingNewCategory && (
                <input
                  type="text"
                  value={newCategory}
                  onChange={handleNewCategoryChange}
                  onBlur={handleNewCategoryBlur}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder={t('productForm.newCategoryPlaceholder')}
                />
              )}
              {errors.category && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.sku')}
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.sku ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
                placeholder={t('productForm.skuPlaceholder')}
              />
              {errors.sku && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.sku}</p>}
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.currentStock')}
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.stock ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.stock}</p>}
            </div>

            {/* Minimum Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.minimumStock')}
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.minStock ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.minStock && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.minStock}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.sellingPrice')}
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.price && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.costPrice')}
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.cost ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.cost && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.cost}</p>}
              {toNumber(formData.price) > 0 && toNumber(formData.cost) > 0 && (
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  {t('productForm.profitMargin', { value: ((((toNumber(formData.price) - toNumber(formData.cost)) / toNumber(formData.price)) * 100)).toFixed(1) })}
                </p>
              )}
            </div>

            {/* Vendor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.vendor')}
              </label>
              <select
                name="vendor"
                value={isAddingNewVendor ? ADD_NEW_VENDOR_VALUE : formData.vendor}
                onChange={handleVendorSelectChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="">{t('productForm.selectVendor')}</option>
                {vendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>{td(vendor)}</option>
                ))}
                <option value={ADD_NEW_VENDOR_VALUE}>{t('productForm.addNewVendor')}</option>
              </select>
              {isAddingNewVendor && (
                <input
                  type="text"
                  value={newVendor}
                  onChange={handleNewVendorChange}
                  onBlur={handleNewVendorBlur}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder={t('productForm.newVendorPlaceholder')}
                />
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('productForm.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder={t('productForm.descriptionPlaceholder')}
              />
            </div>

            {/* Batches (visible when editing a product) */}
            {product && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('productForm.batches')}</label>
                {productBatches.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-slate-400">{t('productForm.noBatches')}</p>
                ) : (
                  <div className="space-y-2">
                    {productBatches.map((batch, idx) => (
                      <div key={batch.id ?? idx} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded px-3 py-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-slate-50">{t('productForm.batchLabel', { number: batch.batch_number ?? idx + 1 })}{batch.vendor_name ? ` — ${td(batch.vendor_name)}` : ''}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{t('productForm.batchDate', { date: batch.batch_date ? new Date(batch.batch_date).toLocaleDateString() : (batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '-') })}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-end">
                            <div className="font-medium text-gray-900 dark:text-slate-50">{t('productForm.unitsCount', { count: Number(batch.quantity ?? 0) })}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 force-ltr">₨ {batch.unit_price == null ? '0.00' : Number(batch.unit_price).toFixed(2)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditBatch(batch)}
                            className="p-1 text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBatch(batch)}
                            className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit Batch Modal */}
            {editingBatch && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-2xl w-full max-w-md">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">{t('productForm.editBatch')}</h3>
                    <button
                      type="button"
                      onClick={() => setEditingBatch(null)}
                      className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('common.quantity')}</label>
                      <input
                        type="number"
                        value={editBatchData.quantity}
                        onChange={(e) => setEditBatchData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('productForm.unitPrice')}</label>
                      <input
                        type="number"
                        value={editBatchData.unit_price}
                        onChange={(e) => setEditBatchData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setEditingBatch(null)}
                        className="px-3 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBatchEdit}
                        className="px-3 py-2 bg-primary-600 dark:bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t('common.save')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            {errors.submit && <p className="text-red-600 dark:text-red-400 text-sm ltr:mr-auto rtl:ml-auto">{errors.submit}</p>}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="bg-primary-600 dark:bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{product ? t('productForm.submitUpdate') : t('productForm.submitAdd')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};