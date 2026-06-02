import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, 
  Mail, Phone, MapPin, Filter, Search, Clock
} from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { useConfirm } from '../hooks/useConfirm';
import { mockVendors, mockVendorTransactions } from '../data/mockData';
import Pagination from './Pagination';

const API_URL = 'http://localhost:5000/api';
const useMockData = globalThis.__USE_MOCK_DATA__ === true;
const MOCK_VENDOR_TRANSACTIONS_STORAGE_KEY = 'wms.mockVendorTransactions';

const getPersistedMockVendorTransactions = () => {
  try {
    const stored = localStorage.getItem(MOCK_VENDOR_TRANSACTIONS_STORAGE_KEY);
    if (!stored) {
      return [...mockVendorTransactions];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...mockVendorTransactions];
  } catch (error) {
    return [...mockVendorTransactions];
  }
};

const setPersistedMockVendorTransactions = (transactions) => {
  try {
    localStorage.setItem(MOCK_VENDOR_TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    // Ignore storage failures in mock mode.
  }
};

const calculateBalance = (items) => items.reduce((accumulator, item) => {
  if (item.transaction_type === 'IN') {
    accumulator.total_purchased += Number(item.amount || 0);
    accumulator.remaining_amount += Number(item.amount || 0);
  } else if (item.transaction_type === 'OUT') {
    accumulator.total_paid += Number(item.amount || 0);
    accumulator.remaining_amount -= Number(item.amount || 0);
  }

  return accumulator;
}, {
  total_purchased: 0,
  total_paid: 0,
  remaining_amount: 0,
});

export const VendorTransactions = () => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState({
    total_purchased: 0,
    total_paid: 0,
    remaining_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  // Pagination (10 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [formData, setFormData] = useState({
    transaction_type: 'IN',
    amount: 0,
    description: '',
    notes: '',
    reference_no: '',
  });

  const filteredVendors = vendors.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.transaction_type === filterType;
  });

  // Reset to first page when filters/search/transactions/selection change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm, selectedVendor?.id, transactions.length]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      loadVendorData();
    }
  }, [selectedVendor]);

  useEffect(() => {
    const handleMockVendorTransactionsUpdated = () => {
      if (selectedVendor) {
        loadVendorData();
      }
    };

    window.addEventListener('wms:mockVendorTransactionsUpdated', handleMockVendorTransactionsUpdated);

    return () => {
      window.removeEventListener('wms:mockVendorTransactionsUpdated', handleMockVendorTransactionsUpdated);
    };
  }, [selectedVendor]);

  const loadVendors = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        setVendors(mockVendors.map((vendor) => ({ ...vendor })));
        return;
      }

      const response = await fetch(`${API_URL}/vendors`);
      if (!response.ok) throw new Error('Failed to load vendors');
      const data = await response.json();
      setVendors(data.vendors || data.vendors || []);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Load failed',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendorData = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        const vendorTransactions = getPersistedMockVendorTransactions().filter(
          (transaction) => String(transaction.vendor_id ?? transaction.vendor_id) === String(selectedVendor.id)
        );

        setTransactions(vendorTransactions);
        setBalance(calculateBalance(vendorTransactions));
        return;
      }

      const [transRes, balanceRes] = await Promise.all([
        fetch(`${API_URL}/vendors/${selectedVendor.id}/transactions`),
        fetch(`${API_URL}/vendors/${selectedVendor.id}/financial-summary`),
      ]);

      if (!transRes.ok || !balanceRes.ok) throw new Error('Failed to load data');

      const transData = await transRes.json();
      const balData = await balanceRes.json();

      setTransactions(transData.transactions || []);
      setBalance(transData.balance || balData);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Load failed',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      if (!formData.amount || formData.amount <= 0) {
        showNotification({
          type: 'error',
          title: 'Invalid amount',
          message: 'Please enter a valid amount',
        });
        return;
      }

      setLoading(true);

      if (useMockData) {
        const nextTransaction = {
          id: `STX-${Date.now()}`,
          vendor_id: selectedVendor.id,
          transaction_type: formData.transaction_type,
          amount: Number(formData.amount),
          description: formData.description,
          notes: formData.notes,
          reference_no: formData.reference_no,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const persistedTransactions = getPersistedMockVendorTransactions();
        const nextTransactions = [nextTransaction, ...persistedTransactions];
        setPersistedMockVendorTransactions(nextTransactions);
        setTransactions(nextTransactions);
        setBalance(calculateBalance(nextTransactions));

        showNotification({
          type: 'success',
          title: 'Transaction added',
          message: `${formData.transaction_type === 'IN' ? 'Cash in' : 'Cash out'} of RS ${formData.amount} recorded`,
        });

        setShowTransactionDialog(false);
        setFormData({
          transaction_type: 'IN',
          amount: 0,
          description: '',
          notes: '',
          reference_no: '',
        });

        return;
      }

      const response = await fetch(`${API_URL}/vendors/${selectedVendor.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add transaction');

      showNotification({
        type: 'success',
        title: 'Transaction added',
        message: `${formData.transaction_type === 'IN' ? 'Cash in' : 'Cash out'} of RS ${formData.amount} recorded`,
      });

      setShowTransactionDialog(false);
      setFormData({
        transaction_type: 'IN',
        amount: 0,
        description: '',
        notes: '',
        reference_no: '',
      });

      loadVendorData();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to add transaction',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const isConfirmed = await confirm({
      title: 'Delete transaction',
      message: 'Are you sure you want to delete this transaction?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!isConfirmed) return;

    try {
      setLoading(true);

      if (useMockData) {
        const nextTransactions = getPersistedMockVendorTransactions().filter((transaction) => transaction.id !== transactionId);
        setPersistedMockVendorTransactions(nextTransactions);
        setTransactions(nextTransactions);
        setBalance(calculateBalance(nextTransactions));

        showNotification({
          type: 'success',
          title: 'Transaction deleted',
          message: 'Transaction has been removed',
        });

        return;
      }

      const response = await fetch(`${API_URL}/vendors/${selectedVendor.id}/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      showNotification({
        type: 'success',
        title: 'Transaction deleted',
        message: 'Transaction has been removed',
      });

      loadVendorData();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const openTransactionDialog = (type) => {
    setFormData(prev => ({ ...prev, transaction_type: type }));
    setShowTransactionDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">Vendor Accounts</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="truncate">Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Vendors List Sidebar */}
        <div className="xl:col-span-1">
          <div className="card h-fit rounded-md">
            {/* Header */}
            <div className="p-5  border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">Vendors</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field text-sm pl-10"
                  placeholder="Search vendors..."
                />
              </div>
            </div>

            {/* Vendors List */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              {filteredVendors.length > 0 ? (
                filteredVendors.map(vendor => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`w-full text-left px-6 py-4 border-t border-gray-100 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all ${
                      selectedVendor?.id === vendor.id 
                        ? 'bg-blue-50 border-l-4 border-l-blue-600 dark:bg-blue-900/20 dark:border-l-blue-400' 
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-slate-50 truncate">{vendor.name}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-200 flex items-center space-x-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{vendor.email || 'No email'}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No vendors found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3">
          {selectedVendor ? (
            <div className="space-y-6">
              {/* Vendor Card */}
              <div className="card p-6 border-l-4 border-l-blue-600 hover:shadow-lg dark:hover:shadow-glow-purple transition-all bg-white dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">{selectedVendor.name}</h2>
                    <div className="space-y-2 mt-3 text-gray-600 dark:text-slate-200">
                      {selectedVendor.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4" />
                          <span className="dark:text-slate-200">{selectedVendor.email}</span>
                        </div>
                      )}
                      {selectedVendor.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span className="dark:text-slate-200">{selectedVendor.phone}</span>
                        </div>
                      )}
                      {selectedVendor.address && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span className="dark:text-slate-200">{selectedVendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-6 hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Total Purchased</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        Rs {Number(balance.total_purchased || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-700 font-medium dark:text-slate-200 mt-2">Cash In</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-600 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600  dark:text-green-200" />
                    </div>
                  </div>
                </div>

                <div className="card p-6 hover:shadow-lg dark:hover:shadow-glow-purple transition-all ">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Total Paid</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        Rs {Number(balance.total_paid || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-700 font-medium dark:text-slate-200 mt-2">Cash Out</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-600 p-3 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-red-600  dark:text-red-200" />
                    </div>
                  </div>
                </div>

                <div className={`card p-6 hover:shadow-lg dark:hover:shadow-glow-purple transition-all ${
                  Number(balance.remaining_amount) >= 0 
                    ? 'bg-gradient-to-br from-blue-900 to-blue-600 dark:from-blue-600 dark:to-blue-00' 
                    : 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500 dark:to-amber-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${Number(balance.remaining_amount) >= 0 ? 'text-blue-100' : 'text-amber-700 dark:text-amber-50'}`}>
                        {Number(balance.remaining_amount) >= 0 ? 'We Owe' : 'They Owe'}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${Number(balance.remaining_amount) >= 0 ? 'text-blue-100' : 'text-amber-700 dark:text-amber-50'}`}>
                        Rs {Math.abs(Number(balance.remaining_amount || 0)).toFixed(2)}
                      </p>
                      <p className={`text-sm font-bold mt-2 ${Number(balance.remaining_amount) >= 0 ? 'text-blue-50' : 'text-amber-700 dark:text-amber-50'}`}>Outstanding Balance</p>
                    </div>
                    <div className={`p-3 rounded-lg ${Number(balance.remaining_amount) >= 0 ? 'bg-blue-50 dark:bg-blue-50' : 'bg-amber-700 dark:bg-amber-50'}`}>
                      <div className={`h-5  ${Number(balance.remaining_amount) >= 0 ? 'text-blue-600' : 'text-amber-50 dark:text-amber-600'}`} >Rs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => openTransactionDialog('IN')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 shadow-md sm:w-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Record Purchase</span>
                </button>
                <button
                  onClick={() => openTransactionDialog('OUT')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700 shadow-md sm:w-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {/* Transaction History */}
                <div className="card overflow-hidden bg-white dark:bg-slate-900">
                {/* Header with Filter */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="all">All Transactions</option>
                      <option value="IN">Purchases Only</option>
                      <option value="OUT">Payments Only</option>
                    </select>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">Description</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">Reference</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {filteredTransactions.length > 0 ? (
                        pagedTransactions.map(transaction => (
                          <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                              {new Date(transaction.transaction_date).toLocaleDateString('en-PK', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="whitespace-nowrap text-sm">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                transaction.transaction_type === 'IN'
                                  ? 'bg-green-400 dark:bg-green-700 text-green-800 dark:text-green-100'
                                  : 'bg-red-200 dark:bg-red-700 text-red-700 dark:text-red-100'
                              }`}>
                                {transaction.transaction_type === 'IN' ? 'Purchase' : 'Payment'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-slate-50">
                              Rs {Number(transaction.amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-200 whitespace-nowrap">
                              {transaction.description || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-200 whitespace-nowrap">
                              {transaction.reference_no || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                                title="Delete transaction"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-slate-200">
                            <p className="font-medium">No transactions found</p>
                            <p className="text-sm">Start by recording a purchase or payment</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredTransactions.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 rounded-lg   text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-200 text-lg font-medium ">Select a vendor to view their account</p>
              <p className="text-gray-500 dark:text-slate-300 text-sm mt-2">Choose from the vendor list to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Dialog */}
      {showTransactionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card-lg w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${formData.transaction_type === 'IN' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {formData.transaction_type === 'IN' ? (
                    <TrendingUp className={`h-5 w-5 ${formData.transaction_type === 'IN' ? 'text-green-600' : 'text-red-600'}`} />
                  ) : (
                    <TrendingDown className={`h-5 w-5 ${formData.transaction_type === 'IN' ? 'text-green-600' : 'text-red-600'}`} />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {formData.transaction_type === 'IN' ? 'Record Purchase' : 'Record Payment'}
                </h3>
              </div>
              <button
                onClick={() => setShowTransactionDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
                <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (Rs) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Invoice #123"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="reference_no"
                  value={formData.reference_no}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., CHQ-456"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="input-field textarea-field"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setShowTransactionDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={loading}
                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Recording...' : 'Record Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
