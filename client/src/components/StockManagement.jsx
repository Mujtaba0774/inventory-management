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
import { mockVendors } from '../data/mockData';
import Pagination from './Pagination';

const useMockData = globalThis.__USE_MOCK_DATA__ === true;
const ADD_NEW_PRODUCT_VALUE = '__add_new_product__';
const ADD_NEW_VENDOR_VALUE = '__add_new_vendor__';

export const StockManagement = ({ onEditProduct, onAddProduct, onNavigateToSalesHistory, onNavigateToDamagesHistory }) => {
  const { products, stockMovements, updateStock, getBatchesForProduct } = useProducts();
  const { showNotification } = useNotification();
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
          throw new Error('Failed to load vendors');
        }

        const data = await response.json();
        setVendors(data.vendors ?? data.vendors ?? data.vendors ?? []);
      } catch (error) {
        showNotification({
          type: 'warning',
          title: 'Vendors unavailable',
          message: error.message || 'Could not load vendors list.',
        });
      }
    };

    loadVendors();
  }, [showNotification]);

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
      throw new Error('Vendor name is required');
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
      throw new Error(data.message || 'Failed to create vendor');
    }

    const createdVendor = data.vendor;

    if (!createdVendor?.id) {
      throw new Error('Vendor created but missing id');
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
        title: 'Missing details',
        message: 'Select a product, set quantity, and choose a reason.',
      });
      return;
    }

    if (requiresVendor && !selectedVendor) {
      showNotification({
        type: 'warning',
        title: 'Vendor required',
        message: 'Choose the vendor for this buy/sell movement.',
      });
      return;
    }

    const product = products.find((item) => String(item.id) === String(selectedProduct));

    if (!product) {
      showNotification({
        type: 'error',
        title: 'Product not found',
        message: 'The selected product could not be matched.',
      });
      return;
    }

    if (movementType === 'out' && availableStock - quantity < 0) {
      showNotification({
        type: 'warning',
        title: 'Insufficient stock',
        message: `You only have ${availableStock} units available.`,
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
        title: 'Stock updated',
        message: `${product.name} stock was adjusted successfully.`,
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
        title: 'Stock update failed',
        message: error.message || 'Failed to update stock',
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">Stock Management</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-200">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Update Form */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">Update Stock</h2>
          </div>

          <form onSubmit={handleStockUpdate} className="space-y-3">
            {/* Product Search */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Search Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search by name or SKU..."
                />
              </div>
              {!hasAnyProducts && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-700 dark:border-red-500 dark:bg-red-900 dark:text-red-300">
                  <p>No products found yet. Add a product first to manage stock.</p>
                  <button
                    type="button"
                    onClick={() => onAddProduct?.()}
                    className="mt-2 inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Add Product
                  </button>
                </div>
              )}
              {hasAnyProducts && searchTerm.trim() && !hasMatchingProducts && (
                <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <p>No product matches your search. You can add it as a new product.</p>
                  <button
                    type="button"
                    onClick={() => onAddProduct?.()}
                    className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Add Product
                  </button>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Select Product *
              </label>
              <select
                value={selectedProduct}
                onChange={handleProductSelectChange}
                className="input-field"
                required
              >
                <option value="">Choose a product</option>
                {filteredProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku} (Current: {Number(batchSummaryByProduct[product.id]?.totalQuantity ?? product.stock ?? 0)})
                  </option>
                ))}
                <option value={ADD_NEW_PRODUCT_VALUE}>+ Add new product</option>
              </select>
            </div>

            {/* Current Stock Display */}
            {selectedProductData && (
              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-50">{selectedProductData.name}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-200">SKU: <span className="font-medium text-gray-900 dark:text-slate-50">{selectedProductData.sku}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-slate-50">{availableStock}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-200">Current Stock</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-slate-200">
                    <div>Selling: <span className="font-medium text-gray-900 dark:text-slate-50">₨ {Number(selectedProductData.price ?? 0).toFixed(2)}</span></div>
                    <div>Cost: <span className="font-medium text-gray-900 dark:text-slate-50">₨ {Number(selectedProductData.cost ?? 0).toFixed(2)}</span></div>
                  </div>
                  <div />
                </div>
                {availableStock === 0 && (
                  <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                    <p className="text-xs text-red-700">
                      ❌ Out of stock
                    </p>
                  </div>
                )}
                {availableStock > 0 && availableStock <= Number(selectedProductData.minStock ?? 0) && (
                  <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-200">
                    <p className="text-xs text-orange-700">
                      ⚠️ Below minimum stock level ({selectedProductData.minStock})
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Movement Type */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Movement Type *
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
                  <span>Stock In</span>
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
                  <span>Stock Out</span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
                <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
                className="input-field"
                placeholder="Enter quantity"
                required
                  disabled={!hasMatchingProducts}
              />
            </div>

            {/* New Selling Price */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">New Selling Price (optional)</label>
              <input
                type="number"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(e.target.value)}
                min="0"
                step="1"
                className="input-field"
                placeholder="Set as new product selling price"
              />
            </div>

            {/* New Cost Price */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">New Cost Price (optional)</label>
              <input
                type="number"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                min="0"
                step="1"
                className="input-field"
                placeholder="Set as new product cost price"
              />
            </div>

            {/* Batch Selection (for Stock Out) */}
            {movementType === 'out' && batches.length > 0 && (
              <div>
                <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Select Batch (Optional - FIFO default)
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="input-field"
                >
                  <option value="">Use oldest batch (FIFO)</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.vendor_name || batch.vendor_name || 'No Vendor'} - Cost ₨ {Number(batch.unit_price ?? 0).toFixed(2)} ({batch.quantity} units)
                    </option>
                  ))}
                </select>
                {selectedBatchData && (
                  <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900 dark:border-blue-500 p-3 text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium">Selected batch</p>
                    <p>Batch Cost: ₨ {Number(selectedBatchData.unit_price ?? 0).toFixed(2)}</p>
                    <p>Available: {selectedBatchData.quantity} units</p>
                    <p className="text-xs mt-1">If the requested quantity is larger than this batch, the rest will be taken from older batches automatically.</p>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Reason *
              </label>
                <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select reason</option>
                {movementType === 'in' ? (
                  <>
                    <option value="Purchase">Purchase</option>
                    <option value="Restock">Restock</option>
                    <option value="Return">Return</option>
                  </>
                ) : (
                  <>
                    <option value="Sale">Sale</option>
                    <option value="Damage">Damage</option>
                    <option value="Loss">Loss</option>
                    <option value="Return to Vendor">Return to Vendor</option>
                  </>
                )}
              </select>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Vendor {requiresVendor ? '*' : '(Optional)'}
              </label>
              <select
                value={selectedVendor}
                onChange={handleVendorSelectChange}
                className="input-field"
                required={requiresVendor}
              >
                <option value="">{requiresVendor ? 'Select vendor' : 'No vendor selected'}</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
                <option value={ADD_NEW_VENDOR_VALUE}>+ Add new vendor</option>
              </select>
              {isAddingNewVendor && (
                <input
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="input-field mt-2"
                  placeholder="Type new vendor name"
                  required={requiresVendor}
                />
              )}
            </div>

            {/* Movement Date Time */}
            <div>
              <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-1">
                Date and Time *
              </label>
              <div className="relative">
                <input
                  ref={movementDateInputRef}
                  type="datetime-local"
                  value={movementDateTime}
                  onChange={(e) => setMovementDateTime(e.target.value)}
                  className="input-field pr-10 no-native-picker"
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
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-300"
                  aria-label="Open date picker"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>

            {estimatedTotal !== null && (
              <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-900 dark:border-green-500 p-3 text-sm text-green-900 dark:text-green-100">
                <p className="font-medium">Calculated total</p>
                <p>
                  {quantity} x ₨ {movementBasePrice.toFixed(2)} = ₨ {estimatedTotal.toFixed(2)}
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
              {movementType === 'in' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </form>
        </div>

        {/* Recent Stock Movements */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-300">Recent Movements</h2>
          </div>

          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-200 text-center py-8">No stock movements yet</p>
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
                    className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'in' ? 'bg-green-100 dark:bg-green-700' : 'bg-red-100 dark:bg-red-600'
                      }`}>
                        {getMovementIcon(movement.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-300">{product?.name}</p>
                        <p className={`text-sm ${movementTextColor}`}>{movement.reason}</p>
                        {(movement.vendor_name || movement.vendor_name) && (
                          <p className="text-xs text-gray-500 dark:text-slate-200">Vendor: {movement.vendor_name || movement.vendor_name}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-slate-200">{formatMovementDate(movement.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {movementTotalAmount !== null && movementTotalAmount !== undefined && (
                        <p className={`text-sm font-medium ${movementTextColor}`}>
                          Rs {Number(movementTotalAmount).toFixed(2)}
                        </p>
                      )}
                      <p className={`font-bold ${
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-6">Inventory Batches</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">Vendor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">Unit Price</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">Quantity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">Total Value</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">Batch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {pagedBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 whitespace-nowrap">{batch.vendor_name || batch.vendor_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 whitespace-nowrap">Rs {Number(batch.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 whitespace-nowrap">{batch.quantity} units</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-50 font-medium whitespace-nowrap">
                      Rs {(Number(batch.unit_price) * batch.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-200 text-xs whitespace-nowrap">
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