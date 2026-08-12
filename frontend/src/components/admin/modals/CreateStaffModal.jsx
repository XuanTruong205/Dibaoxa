import { CheckCircle2, Shield, UserCheck, UserPlus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

function normalizeStaffRole(value) {
  const normalized = String(value || '').toLocaleLowerCase('vi');
  if (normalized.includes('hướng dẫn')) return 'Hướng dẫn viên du lịch';
  if (normalized.includes('quản lý')) return 'Quản lý cơ sở';
  return 'Nhân viên lễ tân';
}

export default function CreateStaffModal({ isOpen, onClose, onSuccess, initialData = null }) {
  // All input fields leave completely BLANK initially when opened!
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Nhân viên lễ tân');
  const [phone, setPhone] = useState('');
  const [assignedHotel, setAssignedHotel] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (!isOpen) return;
    setFullName(initialData?.full_name || initialData?.fullName || '');
    setRole(normalizeStaffRole(initialData?.job_title || initialData?.role));
    setPhone(initialData?.phone || '');
    setAssignedHotel(initialData?.assigned_hotel || initialData?.assignedHotel || '');
    setEmail(initialData?.email || '');
    setStatus(initialData?.status || 'active');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const created = {
      fullName,
      role,
      phone,
      assignedHotel,
      email,
      status,
      joinedAt: new Date().toLocaleDateString('vi-VN'),
    };

    try {
      if (onSuccess) await onSuccess(created);
      onClose();
    } catch {
      // Keep the modal open so the user can retry.
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all font-bold cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{initialData ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên / Hướng Dẫn Viên'}</h2>
            <p className="text-xs text-slate-500 font-medium">{initialData ? 'Cập nhật phân công và trạng thái nhân sự.' : 'Tạo hồ sơ nhân sự vận hành mới.'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên nhân viên *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Vị trí / Chức danh</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 cursor-pointer"
            >
              <option value="Nhân viên lễ tân">Nhân Viên Lễ Tân (Receptionist)</option>
              <option value="Hướng dẫn viên du lịch">Hướng Dẫn Viên Du Lịch (Tour Guide)</option>
              <option value="Quản lý cơ sở">Quản Lý Cơ Sở (Hotel Manager)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email (không bắt buộc)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nhanvien@dibaoxa.vn" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Cơ sở / Khách sạn phụ trách *</label>
            <input
              type="text"
              value={assignedHotel}
              onChange={(e) => setAssignedHotel(e.target.value)}
              placeholder="Nhập tên khách sạn phụ trách..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800">
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="btn-primary py-2.5 px-6 text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {initialData ? 'Lưu Thay Đổi' : 'Lưu Nhân Viên'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
