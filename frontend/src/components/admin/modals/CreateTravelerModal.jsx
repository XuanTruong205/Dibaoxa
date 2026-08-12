import { Award, CheckCircle2, User, UserPlus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function CreateTravelerModal({ isOpen, onClose, onSuccess, initialData = null }) {
  // All input fields leave completely BLANK initially when opened!
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFullName(initialData?.full_name || initialData?.fullName || '');
    setEmail(initialData?.email || '');
    setPhone(initialData?.phone || '');
    setPassword('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const created = {
      fullName,
      email,
      phone,
      password,
      bookingsCount: 0,
      totalSpent: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    try {
      if (onSuccess) await onSuccess(created);
      onClose();
    } catch {
      // Keep the modal open so the user can correct or retry the request.
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
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{initialData ? 'Chỉnh Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}</h2>
            <p className="text-xs text-slate-500 font-medium">{initialData ? 'Cập nhật hồ sơ; để trống mật khẩu nếu không muốn đổi.' : 'Đăng ký tài khoản hồ sơ du khách mới.'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên khách hàng *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email đăng ký *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại liên hệ *</label>
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
            <label className="text-xs font-bold text-slate-700 block mb-1">{initialData ? 'Mật khẩu mới (không bắt buộc)' : 'Mật khẩu tạm thời *'}</label>
            <input
              type="password"
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required={!initialData}
            />
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
              {initialData ? 'Lưu Thay Đổi' : 'Lưu Hồ Sơ Khách Hàng'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
