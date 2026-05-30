import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, X, Save, Search, Clock, Mail, Phone, MapPin, AlertCircle
} from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { useConfirm } from '../hooks/useConfirm';
import { mockVendors } from '../data/mockData';

const useMockData = globalThis.__USE_MOCK_DATA__ === true;

const API_URL = 'http://localhost:5000/api';

export const VendorManagement = () => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadVendors();
  }, []);

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

  const filteredVendors = vendors.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenForm = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      if (useMockData) {
        if (editingVendor) {
          setVendors((current) => current.map((vendor) => (
            vendor.id === editingVendor.id
              ? { ...vendor, ...formData, updated_at: new Date().toISOString().slice(0, 10) }
              : vendor
          )));
        } else {
          setVendors((current) => [
            ...current,
            {
              id: `sup-${Date.now()}`,
              ...formData,
              created_at: new Date().toISOString().slice(0, 10),
              updated_at: new Date().toISOString().slice(0, 10),
            },
          ]);
        }

        showNotification({
          type: 'success',
          title: editingVendor ? 'Vendor updated' : 'Vendor created',
          message: `${formData.name} was ${editingVendor ? 'updated' : 'added'} successfully`,
        });

        handleCloseForm();
        return;
      }

      const url = editingVendor 
        ? `${API_URL}/vendors/${editingVendor.id}`
        : `${API_URL}/vendors`;
      
      const method = editingVendor ? 'PUT' : 'POST';
      
      console.log('[SUBMIT] Sending request to:', url);
      console.log('[SUBMIT] Payload:', formData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('[RESPONSE] Status:', response.status);
      const responseData = await response.json();
      console.log('[RESPONSE] Data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: Failed to save vendor`);
      }

      showNotification({
        type: 'success',
        title: editingVendor ? 'Vendor updated' : 'Vendor created',
        message: `${formData.name} was ${editingVendor ? 'updated' : 'added'} successfully`,
      });

      handleCloseForm();
      loadVendors();
    } catch (error) {
      console.error('[ERROR] Submit failed:', error);
      let errorMessage = error.message;
      
      // Parse specific error messages
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        if (errorMessage.includes('email')) {
          errorMessage = 'This email is already registered for another vendor';
        } else if (errorMessage.includes('name')) {
          errorMessage = 'A vendor with this name already exists';
        } else {
          errorMessage = 'This vendor information already exists';
        }
      }

      showNotification({
        type: 'error',
        title: 'Save failed',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendor) => {
    const isConfirmed = await confirm({
      title: 'Delete vendor',
      message: `Are you sure you want to delete ${vendor.name}?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!isConfirmed) return;

    try {
      setLoading(true);

      if (useMockData) {
        setVendors((current) => current.filter((item) => item.id !== vendor.id));

        showNotification({
          type: 'success',
          title: 'Vendor deleted',
          message: `${vendor.name} has been removed`,
        });

        return;
      }

      const response = await fetch(`${API_URL}/vendors/${vendor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete vendor');

      showNotification({
        type: 'success',
        title: 'Vendor deleted',
        message: `${vendor.name} has been removed`,
      });

      loadVendors();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-50">Vendor Management</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-200">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleString()}</span>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white shadow-md transition-colors hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
            placeholder="Search by vendor name, email, or phone..."
          />
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="card overflow-hidden border-l-4 border-l-blue-600 dark:border-l-blue-500 hover:shadow-lg dark:hover:shadow-glow-purple transition-all">
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">{vendor.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenForm(vendor)}
                      className="rounded p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      title="Edit vendor"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor)}
                      className="rounded p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Delete vendor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {vendor.email && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="break-all text-gray-700 dark:text-slate-300">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-slate-300">{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-start space-x-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-slate-300">{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="mt-4 space-y-1 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-200">
                  <p>Added: {new Date(vendor.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(vendor.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          {searchTerm ? (
            <>
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 dark:text-slate-200">No vendors found</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-200">Try adjusting your search criteria</p>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 dark:text-slate-200">No vendors yet</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-200">Click "Add Vendor" to create your first vendor</p>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Vendor Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  {editingVendor ? (
                    <Edit2 className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Plus className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
              </div>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Vendor Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-field ${errors.name ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}
                  placeholder="Enter vendor name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field ${errors.email ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}
                    placeholder="vendor@example.com"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="input-field textarea-field"
                  placeholder="Street address, city, postal code"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-end dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
