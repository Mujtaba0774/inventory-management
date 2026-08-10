import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Package,
  Plus,
  Minus,
  TrendingUp,
  Clock,
  Search,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useBatchSummary } from '../hooks/useBatchSummary';
import { useNotification } from '../hooks/useNotification';
import { useLanguage } from '../hooks/useLanguage';
import { mockVendors } from '../data/mockData';
import Pagination from './Pagination';

const useMockData = globalThis.__USE_MOCK_DATA__ === true;
const ADD_NEW_PRODUCT_VALUE = '__add_new_product__';
const ADD_NEW_VENDOR_VALUE = '__add_new_vendor__';

export const StockManagement = ({ onEditProduct, onAddProduct, onNavigateToSalesHistory, onNavigateToDamagesHistory }) => {
  const { products, stockMovements, updateStock, getBatchesForProduct } = useProducts();
  const { showNotification } = useNotification();
  const { t, td, tEnum } = useLanguage();
  const productIds = useMemo(() => products.map((product) => product.id), [products]);
  const batchSummaryByProduct = useBatchSummary(productIds);
  const [vendors, setVendors] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [isAddingNewVendor, setIsAddingNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [movementType, setMovementType] = useState('in');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementDateTime, setMovementDateTime] = useState(() => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
  });
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [currentBatchPage, setCurrentBatchPage] = useState(1);
  const BATCH_PAGE_SIZE = 10;
  const movementDateInputRef = useRef(null);

  useEffect(() => {
    setSelectedBatch('');
  }, [selectedProduct, movementType]);

  useEffect(() => {
    setCurrentBatchPage(1);
  }, [selectedProduct, batches.length]);

  const selectedProductData = products.find((p) => String(p.id) === String(selectedProduct));
  const selectedBatchData = batches.find((batch) => String(batch.id) === String(selectedBatch));
  const selectedProductSummary = selectedProduct ? batchSummaryByProduct[selectedProduct] : null;
  const availableStock = selectedProductSummary
    ? Number(selectedProductSummary.totalQuantity ?? 0)
    : batches.length > 0
      ? batches.reduce((sum, batch) => sum + Number(batch.quantity ?? 0), 0)
      : Number(selectedProductData?.stock ?? 0);
  const movementBasePrice = movementType === 'in'
    ? Number(newCostPrice || selectedProductData?.cost || 0)
    : Number(newSellingPrice || selectedProductData?.price || 0);
  const estimatedTotal = quantity > 0 && movementBasePrice > 0
    ? Number((quantity * movementBasePrice).toFixed(2))
    : null;

  useEffect(() => {
    const loadVendors = async () => {
      try {
        if (useMockData) {
          setVendors(mockVendors.map((vendor) => ({ ...vendor })));
          return;
        }

        const response = await fetch('/api/vendors');

        if (!response.ok) {
          throw new Error(t('stock.loadVendorsFailed'));
        }

        const data = await response.json();
        setVendors(data.vendors ?? data.vendors ?? data.vendors ?? []);
      } catch (error) {
        showNotification({
          type: 'warning',
          title: t('stock.vendorsUnavailable'),
          message: error.message || t('stock.vendorsUnavailableMessage'),
        });
      }
    };

    loadVendors();
  }, [showNotification, t]);

  useEffect(() => {
    const loadBatches = async () => {
      if (selectedProduct) {
        try {
          const productBatches = await getBatchesForProduct(selectedProduct);
          setBatches(productBatches);
            } catch (error) {
          console.error('Error loading batches:', error);
          setBatches([]);
        }
      } else {
        setBatches([]);
      }
    };

    loadBatches();
  }, [selectedProduct, getBatchesForProduct]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const hasAnyProducts = products.length > 0;
  const hasMatchingProducts = filteredProducts.length > 0;

  const createVendorFromInput = async () => {
    const trimmedName = newVendorName.trim();

    if (!trimmedName) {
      throw new Error(t('stock.vendorNameRequired'));
    }

    const existingVendor = vendors.find(
      (vendor) => String(vendor.name ?? '').toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingVendor) {
      return String(existingVendor.id);
    }

    if (useMockData) {
      const createdVendor = {
        id: `mock-vendor-${Date.now()}`,
        name: trimmedName,
      };

      setVendors((current) => [createdVendor, ...current]);
      return createdVendor.id;
    }

    const response = await fetch('/api/vendors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || t('stock.vendorCreateFailed'));
    }

    const createdVendor = data.vendor;

    if (!createdVendor?.id) {
      throw new Error(t('stock.vendorMissingId'));
    }

    setVendors((current) => {
      const alreadyExists = current.some((vendor) => String(vendor.id) === String(createdVendor.id));
      return alreadyExists ? current : [createdVendor, ...current];
    });

    return String(createdVendor.id);
  };

  const handleProductSelectChange = (event) => {
    const value = event.target.value;

    if (value === ADD_NEW_PRODUCT_VALUE) {
      onAddProduct?.();
      return;
    }

    setSelectedProduct(value);
  };

  const handleVendorSelectChange = (event) => {
    const value = event.target.value;

    if (value === ADD_NEW_VENDOR_VALUE) {
      setIsAddingNewVendor(true);
      setSelectedVendor('');
      setNewVendorName('');
      return;
    }

    setIsAddingNewVendor(false);
    setNewVendorName('');
    setSelectedVendor(value);
  };

  const recentMovements = stockMovements.slice(0, 9);
  const batchTotalPages = Math.max(1, Math.ceil(batches.length / BATCH_PAGE_SIZE));
  const pagedBatches = batches.slice((currentBatchPage - 1) * BATCH_PAGE_SIZE, currentBatchPage * BATCH_PAGE_SIZE);
  const requiresVendor = ['Purchase', 'Restock', 'Sale', 'Return to Vendor'].includes(reason);
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0 || !reason.trim()) {
      showNotification({
        type: 'warning',
        title: t('stock.missingDetails'),
        message: t('stock.missingDetailsMessage'),
      });
      return;
    }

    if (requiresVendor && !selectedVendor) {
      showNotification({
        type: 'warning',
        title: t('stock.vendorRequiredTitle'),
        message: t('stock.vendorRequiredMessage'),
      });
      return;
    }

    const product = products.find((item) => String(item.id) === String(selectedProduct));

    if (!product) {
      showNotification({
        type: 'error',
        title: t('stock.productNotFound'),
        message: t('stock.productNotFoundMessage'),
      });
      return;
    }

    if (movementType === 'out' && availableStock - quantity < 0) {
      showNotification({
        type: 'warning',
        title: t('stock.insufficientStock'),
        message: t('stock.insufficientStockMessage', { count: availableStock }),
      });
      return;
    }

    try {
      let vendorId = selectedVendor || null;

      if (isAddingNewVendor || (!selectedVendor && newVendorName.trim())) {
        vendorId = await createVendorFromInput();
        setSelectedVendor(String(vendorId));
        setIsAddingNewVendor(false);
      }

      const movementDate = movementDateTime
        ? new Date(movementDateTime).toISOString()
        : null;

      // Record the movement on the server; stock-in batches are created there too.
      await updateStock(selectedProduct, quantity, movementType, reason, {
        vendorId,
        batchId: movementType === 'out' ? selectedBatch || null : null,
        productUnitPrice: newSellingPrice === '' ? null : Number(newSellingPrice),
        productUnitCost: newCostPrice === '' ? null : Number(newCostPrice),
        movementDateTime: movementDate,
      });
      
      const refreshedBatches = await getBatchesForProduct(selectedProduct);
      setBatches(refreshedBatches);

      showNotification({
        type: 'success',
        title: t('stock.updated'),
        message: t('stock.updatedMessage', { name: product.name }),
      });
      setQuantity(0);
      setNewSellingPrice('');
      setNewCostPrice('');
      setReason('');
      setSelectedVendor('');
      setIsAddingNewVendor(false);
      setNewVendorName('');
    } catch (error) {
      showNotification({
        type: 'error',
        title: t('stock.updateFailed'),
        message: error.message || t('stock.updateFailedMessage'),
      });
    }
  };

  const getMovementIcon = (type) => {
    return type === 'in' ? (
      <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-50" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-50" />
    );
  };

  const formatMovementDate = (value) => {
    if (!value) return '-';

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">{t('stock.title')}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-200">
          <Clock className="h-4 w-4" />
          <span>{t('stock.lastUpdated', { time: new Date().toLocaleString() })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Update Form */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{t('stock.updateStock')}</h2>
          </div>

          <form onSubmit={handleStockUpdate} className="space-y-3">
            {/* Product Search */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('stock.searchProduct')}
              </label>
              <div className="relative">
                <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field ltr:pl-10 rtl:pr-10"
                  placeholder={t('stock.searchPlaceholder')}
                />
              </div>
              {!hasAnyProducts && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-700 dark:border-red-500 dark:bg-red-900 dark:text-red-300">
                  <p>{t('stock.noProductsYet')}</p>
                  <button
                    type="button"
                    onClick={() => onAddProduct?.()}
                    className="mt-2 inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t('stock.addProduct')}
                  </button>
                </div>
              )}
              {hasAnyProducts && searchTerm.trim() && !hasMatchingProducts && (
                <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <p>{t('stock.noMatch')}</p>
                  <button
                    type="button"
                    onClick={() => onAddProduct?.()}
                    className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t('stock.addProduct')}
                  </button>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('stock.selectProduct')}
              </label>
              <select
                value={selectedProduct}
                onChange={handleProductSelectChange}
                className="input-field"
                required
              >
                <option value="">{t('stock.chooseProduct')}</option>
                {filteredProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {t('stock.productOption', {
                      name: td(product.name),
                      sku: product.sku,
                      stock: Number(batchSummaryByProduct[product.id]?.totalQuantity ?? product.stock ?? 0),
                    })}
                  </option>
                ))}
                <option value={ADD_NEW_PRODUCT_VALUE}>{t('stock.addNewProduct')}</option>
              </select>
            </div>

            {/* Current Stock Display */}
            {selectedProductData && (
              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-50">{td(selectedProductData.name)}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-200">{t('common.sku')}: <span className="font-medium text-gray-900 dark:text-slate-50 force-ltr">{selectedProductData.sku}</span></p>
                  </div>
                  <div className="text-end">
                    <p className="text-lg font-bold text-gray-900 dark:text-slate-50">{availableStock}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-200">{t('stock.currentStock')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-slate-200">
                    <div>{t('stock.selling')} <span className="font-medium text-gray-900 dark:text-slate-50 force-ltr">₨ {Number(selectedProductData.price ?? 0).toFixed(2)}</span></div>
                    <div>{t('stock.cost')} <span className="font-medium text-gray-900 dark:text-slate-50 force-ltr">₨ {Number(selectedProductData.cost ?? 0).toFixed(2)}</span></div>
                  </div>
                  <div />
                </div>
                {availableStock === 0 && (
                  <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                    <p className="text-xs text-red-700">
                      {t('stock.outOfStock')}
                    </p>
                  </div>
                )}
                {availableStock > 0 && availableStock <= Number(selectedProductData.minStock ?? 0) && (
                  <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-200">
                    <p className="text-xs text-orange-700">
                      {t('stock.belowMinimum', { count: selectedProductData.minStock })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Movement Type */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('stock.movementType')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('in')}
                  className={`p-3 rounded-md border-2 flex items-center justify-center space-x-2 transition-colors ${
                    movementType === 'in'
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400'
                      : 'border-gray-300 text-gray-600 hover:border-green-300 dark:hover:border-green-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('stock.stockIn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('out')}
                  className={`p-3 rounded-md border-2 flex items-center justify-center space-x-2 transition-colors ${
                    movementType === 'out'
                      ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-600 dark:text-red-50'
                      : 'border-gray-300 text-gray-600 hover:border-red-300 dark:hover:border-red-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  <span>{t('stock.stockOut')}</span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('stock.quantity')}
              </label>
                <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
                className="input-field"
                placeholder={t('stock.quantityPlaceholder')}
                required
                  disabled={!hasMatchingProducts}
              />
            </div>

            {/* New Selling Price */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">{t('stock.newSellingPrice')}</label>
              <input
                type="number"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(e.target.value)}
                min="0"
                step="1"
                className="input-field"
                placeholder={t('stock.newSellingPricePlaceholder')}
              />
            </div>

            {/* New Cost Price */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">{t('stock.newCostPrice')}</label>
              <input
                type="number"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                min="0"
                step="1"
                className="input-field"
                placeholder={t('stock.newCostPricePlaceholder')}
              />
            </div>

            {/* Batch Selection (for Stock Out) */}
            {movementType === 'out' && batches.length > 0 && (
              <div>
                <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('stock.selectBatch')}
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('stock.useOldestBatch')}</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {t('stock.batchOption', {
                        vendor: batch.vendor_name ? td(batch.vendor_name) : t('stock.noVendor'),
                        price: Number(batch.unit_price ?? 0).toFixed(2),
                        quantity: batch.quantity,
                      })}
                    </option>
                  ))}
                </select>
                {selectedBatchData && (
                  <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900 dark:border-blue-500 p-3 text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium">{t('stock.selectedBatch')}</p>
                    <p>{t('stock.batchCost', { price: Number(selectedBatchData.unit_price ?? 0).toFixed(2) })}</p>
                    <p>{t('stock.batchAvailable', { count: selectedBatchData.quantity })}</p>
                    <p className="text-xs mt-1">{t('stock.batchOverflowNote')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('stock.reason')}
              </label>
                <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                required
              >
                <option value="">{t('stock.selectReason')}</option>
                {movementType === 'in' ? (
                  <>
                    <option value="Purchase">{tEnum('reasons', 'Purchase')}</option>
                    <option value="Restock">{tEnum('reasons', 'Restock')}</option>
                    <option value="Return">{tEnum('reasons', 'Return')}</option>
                  </>
                ) : (
                  <>
                    <option value="Sale">{tEnum('reasons', 'Sale')}</option>
                    <option value="Damage">{tEnum('reasons', 'Damage')}</option>
                    <option value="Loss">{tEnum('reasons', 'Loss')}</option>
                    <option value="Return to Vendor">{tEnum('reasons', 'Return to Vendor')}</option>
                  </>
                )}
              </select>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {requiresVendor ? t('stock.vendorRequired') : t('stock.vendorOptional')}
              </label>
              <select
                value={selectedVendor}
                onChange={handleVendorSelectChange}
                className="input-field"
                required={requiresVendor}
              >
                <option value="">{requiresVendor ? t('stock.selectVendor') : t('stock.noVendorSelected')}</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {td(vendor.name)}
                  </option>
                ))}
                <option value={ADD_NEW_VENDOR_VALUE}>{t('stock.addNewVendor')}</option>
              </select>
              {isAddingNewVendor && (
                <input
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="input-field mt-2"
                  placeholder={t('stock.newVendorPlaceholder')}
                  required={requiresVendor}
                />
              )}
            </div>

            {/* Movement Date Time */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('stock.dateAndTime')}
              </label>
              <div className="relative">
                <input
                  ref={movementDateInputRef}
                  type="datetime-local"
                  value={movementDateTime}
                  onChange={(e) => setMovementDateTime(e.target.value)}
                  className="input-field ltr:pr-10 rtl:pl-10 no-native-picker"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = movementDateInputRef.current;
                    if (!input) return;
                    input.focus();
                    if (typeof input.showPicker === 'function') {
                      input.showPicker();
                    }
                  }}
                  className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center px-3 text-slate-500 dark:text-slate-300"
                  aria-label={t('stock.openDatePicker')}
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>

            {estimatedTotal !== null && (
              <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-900 dark:border-green-500 p-3 text-sm text-green-900 dark:text-green-100">
                <p className="font-medium">{t('stock.calculatedTotal')}</p>
                <p className="force-ltr">
                  {t('stock.calculatedTotalLine', {
                    quantity,
                    price: movementBasePrice.toFixed(2),
                    total: estimatedTotal.toFixed(2),
                  })}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                movementType === 'in'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {movementType === 'in' ? t('stock.addStock') : t('stock.removeStock')}
            </button>
          </form>
        </div>

        {/* Recent Stock Movements */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-300">{t('stock.recentMovements')}</h2>
          </div>

          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-200 text-center py-8">{t('stock.noMovements')}</p>
            ) : (
              recentMovements.map((movement) => {
                const product = products.find((p) => String(p.id) === String(movement.productId));
                const movementTextColor = movement.type === 'in'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-500';
                const resolvedUnitPrice = movement.unit_price ?? (
                  movement.type === 'out' ? product?.price : product?.cost
                );
                const movementTotalAmount = movement.total_amount ?? (
                  resolvedUnitPrice !== null && resolvedUnitPrice !== undefined
                    ? Number(resolvedUnitPrice) * Number(movement.quantity ?? 0)
                    : null
                );
                const handleMovementClick = () => {
                  if (movement.reason === 'Sale') {
                    onNavigateToSalesHistory?.();
                  } else if (movement.reason === 'Damage' || movement.reason === 'Loss') {
                    onNavigateToDamagesHistory?.();
                  } else {
                    onEditProduct?.(product);
                  }
                };
                return (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={handleMovementClick}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-start"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'in' ? 'bg-green-100 dark:bg-green-700' : 'bg-red-100 dark:bg-red-600'
                      }`}>
                        {getMovementIcon(movement.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-300">{td(product?.name)}</p>
                        <p className={`text-sm ${movementTextColor}`}>{tEnum('reasons', movement.reason)}</p>
                        {movement.vendor_name && (
                          <p className="text-xs text-gray-500 dark:text-slate-200">{t('stock.vendorLabel', { name: td(movement.vendor_name) })}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-slate-200 force-ltr">{formatMovementDate(movement.date)}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      {movementTotalAmount !== null && movementTotalAmount !== undefined && (
                        <p className={`text-sm font-medium force-ltr ${movementTextColor}`}>
                          Rs {Number(movementTotalAmount).toFixed(2)}
                        </p>
                      )}
                      <p className={`font-bold force-ltr ${
                        movement.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'
                      }`}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      {movement.reference && (
                        <p className="text-xs text-gray-500 dark:text-slate-200">{movement.reference}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inventory Batches */}
      {selectedProduct && batches.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-md shadow-md dark:shadow-lg dark:border dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-6">{t('stock.inventoryBatches')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">{t('stock.colVendor')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">{t('stock.colUnitPrice')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">{t('stock.colQuantity')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">{t('stock.colTotalValue')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">{t('stock.colBatchDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {pagedBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 whitespace-nowrap">{batch.vendor_name ? td(batch.vendor_name) : '-'}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 whitespace-nowrap numeric-cell">Rs {Number(batch.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 whitespace-nowrap">{t('stock.unitsCount', { count: batch.quantity })}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 font-medium whitespace-nowrap numeric-cell">
                      Rs {(Number(batch.unit_price) * batch.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-200 text-xs whitespace-nowrap numeric-cell">
                      {new Date(batch.batch_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {batches.length > 0 && (
            <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
              <Pagination currentPage={currentBatchPage} totalPages={batchTotalPages} onChange={setCurrentBatchPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};