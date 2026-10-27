import { fieldRepository } from '../repositories/field.repository.js';

export const fieldService = {
  async getAllFields() {
    return await fieldRepository.findAll();
  },

  async getFieldById(id) {
    const field = await fieldRepository.findById(id);
    if (!field || field.deleted) {
      const err = new Error('Không tìm thấy trường');
      err.statusCode = 404;
      throw err;
    }
    return field;
  },

  async saveField(data, userEmail = 'system') {
    if (!data.label || !data.label.trim()) {
      const err = new Error('Tên trường không được để trống');
      err.statusCode = 400;
      throw err;
    }

    const record = {
      ...data,
      label: data.label.trim(),
      updatedBy: userEmail
    };

    return await fieldRepository.upsert(record);
  },

  async deleteField(id, userEmail = 'system') {
    const existing = await fieldRepository.findById(id);
    if (!existing) {
      const err = new Error('Trường không tồn tại');
      err.statusCode = 404;
      throw err;
    }
    return await fieldRepository.delete(id, true);
  }
};
