import { CheckCircle2, Compass, MapPin, Package, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function CreatePackageModal({ isOpen, onClose, onSuccess, initialData = null }) {
  // All input fields leave completely BLANK initially when opened!
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('Đà Nẵng');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [included, setIncluded] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialData?.title || '');
    setDestination(initialData?.destination || 'Đà Nẵng');
    setDuration(initialData?.duration || '');
    setPrice(initialData?.price ? String(initialData.price) : '');
    setIncluded((initialData?.included || []).join(', '));
    setStatus(initialData?.status || 'active');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const created = {
      title,
      destination,
      duration,
      price: Number(price) || 0,
      included: included ? included.split(',').map((i) => i.trim()) : [],
      status,
    };

    try {
      if (onSuccess) await onSuccess(created);
      onClose();
    } catch {
      // The parent view displays the API error and keeps the modal available.
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all font-bold cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{initialData ? 'Chỉnh Sửa Gói Combo' : 'Thêm Gói Combo / Tour Mới'}</h2>
            <p className="text-xs text-slate-500 font-medium">{initialData ? 'Cập nhật nội dung, giá và trạng thái bán.' : 'Khởi tạo gói du lịch combo trọn gói.'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tên Gói Du Lịch / Tour Combo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên gói du lịch / combo (vd: Combo Ba Na Hills 3N2Đ)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái bán</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800">
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Điểm Đến / Thành Phố</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 cursor-pointer"
              >
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Phú Quốc">Phú Quốc</option>
                <option value="Đà Lạt">Đà Lạt</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Thời Gian Lưu Trú *</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="VD: 3 Ngày 2 Đêm"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Giá Trọn Gói (VNĐ / Người) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Nhập giá tiền VNĐ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium font-mono text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Dịch vụ bao gồm (phân cách dấu phẩy)</label>
            <input
              type="text"
              value={included}
              onChange={(e) => setIncluded(e.target.value)}
              placeholder="VD: Khách sạn 4 sao, Vé cáp treo, Xe đưa đón..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400"
              required
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
              {initialData ? 'Lưu Thay Đổi' : 'Lưu Gói Combo Du Lịch'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
