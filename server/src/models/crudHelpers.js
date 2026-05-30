import { query } from '../config/db.js';

export const createSimpleCrudModel = ({
  table,
  columns,
  selectColumns = '*',
  orderBy = 'created_at DESC, id DESC',
}) => {
  const getAll = async () => {
    const result = await query(`SELECT ${selectColumns} FROM ${table} ORDER BY ${orderBy}`);
    return result.rows;
  };

  const getById = async (id) => {
    const result = await query(`SELECT ${selectColumns} FROM ${table} WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  };

  const create = async (data) => {
    const fields = columns.filter((column) => data[column] !== undefined);

    if (fields.length === 0) {
      throw new Error(`No valid fields provided for ${table}`);
    }

    const values = fields.map((field) => data[field]);
    const placeholders = fields.map((_, index) => `$${index + 1}`);

    const result = await query(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${selectColumns}`,
      values,
    );


    return result.rows[0];
  };

  const update = async (id, updates) => {
    const fields = columns.filter((column) => updates[column] !== undefined);

    if (fields.length === 0) {
      return null;
    }

    const values = fields.map((field) => updates[field]);
    const assignments = fields.map((field, index) => `${field} = $${index + 1}`);

    values.push(id);

    const result = await query(
      `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING ${selectColumns}`,
      values,
    );

    return result.rows[0] ?? null;
  };

  const remove = async (id) => {
    const result = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
};
