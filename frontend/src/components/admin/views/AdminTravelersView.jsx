import {
  Award,
  CheckCircle2,
  Inbox,
  Mail,
  Phone,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import CreateTravelerModal from '../modals/CreateTravelerModal';
import { useAdminStore } from '../../../store/useAdminStore';
import { useNotificationStore } from '../../../store/useNotificationStore';

export default function AdminTravelersView() {
  const { customers: travelers, addCustomer, updateCustomer, deleteCustomer } = useAdminStore();
  const notifySuccess = useNotificationStore((state) => state.success);
  const notifyError = useNotificationStore((state) => state.error);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState(null);

  const handleAddSuccess = async (newTraveler) => {
    try {
      const payload = {
        full_name: newTraveler.fullName,
        email: newTraveler.email,
        phone: newTraveler.phone,
        role: 'customer',
        ...(newTraveler.password && { password: newTraveler.password }),
      };
      if (editingTraveler) await updateCustomer(editingTraveler.id, payload);
      else await addCustomer(payload);
      notifySuccess(editingTraveler ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng', `${newTraveler.fullName} đã được lưu vào hệ thống.`);
      setEditingTraveler(null);
    } catch (error) {
      notifyError('Không thể lưu khách hàng', error.message || 'Vui lòng kiểm tra dữ liệu và thử lại.');
      throw error;
    }
  };

  const handleDelete = async (traveler) => {
    if (!window.confirm(`Xóa tài khoản ${traveler.full_name || traveler.email}?`)) return;
    try {
      await deleteCustomer(traveler.id);
      notifySuccess('Đã xóa tài khoản', `${traveler.full_name || traveler.email} đã được gỡ khỏi hệ thống.`);
    } catch (error) {
      notifyError('Không thể xóa tài khoản', error.message || 'Tài khoản có thể đã có lịch sử giao dịch.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Quản Lý Du Khách & Khách Hàng</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Quản lý hồ sơ cá nhân du khách, điểm thưởng VIP và lịch sử đặt dịch vụ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingTraveler(null); setIsModalOpen(true); }}
            className="btn-primary py-2.5 px-4 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Thêm Khách Hàng Mới
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">TỔNG DU KHÁCH</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{travelers.length}</span>
            <Users className="w-6 h-6 text-blue-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">THÀNH VIÊN HOẠT ĐỘNG</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{travelers.length}</span>
            <UserCheck className="w-6 h-6 text-emerald-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">KHÁCH VIP PLATINUM</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-600">
              {travelers.filter((t) => (t.vipTier || t.vip_tier) === 'platinum').length}
            </span>
            <Award className="w-6 h-6 text-indigo-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">KHÁCH HÀNG MỚI</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{travelers.length}</span>
            <UserPlus className="w-6 h-6 text-amber-500/30" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Danh Sách Hồ Sơ Du Khách</h3>
          <span className="text-xs text-slate-400 font-medium">{travelers.length} khách hàng</span>
        </div>

        {travelers.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Chưa có thông tin du khách nào</h4>
              <p className="text-xs text-slate-400 mt-0.5">Nhấn "+ Thêm Khách Hàng Mới" để tạo hồ sơ khách đầu tiên.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold mx-auto inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Thêm Khách Hàng Mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Họ & Tên</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Số Điện Thoại</th>
                  <th className="py-3 px-2">Hạng VIP</th>
                  <th className="py-3 px-2">Đơn dịch vụ</th>
                  <th className="py-3 px-2">Điểm thưởng</th>
                  <th className="py-3 px-2">Ngày Đăng Ký</th>
                  <th className="py-3 px-2 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {travelers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-900">{t.fullName || t.full_name}</td>
                    <td className="py-3 px-2 text-slate-600 font-medium">{t.email}</td>
                    <td className="py-3 px-2 text-slate-600 font-mono">{t.phone}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (t.vipTier || t.vip_tier) === 'platinum' ? 'bg-slate-900 text-cyan-300' :
                        (t.vipTier || t.vip_tier) === 'gold' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {(t.vipTier || t.vip_tier)?.toUpperCase() || 'SILVER'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <strong className="text-slate-900">{Number(t._count?.bookings || 0) + Number(t._count?.travel_orders || 0)}</strong>
                      <span className="ml-1 text-[10px] text-slate-400">({t._count?.bookings || 0} phòng · {t._count?.travel_orders || 0} vé/tàu)</span>
                    </td>
                    <td className="py-3 px-2 font-bold text-indigo-700">{Number(t.reward_points || 0).toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-2 text-slate-400">{t.createdAt || (t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : 'Chưa có')}</td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <button type="button" onClick={() => { setEditingTraveler(t); setIsModalOpen(true); }} className="text-indigo-600 font-bold inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Sửa</button>
                      <button type="button" onClick={() => handleDelete(t)} className="ml-3 text-rose-600 font-bold inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm Khách Hàng */}
      <CreateTravelerModal
        isOpen={isModalOpen}
        initialData={editingTraveler}
        onClose={() => { setIsModalOpen(false); setEditingTraveler(null); }}
        onSuccess={handleAddSuccess}
      />

    </div>
  );
}
