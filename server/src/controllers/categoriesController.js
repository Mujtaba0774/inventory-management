import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from '../models/categoriesModel.js';

export const listCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await getCategoryById(req.params.id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

export const addCategory = async (req, res, next) => {
  try {
    const { name, description = null } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }

    const category = await createCategory({
      name: name.trim(),
      description,
    });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

export const editCategory = async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim() === '') {
        res.status(400).json({ message: 'Category name must be a non-empty string' });
        return;
      }
      updates.name = req.body.name.trim();
    }

    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }

    const category = await updateCategory(req.params.id, updates);

    if (!category) {
      res.status(404).json({ message: 'Category not found or no fields provided' });
      return;
    }

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    next(error);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    const deleted = await deleteCategory(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
