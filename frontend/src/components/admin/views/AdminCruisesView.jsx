import { Anchor, Copy, Edit, Image, MapPin, Plus, Ship, Sparkles, Star, Trash2, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import CruiseEditorModal from '../modals/CruiseEditorModal';

const CRUISE_PRESETS = {
  halong: {
    name: 'Du thuyền Hạ Long mới', operator: 'Dibaoxa Cruises', destination: 'Hạ Long', departurePort: 'Cảng Tuần Châu', durationDays: 2,
    price: 4500000, image: '/images/dibaoxa-cruise-hero.png', features: 'Ban công riêng\nChèo kayak\nBữa tối trên vịnh',
    cabins: [{ name: 'Deluxe Balcony', price: 4500000, units: 12 }, { name: 'Executive Suite', price: 5700000, units: 8 }, { name: 'President Suite', price: 8200000, units: 2 }], itinerary: 'Ngày 1: Tuần Châu - Hang Sửng Sốt\nNgày 2: Đảo Titop - Tuần Châu',
    description: 'Hành trình hai ngày một đêm khám phá Vịnh Hạ Long cùng dịch vụ nghỉ dưỡng trọn gói.', policies: 'Mang theo giấy tờ tùy thân\nCó mặt trước giờ khởi hành 45 phút',
  },
  lanha: {
    name: 'Du thuyền Lan Hạ mới', operator: 'Dibaoxa Cruises', destination: 'Lan Hạ', departurePort: 'Bến Gót, Cát Hải', durationDays: 3,
    price: 6200000, image: '/images/dibaoxa-cruise-hero.png', features: 'Kayak\nBể bơi\nLớp nấu ăn\nSpa',
    cabins: [{ name: 'Ocean Suite', price: 6200000, units: 10 }, { name: 'Family Connecting', price: 7800000, units: 5 }, { name: 'Grand Suite', price: 9200000, units: 3 }], itinerary: 'Ngày 1: Cát Hải - Vịnh Lan Hạ\nNgày 2: Làng Việt Hải\nNgày 3: Hang Sáng Tối - Cát Hải',
    description: 'Hành trình ba ngày hai đêm dành cho khách muốn khám phá sâu Vịnh Lan Hạ và đảo Cát Bà.', policies: 'Mang theo giấy tờ tùy thân\nCó mặt trước giờ khởi hành 45 phút',
  },
};

const duplicatePreset = (cruise) => ({
  name: `${cruise.name} bản sao`, operator: cruise.operator, destination: cruise.destination, departurePort: cruise.departurePort,
  durationDays: cruise.durationDays, price: cruise.price, rating: cruise.rating, reviews: 0, shipClass: cruise.shipClass,
  image: cruise.image, galleryImages: (cruise.galleryImages || []).join('\n'), features: (cruise.features || []).join('\n'),
  cabins: (cruise.cabins || []).map((name) => ({ name, price: cruise.price, units: 8 })), itinerary: (cruise.itinerary || []).join('\n'), description: cruise.description,
  policies: (cruise.policies || []).join('\n'), faqs: cruise.faqs || [], status: 'inactive',
  launchedYear: cruise.specifications?.launchedYear || '', cabinCount: cruise.specifications?.cabinCount || '',
  hullMaterial: cruise.specifications?.hullMaterial || 'Kim loại', route: cruise.specifications?.route || '',
});

export default function AdminCruisesView() {
  const { cruises, cruiseDepartures, deleteCruise } = useAdminStore();
  const [editor, setEditor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [creationPreset, setCreationPreset] = useState(null);
  const activeCruises = cruises.filter((cruise) => cruise.status === 'active');
  const averagePrice = cruises.length ? Math.round(cruises.reduce((sum, cruise) => sum + cruise.price, 0) / cruises.length) : 0;
  const imageCount = cruises.reduce((sum, cruise) => sum + 1 + (cruise.galleryImages?.length || 0), 0);

  const handleDelete = async (cruise) => {
    if (!window.confirm(`Xóa du thuyền "${cruise.name}"?`)) return;
    try { await deleteCruise(cruise.id); } catch (error) { alert(error.message || 'Không thể xóa du thuyền.'); }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Quản Lý Du Thuyền & Hải Trình</h1><p className="mt-1 text-sm font-medium text-slate-500">Tạo du thuyền, cabin và lịch mở bán trong cùng một lần lưu.</p></div><button type="button" className="btn-primary" onClick={() => { setCreationPreset(null); setCreating(true); }}><Plus className="h-4 w-4" /> Thêm du thuyền</button></header>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Mẫu du thuyền">
        <button type="button" onClick={() => { setCreationPreset(null); setCreating(true); }} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md active:scale-[0.99]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><Ship className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">Tạo từ đầu</strong><small className="text-xs text-slate-500">Biểu mẫu trống</small></span></button>
        {Object.entries(CRUISE_PRESETS).map(([key, preset]) => <button key={key} type="button" onClick={() => { setCreationPreset(preset); setCreating(true); }} className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md active:scale-[0.99]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-white"><Sparkles className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-900">Mẫu {preset.destination}</strong><small className="text-xs text-slate-600">{preset.durationDays} ngày, cabin và lịch trình có sẵn</small></span></button>)}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[[Ship, 'Tổng du thuyền', cruises.length], [Anchor, 'Đang hiển thị', activeCruises.length], [Wallet, 'Giá trung bình', `${averagePrice.toLocaleString('vi-VN')} đ`], [Image, 'Ảnh nội dung', imageCount]].map(([Icon, label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span><Icon className="h-5 w-5 text-teal-700" /></div><strong className="mt-4 block text-2xl font-extrabold text-slate-900">{value}</strong></article>)}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 xl:grid-cols-2">
          {cruises.map((cruise) => <article key={cruise.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:shadow-lg"><img src={cruise.image} alt={cruise.name} className="h-52 w-full object-cover" /><div className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-lg px-2 py-1 text-[10px] font-extrabold ${cruise.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{cruise.status === 'active' ? 'Đang hiển thị' : 'Tạm ẩn'}</span><span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Star className="h-3.5 w-3.5 fill-current" /> {cruise.rating}</span></div><h2 className="text-lg font-extrabold text-slate-900">{cruise.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {cruise.destination} · {cruise.departurePort}</p><p className="mt-1 text-xs font-semibold text-teal-700">{cruiseDepartures.filter((item) => item.cruise_id === cruise.id && item.status === 'open').length} chuyến đang mở bán</p></div><strong className="whitespace-nowrap text-sm text-teal-800">{cruise.price.toLocaleString('vi-VN')} đ</strong></div><div className="flex flex-wrap gap-2">{cruise.cabins?.map((cabin) => <span key={cabin} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{cabin}</span>)}</div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => { setCreationPreset(duplicatePreset(cruise)); setCreating(true); }} className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"><Copy className="h-4 w-4" /> Nhân bản</button><button type="button" onClick={() => setEditor(cruise)} className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><Edit className="h-4 w-4" /> Chỉnh sửa</button><button type="button" onClick={() => handleDelete(cruise)} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><Trash2 className="h-4 w-4" /> Xóa</button></div></div></article>)}
        </div>
        {!cruises.length && <div className="py-16 text-center"><Ship className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-base font-bold text-slate-800">Chưa có du thuyền</h2><p className="text-sm text-slate-500">Thêm du thuyền đầu tiên để hiển thị ở trang người dùng.</p></div>}
      </section>

      {(creating || editor) && <CruiseEditorModal cruise={editor} preset={creationPreset} onClose={() => { setCreating(false); setCreationPreset(null); setEditor(null); }} />}
    </div>
  );
}
