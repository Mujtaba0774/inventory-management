import {
  createVendor,
  deleteVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  addVendorTransaction,
  getVendorTransactions,
  getVendorBalance,
  deleteVendorTransaction,
} from '../models/vendorsModel.js';

export const listVendors = async (req, res, next) => {
  try {
    const vendors = await getAllVendors();
    res.status(200).json({ vendors });
  } catch (error) {
    next(error);
  }
};

export const getVendor = async (req, res, next) => {
  try {
    const vendor = await getVendorById(req.params.id);

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    res.status(200).json({ vendor });
  } catch (error) {
    next(error);
  }
};

export const addVendor = async (req, res, next) => {
  try {
    let { name, email = null, phone = null, address = null } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Vendor name is required' });
      return;
    }

    // Convert empty string to null for optional fields to avoid unique constraint issues
    email = email?.trim() || null;
    phone = phone?.trim() || null;
    address = address?.trim() || null;

    const vendor = await createVendor({
      name: name.trim(),
      email,
      phone,
      address,
    });

    res.status(201).json({ message: 'Vendor created successfully', vendor });
  } catch (error) {
    next(error);
  }
};

export const editVendor = async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim() === '') {
        res.status(400).json({ message: 'Vendor name must be a non-empty string' });
        return;
      }
      updates.name = req.body.name.trim();
    }

    if (req.body.email !== undefined) {
      updates.email = req.body.email?.trim() || null;
    }

    if (req.body.phone !== undefined) {
      updates.phone = req.body.phone?.trim() || null;
    }

    if (req.body.address !== undefined) {
      updates.address = req.body.address?.trim() || null;
    }

    const vendor = await updateVendor(req.params.id, updates);

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found or no fields provided' });
      return;
    }

    res.status(200).json({ message: 'Vendor updated successfully', vendor });
  } catch (error) {
    next(error);
  }
};

export const removeVendor = async (req, res, next) => {
  try {
    const deleted = await deleteVendor(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Transaction endpoints
export const recordVendorTransaction = async (req, res, next) => {
  try {
    const { id: vendorId } = req.params;
    const { transaction_type, amount, description, notes, reference_no } = req.body;

    // Validate inputs
    if (!transaction_type || !['IN', 'OUT'].includes(transaction_type)) {
      res.status(400).json({ message: 'Transaction type must be "IN" or "OUT"' });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: 'Amount must be a positive number' });
      return;
    }

    // Verify vendor exists
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const transaction = await addVendorTransaction(vendorId, {
      transaction_type,
      amount,
      description,
      notes,
      reference_no,
    });

    res.status(201).json({ message: 'Transaction recorded successfully', transaction });
  } catch (error) {
    next(error);
  }
};

export const getVendorTransactionHistory = async (req, res, next) => {
  try {
    const { id: vendorId } = req.params;

    // Verify vendor exists
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const transactions = await getVendorTransactions(vendorId);
    const balance = await getVendorBalance(vendorId);

    res.status(200).json({ transactions, balance });
  } catch (error) {
    next(error);
  }
};

export const getVendorFinancialSummary = async (req, res, next) => {
  try {
    const { id: vendorId } = req.params;

    // Verify vendor exists
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const balance = await getVendorBalance(vendorId);

    res.status(200).json({
      vendorId,
      vendorName: vendor.name,
      totalPurchased: balance.total_purchased,
      totalPaid: balance.total_paid,
      remainingAmount: balance.remaining_amount,
    });
  } catch (error) {
    next(error);
  }
};

export const removeVendorTransaction = async (req, res, next) => {
  try {
    const { id: vendorId, transactionId } = req.params;

    // Verify vendor exists
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const deleted = await deleteVendorTransaction(transactionId);
    if (!deleted) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

