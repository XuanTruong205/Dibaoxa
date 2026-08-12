import {
  Award,
  CheckCircle2,
  Compass,
  Inbox,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Shield,
  Star,
  Trash2,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import CreateStaffModal from '../modals/CreateStaffModal';
import { useAdminStore } from '../../../store/useAdminStore';

export default function AdminGuidesView() {
  const { staff: staffList, hotels, addStaff, updateStaff, deleteStaff } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const activeStaff = staffList.filter((staff) => staff.status === 'active').length;
  const activeRate = staffList.length > 0 ? Math.round((activeStaff / staffList.length) * 100) : 0;
  const assignedHotelName = (staff) => {
    const assignedHotel = staff.assignedHotel || staff.assigned_hotel;
    return hotels.find((hotel) => hotel.id === assignedHotel)?.name || assignedHotel || 'Chưa phân công';
  };

  const handleAddSuccess = async (newStaff) => {
    try {
      const payload = {
        full_name: newStaff.fullName,
        email: newStaff.email || undefined,
        job_title: newStaff.role,
        phone: newStaff.phone,
        assigned_hotel: newStaff.assignedHotel,
        status: newStaff.status || 'active',
      };
      if (editingStaff) await updateStaff(editingStaff.id, payload);
      else await addStaff(payload);
      alert(editingStaff ? `Đã cập nhật nhân viên [${newStaff.fullName}]!` : `Đã thêm thành công nhân viên [${newStaff.fullName}]!`);
      setEditingStaff(null);
    } catch (error) {
      alert(error.message || 'Không thể thêm nhân viên.');
      throw error;
    }
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await deleteStaff(staffId);
    } catch (error) {
      alert(error.message || 'Không thể xóa nhân viên.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Hướng Dẫn Viên & Nhân Viên Lễ Tân</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Quản lý danh sách nhân sự lễ tân, cấp quyền ứng dụng quét mã QR và HDV theo tour.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingStaff(null); setIsModalOpen(true); }}
            className="btn-primary py-2.5 px-4 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Thêm Nhân Viên Mới
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">TỔNG NHÂN SỰ</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{staffList.length}</span>
            <Users className="w-6 h-6 text-blue-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">NHÂN VIÊN LỄ TÂN</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">
              {staffList.filter((s) => (s.role || s.job_title)?.toLowerCase().includes('lễ tân') || s.role === 'receptionist').length}
            </span>
            <UserCheck className="w-6 h-6 text-emerald-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">HƯỚNG DẪN VIÊN</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-600">
              {staffList.filter((s) => (s.role || s.job_title)?.toLowerCase().includes('hướng dẫn')).length}
            </span>
            <Compass className="w-6 h-6 text-indigo-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">TỶ LỆ ĐANG HOẠT ĐỘNG</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{activeRate}%</span>
            <Shield className="w-6 h-6 text-amber-500/30" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Danh Sách Nhân Sự Hỗ Trợ</h3>
          <span className="text-xs text-slate-400 font-medium">{staffList.length} nhân viên</span>
        </div>

        {staffList.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Chưa có nhân viên nào được phân công</h4>
              <p className="text-xs text-slate-400 mt-0.5">Nhấn "+ Thêm Nhân Viên Mới" để tạo hồ sơ lễ tân hoặc hướng dẫn viên.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold mx-auto inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Thêm Nhân Viên Mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Họ & Tên</th>
                  <th className="py-3 px-2">Vị Trí Chức Danh</th>
                  <th className="py-3 px-2">Số Điện Thoại</th>
                  <th className="py-3 px-2">Cơ Sở Phụ Trách</th>
                  <th className="py-3 px-2">Trạng Thái & Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-900">{s.fullName || s.full_name}</td>
                    <td className="py-3 px-2 text-indigo-700 font-bold">{s.role || s.job_title}</td>
                    <td className="py-3 px-2 text-slate-600 font-mono">{s.phone}</td>
                    <td className="py-3 px-2 text-slate-800 font-medium">{assignedHotelName(s)}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                      </span>
                      <button type="button" onClick={() => { setEditingStaff(s); setIsModalOpen(true); }} className="ml-2 text-indigo-600 font-bold inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Sửa</button>
                      <button type="button" onClick={() => handleDelete(s.id)} className="ml-2 text-rose-600 font-bold">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm Nhân Viên */}
      <CreateStaffModal
        isOpen={isModalOpen}
        initialData={editingStaff}
        onClose={() => { setIsModalOpen(false); setEditingStaff(null); }}
        onSuccess={handleAddSuccess}
      />

    </div>
  );
}
