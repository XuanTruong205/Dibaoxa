import { Check, Image, Plus, Ship, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminStore } from '../../../store/useAdminStore';

const lines = (value) => Array.isArray(value) ? value.join('\n') : (typeof value === 'string' ? value : '');
const parseLines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);
const makeId = (name) => `cruise-${name.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
const dateAfter = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  id: '', name: '', operator: '', destination: 'Hạ Long', departurePort: '', durationDays: 2,
  price: 4500000, rating: 9, reviews: 0, shipClass: 5, image: '/images/dibaoxa-cruise-hero.png',
  galleryImages: '', features: '', cabins: '', itinerary: '', description: '', policies: '',
  faqs: [{ question: '', answer: '' }], status: 'active', firstDepartureDate: dateAfter(7),
  departureTime: '11:30', departureCount: 4, departureIntervalDays: 7, unitsPerCabin: 8,
};

export default function CruiseEditorModal({ cruise, preset, onClose, onSuccess }) {
  const { addCruise, updateCruise } = useAdminStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(cruise);

  useEffect(() => {
    if (!cruise && !preset) {
      setForm({ ...EMPTY_FORM, firstDepartureDate: dateAfter(7) });
      return;
    }
    if (!cruise && preset) {
      setForm({ ...EMPTY_FORM, ...preset, id: '', firstDepartureDate: preset.firstDepartureDate || dateAfter(7), faqs: preset.faqs?.length ? preset.faqs : [{ question: '', answer: '' }] });
      return;
    }
    setForm({
      id: cruise.id,
      name: cruise.name || '',
      operator: cruise.operator || '',
      destination: cruise.destination || 'Hạ Long',
      departurePort: cruise.departurePort || '',
      durationDays: cruise.durationDays || 2,
      price: cruise.price || 0,
      rating: cruise.rating || 9,
      reviews: cruise.reviews || 0,
      shipClass: cruise.shipClass || 5,
      image: cruise.image || '',
      galleryImages: lines(cruise.galleryImages),
      features: lines(cruise.features),
      cabins: lines(cruise.cabins),
      itinerary: lines(cruise.itinerary),
      description: cruise.description || '',
      policies: lines(cruise.policies),
      faqs: cruise.faqs?.length ? cruise.faqs : [{ question: '', answer: '' }],
      status: cruise.status || 'active',
      firstDepartureDate: dateAfter(7), departureTime: '11:30', departureCount: 4,
      departureIntervalDays: 7, unitsPerCabin: 8,
    });
  }, [cruise, preset]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateFaq = (index, field, value) => setForm((current) => ({
    ...current,
    faqs: current.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, [field]: value } : faq),
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      id: isEditing ? cruise.id : (form.id.trim() || makeId(form.name)),
      name: form.name.trim(),
      operator: form.operator.trim(),
      destination: form.destination.trim(),
      departure_port: form.departurePort.trim(),
      duration_days: Number(form.durationDays),
      price: Number(form.price),
      rating: Number(form.rating),
      review_count: Number(form.reviews),
      ship_class: Number(form.shipClass),
      image: form.image.trim(),
      gallery_images: parseLines(form.galleryImages),
      features: parseLines(form.features),
      cabins: parseLines(form.cabins),
      itinerary: parseLines(form.itinerary),
      description: form.description.trim(),
      policies: parseLines(form.policies),
      faqs: form.faqs.map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })).filter((faq) => faq.question && faq.answer),
      status: form.status,
      ...(!isEditing && form.firstDepartureDate && {
        launch_schedule: {
          first_departure_date: form.firstDepartureDate,
          departure_time: form.departureTime,
          departure_count: Number(form.departureCount),
          interval_days: Number(form.departureIntervalDays),
          units_per_cabin: Number(form.unitsPerCabin),
        },
      }),
    };
    try {
      const result = isEditing ? await updateCruise(cruise.id, payload) : await addCruise(payload);
      onSuccess?.(result);
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Không thể lưu du thuyền.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cruise-editor-title">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Ship className="h-5 w-5" /></span><div><h2 id="cruise-editor-title" className="text-lg font-extrabold text-slate-900">{isEditing ? 'Chỉnh sửa du thuyền' : 'Thêm du thuyền mới'}</h2><p className="text-xs text-slate-500">Nội dung lưu tại đây sẽ hiển thị trên trang tìm kiếm và trang chi tiết.</p></div></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-6 overflow-y-auto p-5 sm:p-7">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-extrabold text-slate-900">1. Thông tin chung</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {!isEditing && <label className="admin-field"><span>Mã du thuyền</span><input value={form.id} onChange={(event) => setField('id', event.target.value)} placeholder="Tự tạo từ tên nếu để trống" /></label>}
              <label className="admin-field"><span>Tên du thuyền *</span><input required value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
              <label className="admin-field"><span>Đơn vị vận hành *</span><input required value={form.operator} onChange={(event) => setField('operator', event.target.value)} /></label>
              <label className="admin-field"><span>Điểm đến *</span><input required value={form.destination} onChange={(event) => setField('destination', event.target.value)} /></label>
              <label className="admin-field sm:col-span-2"><span>Cảng khởi hành *</span><input required value={form.departurePort} onChange={(event) => setField('departurePort', event.target.value)} /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <label className="admin-field"><span>Số ngày</span><input type="number" min="1" value={form.durationDays} onChange={(event) => setField('durationDays', event.target.value)} /></label>
              <label className="admin-field sm:col-span-2"><span>Giá mỗi khách</span><input type="number" min="0" value={form.price} onChange={(event) => setField('price', event.target.value)} /></label>
              <label className="admin-field"><span>Điểm</span><input type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(event) => setField('rating', event.target.value)} /></label>
              <label className="admin-field"><span>Đánh giá</span><input type="number" min="0" value={form.reviews} onChange={(event) => setField('reviews', event.target.value)} /></label>
              <label className="admin-field"><span>Hạng sao</span><input type="number" min="1" max="5" value={form.shipClass} onChange={(event) => setField('shipClass', event.target.value)} /></label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Image className="h-4 w-4 text-teal-700" /> 2. Hình ảnh và giới thiệu</h3>
            <label className="admin-field"><span>Ảnh bìa *</span><input required value={form.image} onChange={(event) => setField('image', event.target.value)} /></label>
            {form.image && <img src={form.image} alt="Xem trước ảnh bìa" className="h-52 w-full rounded-xl object-cover" />}
            <label className="admin-field"><span>Album ảnh, mỗi dòng một URL</span><textarea rows="4" value={form.galleryImages} onChange={(event) => setField('galleryImages', event.target.value)} /></label>
            <label className="admin-field"><span>Bài giới thiệu *</span><textarea required minLength="10" rows="5" value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-extrabold text-slate-900">3. Cabin và tiện ích</h3>
              <label className="admin-field"><span>Tiện ích, mỗi dòng một mục</span><textarea rows="5" value={form.features} onChange={(event) => setField('features', event.target.value)} /></label>
              <label className="admin-field"><span>Loại cabin, mỗi dòng một loại *</span><textarea required rows="5" value={form.cabins} onChange={(event) => setField('cabins', event.target.value)} /></label>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-extrabold text-slate-900">4. Lịch trình và chính sách</h3>
              <label className="admin-field"><span>Lịch trình, mỗi dòng một chặng *</span><textarea required rows="5" value={form.itinerary} onChange={(event) => setField('itinerary', event.target.value)} /></label>
              <label className="admin-field"><span>Chính sách, mỗi dòng một mục</span><textarea rows="5" value={form.policies} onChange={(event) => setField('policies', event.target.value)} /></label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">5. Câu hỏi thường gặp</h3><button type="button" onClick={() => setForm((current) => ({ ...current, faqs: [...current.faqs, { question: '', answer: '' }] }))} className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"><Plus className="h-4 w-4" /> Thêm câu hỏi</button></div>
            {form.faqs.map((faq, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1.5fr_auto]"><label className="admin-field"><span>Câu hỏi</span><input value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} /></label><label className="admin-field"><span>Câu trả lời</span><textarea rows="2" value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} /></label><button type="button" onClick={() => setForm((current) => ({ ...current, faqs: current.faqs.filter((_, faqIndex) => faqIndex !== index) }))} className="self-end rounded-xl p-2.5 text-rose-600 hover:bg-rose-50" aria-label="Xóa câu hỏi"><Trash2 className="h-4 w-4" /></button></div>)}
          </section>

          {!isEditing && (
            <section className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <div><h3 className="text-sm font-extrabold text-slate-900">Mở bán tự động</h3><p className="mt-1 text-xs text-slate-600">Tạo sẵn các ngày khởi hành và số cabin trong cùng lần lưu.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <label className="admin-field sm:col-span-2"><span>Ngày khởi hành đầu tiên</span><input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.firstDepartureDate} onChange={(event) => setField('firstDepartureDate', event.target.value)} /></label>
                <label className="admin-field"><span>Giờ đi</span><input required type="time" value={form.departureTime} onChange={(event) => setField('departureTime', event.target.value)} /></label>
                <label className="admin-field"><span>Số chuyến</span><input required type="number" min="1" max="52" value={form.departureCount} onChange={(event) => setField('departureCount', event.target.value)} /></label>
                <label className="admin-field"><span>Cách nhau (ngày)</span><input required type="number" min="1" max="90" value={form.departureIntervalDays} onChange={(event) => setField('departureIntervalDays', event.target.value)} /></label>
                <label className="admin-field sm:col-span-2"><span>Số cabin mỗi loại</span><input required type="number" min="1" value={form.unitsPerCabin} onChange={(event) => setField('unitsPerCabin', event.target.value)} /></label>
              </div>
            </section>
          )}

          <label className="admin-field max-w-xs"><span>Trạng thái hiển thị</span><select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="active">Đang hiển thị</option><option value="inactive">Tạm ẩn</option></select></label>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><button type="button" onClick={onClose} className="btn-secondary">Hủy</button><button type="submit" disabled={saving} className="btn-primary"><Check className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu du thuyền'}</button></footer>
      </form>
    </div>,
    document.body,
  );
}
