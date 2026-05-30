import { createSimpleCrudModel } from './crudHelpers.js';
import { query } from '../config/db.js';

const categoriesCrud = createSimpleCrudModel({
  table: 'categories',
  columns: ['name', 'description'],
});

export const getAllCategories = categoriesCrud.getAll;
export const getCategoryById = categoriesCrud.getById;
export const createCategory = categoriesCrud.create;
export const updateCategory = categoriesCrud.update;
export const deleteCategory = categoriesCrud.remove;

export const getCategoryByName = async (name) => {
  const result = await query('SELECT id, name, description, created_at, updated_at FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);
  return result.rows[0] ?? null;
};

export const ensureCategory = async (name, description = null) => {
  const existing = await getCategoryByName(name);

  if (existing) {
    return existing;
  }

  return createCategory({ name, description });
};
