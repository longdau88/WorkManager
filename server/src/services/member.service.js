import { memberRepository } from '../repositories/member.repository.js';

export const memberService = {
  async getAllMembers() {
    return await memberRepository.findAll();
  },

  async getMemberById(id) {
    const member = await memberRepository.findById(id);
    if (!member || member.deleted) {
      const err = new Error('Không tìm thấy thành viên');
      err.statusCode = 404;
      throw err;
    }
    return member;
  },

  async saveMember(data, userEmail = 'system') {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Tên ngắn không được để trống');
      err.statusCode = 400;
      throw err;
    }

    if (!data.email || !data.email.trim()) {
      const err = new Error('Email không được để trống');
      err.statusCode = 400;
      throw err;
    }

    const email = data.email.trim().toLowerCase();
    const existing = await memberRepository.findByEmail(email);
    if (existing && existing.id !== data.id && !existing.deleted) {
      const err = new Error(`Email "${email}" đã tồn tại cho thành viên (${existing.name})`);
      err.statusCode = 400;
      throw err;
    }

    const record = {
      ...data,
      name: data.name.trim(),
      email,
      fullName: (data.fullName || '').trim(),
      unit: (data.unit || '').trim(),
      phone: (data.phone || '').trim(),
      updatedBy: userEmail
    };

    return await memberRepository.upsert(record);
  },

  async deleteMember(id, userEmail = 'system') {
    const existing = await memberRepository.findById(id);
    if (!existing) {
      const err = new Error('Thành viên không tồn tại');
      err.statusCode = 404;
      throw err;
    }
    return await memberRepository.delete(id, true);
  }
};
