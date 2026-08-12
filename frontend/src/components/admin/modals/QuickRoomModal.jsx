import { Bed, Check, Copy, Sparkles, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminStore } from '../../../store/useAdminStore';
import AmenityPicker from './AmenityPicker';

const ROOM_SERVICE_OPTIONS = [
  'Điều hòa',
  'Bồn tắm/Cabin tắm đứng',
  'Máy sấy tóc',
  'Minibar',
  'Tivi',
  'Bàn làm việc',
  'Nước đóng chai miễn phí',
  'Két an toàn',
  'Áo khoác tắm',
];

const ROOM_TEMPLATES = {
  standard: {
    label: 'Superior thành phố', name: 'Superior City View', room_type: 'Superior', price_per_night: 1500000,
    max_occupancy: 2, bed_type: '1 giường đôi', area_sqm: 28, view_type: 'City view', total_rooms: 12,
    room_services: ['Điều hòa', 'Tivi', 'Nước đóng chai miễn phí'],
  },
  deluxe: {
    label: 'Deluxe hướng biển', name: 'Deluxe Ocean View', room_type: 'Deluxe', price_per_night: 2400000,
    max_occupancy: 2, bed_type: '1 giường King', area_sqm: 36, view_type: 'Ocean view', total_rooms: 8,
    room_services: ['Điều hòa', 'Bồn tắm/Cabin tắm đứng', 'Minibar', 'Áo khoác tắm'],
  },
  family: {
    label: 'Suite gia đình', name: 'Family Suite', room_type: 'Suite', price_per_night: 3800000,
    max_occupancy: 4, bed_type: '2 giường Queen', area_sqm: 56, view_type: 'Garden view', total_rooms: 5,
    room_services: ['Điều hòa', 'Bồn tắm/Cabin tắm đứng', 'Minibar', 'Tivi', 'Két an toàn'],
  },
};

const EMPTY_ROOM = {
  name: '', room_type: 'Deluxe', price_per_night: 2000000, max_occupancy: 2,
  bed_type: '1 giường đôi', area_sqm: 32, view_type: 'Ocean view', total_rooms: 10,
  is_available: true, images: [''], room_services: [],
};

function normalizeSeed(seed) {
  if (!seed) return EMPTY_ROOM;
  return {
    ...EMPTY_ROOM,
    ...seed,
    name: seed.name ? `${seed.name} bản sao` : '',
    images: Array.isArray(seed.images) && seed.images.length ? seed.images : [''],
    room_services: Array.isArray(seed.room_services) ? seed.room_services : [],
  };
}

export default function QuickRoomModal({ isOpen, onClose, initialHotelId = '', roomSeed = null }) {
  const { hotels, addRoom } = useAdminStore();
  const [hotelId, setHotelId] = useState('');
  const [form, setForm] = useState(EMPTY_ROOM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedHotel = useMemo(() => hotels.find((hotel) => String(hotel.id) === String(hotelId)), [hotelId, hotels]);

  useEffect(() => {
    if (!isOpen) return;
    setHotelId(initialHotelId || hotels[0]?.id || '');
    setForm(normalizeSeed(roomSeed));
    setError('');
  }, [hotels, initialHotelId, isOpen, roomSeed]);

  if (!isOpen) return null;

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const useTemplate = (template) => setForm((current) => ({
    ...current,
    ...template,
    images: current.images?.some(Boolean) ? current.images : [selectedHotel?.cover_image || ''],
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hotelId) return setError('Hãy chọn khách sạn nhận loại phòng này.');
    setSaving(true);
    setError('');
    try {
      await addRoom(hotelId, {
        name: form.name.trim(),
        room_type: form.room_type.trim(),
        price_per_night: Number(form.price_per_night),
        max_occupancy: Number(form.max_occupancy),
        bed_type: form.bed_type.trim(),
        area_sqm: Number(form.area_sqm),
        view_type: form.view_type,
        images: (form.images || []).map((item) => item.trim()).filter(Boolean),
        room_services: form.room_services || [],
        total_rooms: Number(form.total_rooms),
        is_available: form.is_available,
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Không thể thêm phòng.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="quick-room-title">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Bed className="h-5 w-5" /></span>
            <div><h2 id="quick-room-title" className="text-lg font-extrabold text-slate-900">Thêm phòng nhanh</h2><p className="text-xs text-slate-500">Chọn mẫu, chỉnh vài thông tin và lưu ngay.</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
          <label className="admin-field"><span>Khách sạn nhận phòng *</span><select required value={hotelId} onChange={(event) => setHotelId(event.target.value)}><option value="">Chọn khách sạn</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} - {hotel.city}</option>)}</select></label>

          <section>
            <div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-600" /><strong className="text-xs text-slate-800">Mẫu có sẵn</strong></div>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.values(ROOM_TEMPLATES).map((template) => <button key={template.label} type="button" onClick={() => useTemplate(template)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98]">{template.label}<small className="mt-1 block font-medium text-slate-500">{template.area_sqm} m², {template.max_occupancy} khách</small></button>)}
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <label className="admin-field sm:col-span-2"><span>Tên loại phòng *</span><input required value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Deluxe Ocean View" /></label>
            <label className="admin-field"><span>Phân hạng *</span><input required value={form.room_type} onChange={(event) => setField('room_type', event.target.value)} /></label>
            <label className="admin-field"><span>Giá mỗi đêm *</span><input required type="number" min="0" value={form.price_per_night} onChange={(event) => setField('price_per_night', event.target.value)} /></label>
            <label className="admin-field"><span>Số phòng cùng loại *</span><input required type="number" min="1" value={form.total_rooms} onChange={(event) => setField('total_rooms', event.target.value)} /></label>
            <label className="admin-field"><span>Số khách tối đa *</span><input required type="number" min="1" value={form.max_occupancy} onChange={(event) => setField('max_occupancy', event.target.value)} /></label>
            <label className="admin-field"><span>Diện tích (m²) *</span><input required type="number" min="1" value={form.area_sqm} onChange={(event) => setField('area_sqm', event.target.value)} /></label>
            <label className="admin-field"><span>Loại giường *</span><input required value={form.bed_type} onChange={(event) => setField('bed_type', event.target.value)} /></label>
            <label className="admin-field"><span>Hướng nhìn</span><select value={form.view_type} onChange={(event) => setField('view_type', event.target.value)}><option>City view</option><option>Ocean view</option><option>Garden view</option><option>Lake view</option></select></label>
            <label className="admin-field"><span>Ảnh phòng</span><input value={form.images?.[0] || ''} onChange={(event) => setField('images', [event.target.value])} placeholder="https://..." /></label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <AmenityPicker
              label="Dịch vụ và tiện nghi có sẵn ở phòng này"
              options={ROOM_SERVICE_OPTIONS}
              value={form.room_services || []}
              onChange={(nextServices) => setField('room_services', nextServices)}
              customLabel="Tiện nghi phòng chưa có trong danh sách"
              placeholder="Ví dụ: Máy pha cà phê, loa Bluetooth"
              columns="sm:grid-cols-3"
            />
          </section>

          {roomSeed && <p className="flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-xs font-semibold text-indigo-800"><Copy className="h-4 w-4" /> Dữ liệu đã được sao chép. Bạn chỉ cần đổi tên, giá hoặc số lượng.</p>}
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6"><button type="button" onClick={onClose} className="btn-secondary">Hủy</button><button type="submit" disabled={saving || !hotels.length} className="btn-primary"><Check className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Thêm phòng'}</button></footer>
      </form>
    </div>,
    document.body,
  );
}
