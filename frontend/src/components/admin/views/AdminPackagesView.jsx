import {
  Calendar,
  CheckCircle2,
  Compass,
  DollarSign,
  Inbox,
  Package,
  Pencil,
  Plus,
  Star,
  Tag,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import CreatePackageModal from '../modals/CreatePackageModal';
import { useAdminStore } from '../../../store/useAdminStore';

export default function AdminPackagesView() {
  const { packages, addPackage, updatePackage, deletePackage } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const activePackages = packages.filter((pkg) => pkg.status === 'active').length;

  const handleAddSuccess = async (newPkg) => {
    try {
      const saved = editingPackage
        ? await updatePackage(editingPackage.id, newPkg)
        : await addPackage(newPkg);
      alert(editingPackage ? `Đã cập nhật gói [${saved?.title || newPkg.title}]!` : `Đã tạo thành công gói tour [${saved?.title || newPkg.title}]!`);
      setEditingPackage(null);
    } catch (error) {
      alert(error.message || 'Không thể tạo gói tour.');
      throw error;
    }
  };

  const handleDelete = async (packageId) => {
    if (!window.confirm('Bạn có chắc muốn xóa gói du lịch này?')) return;
    try {
      await deletePackage(packageId);
    } catch (error) {
      alert(error.message || 'Không thể xóa gói tour.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">Gói Du Lịch & Combo Trọn Gói</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Thiết lập danh mục các gói nghỉ dưỡng, tour du lịch và ưu đãi hấp dẫn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingPackage(null); setIsModalOpen(true); }}
            className="btn-primary py-2.5 px-4 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Tạo Gói Combo Mới
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">TỔNG GÓI DU LỊCH</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{packages.length}</span>
            <Package className="w-6 h-6 text-blue-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">ĐANG KÍCH HOẠT</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{activePackages}</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">LƯỢT ĐẶT GÓI</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-extrabold text-indigo-600">Chưa theo dõi</span>
            <Star className="w-6 h-6 text-indigo-500/30" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">GIÁ TRUNG BÌNH GÓI</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {packages.length > 0
                ? Math.round(packages.reduce((s, p) => s + p.price, 0) / packages.length).toLocaleString('vi-VN') + ' đ'
                : '0 đ'}
            </span>
            <DollarSign className="w-6 h-6 text-amber-500/30" />
          </div>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Danh Sách Gói Combo Du Lịch</h3>
          <span className="text-xs text-slate-400 font-medium">{packages.length} gói hiển thị</span>
        </div>

        {packages.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Chưa có gói du lịch nào được tạo</h4>
              <p className="text-xs text-slate-400 mt-0.5">Nhấn "+ Tạo Gói Combo Mới" để tạo chương trình tour đầu tiên.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold mx-auto inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tạo Gói Combo Mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 block">{pkg.destination}</span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{pkg.title}</h4>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {pkg.price?.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { setEditingPackage(pkg); setIsModalOpen(true); }} className="text-xs font-bold text-indigo-600 inline-flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Chỉnh sửa</button>
                  <button type="button" onClick={() => handleDelete(pkg.id)} className="text-xs font-bold text-rose-600 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa gói</button>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {pkg.included?.map((inc, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" /> {inc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tạo Gói Combo */}
      <CreatePackageModal
        isOpen={isModalOpen}
        initialData={editingPackage}
        onClose={() => { setIsModalOpen(false); setEditingPackage(null); }}
        onSuccess={handleAddSuccess}
      />

    </div>
  );
}
