import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Eye,
  Image,
  ListChecks,
  Plus,
  Save,
  Ship,
  Sparkles,
  Tag,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminStore } from '../../../store/useAdminStore';

const DRAFT_KEY = 'dibaoxa_admin_cruise_draft_v2';
const COMMON_FEATURES = ['Ban công riêng', 'Bữa ăn trọn gói', 'Chèo kayak', 'Nhà hàng', 'Quầy bar', 'Bể sục jacuzzi', 'Spa', 'Lớp nấu ăn'];
const STEPS = [
  { label: 'Thông tin', description: 'Tên, tuyến và thông số', Icon: Ship },
  { label: 'Cabin & giá', description: 'Giá và số lượng từng hạng', Icon: WalletCards },
  { label: 'Nội dung', description: 'Ảnh, tiện ích và chính sách', Icon: Image },
  { label: 'Mở bán', description: 'Lịch chạy và kiểm tra', Icon: CalendarDays },
];

const toLines = (value) => Array.isArray(value) ? value.join('\n') : (typeof value === 'string' ? value : '');
const parseLines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);
const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const makeId = (name) => `cruise-${name.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
const dateAfter = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const emptyCabin = (price = 4_500_000) => ({ name: '', price, units: 8 });

const EMPTY_FORM = {
  id: '', name: '', operator: '', destination: 'Hạ Long', departurePort: '', durationDays: 2,
  rating: 9, reviews: 0, shipClass: 5, image: '/images/dibaoxa-cruise-hero.png', galleryImages: '',
  features: [], cabins: [emptyCabin()], itinerary: '', description: '', policies: '',
  launchedYear: '', cabinCount: '', hullMaterial: 'Kim loại', route: '', faqs: [{ question: '', answer: '' }],
  status: 'inactive', firstDepartureDate: dateAfter(7), departureTime: '11:30', departureCount: 4,
  departureIntervalDays: 7,
};

function normalizeFeatures(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return parseLines(value || '');
}

function normalizeCabins(value, fallbackPrice, inventory = []) {
  const names = Array.isArray(value) ? value : parseLines(value || '');
  const byName = new Map(inventory.map((item) => [item.cabin_name, item]));
  const cabins = names.map((item) => {
    const name = typeof item === 'string' ? item : item.name;
    const configured = byName.get(name);
    return {
      name,
      price: Number(item.price || configured?.price_override || fallbackPrice || 4_500_000),
      units: Number(item.units || configured?.total_units || 8),
    };
  });
  return cabins.length ? cabins : [emptyCabin(fallbackPrice)];
}

function createInitialForm(cruise, preset, departures) {
  if (cruise) {
    const nearestDeparture = departures.find((item) => item.cruise_id === cruise.id && item.status === 'open');
    return {
      ...EMPTY_FORM,
      id: cruise.id,
      name: cruise.name || '',
      operator: cruise.operator || '',
      destination: cruise.destination || 'Hạ Long',
      departurePort: cruise.departurePort || '',
      durationDays: cruise.durationDays || 2,
      rating: cruise.rating ?? 9,
      reviews: cruise.reviews || 0,
      shipClass: cruise.shipClass || 5,
      image: cruise.image || '',
      galleryImages: toLines(cruise.galleryImages),
      features: normalizeFeatures(cruise.features),
      cabins: normalizeCabins(cruise.cabins, cruise.price, nearestDeparture?.inventory),
      itinerary: toLines(cruise.itinerary),
      description: cruise.description || '',
      policies: toLines(cruise.policies),
      launchedYear: cruise.specifications?.launchedYear || '',
      cabinCount: cruise.specifications?.cabinCount || '',
      hullMaterial: cruise.specifications?.hullMaterial || 'Kim loại',
      route: cruise.specifications?.route || '',
      faqs: cruise.faqs?.length ? cruise.faqs : [{ question: '', answer: '' }],
      status: cruise.status || 'inactive',
    };
  }

  if (preset) {
    return {
      ...EMPTY_FORM,
      ...preset,
      id: '',
      features: normalizeFeatures(preset.features),
      cabins: normalizeCabins(preset.cabins, preset.price),
      galleryImages: toLines(preset.galleryImages),
      firstDepartureDate: preset.firstDepartureDate || dateAfter(7),
      faqs: preset.faqs?.length ? preset.faqs : [{ question: '', answer: '' }],
    };
  }

  try {
    const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null');
    if (draft?.form) return { ...EMPTY_FORM, ...draft.form, cabins: normalizeCabins(draft.form.cabins, 4_500_000), features: normalizeFeatures(draft.form.features) };
  } catch {
    // A broken or blocked local draft must never prevent opening the editor.
  }
  return { ...EMPTY_FORM, cabins: [emptyCabin()] };
}

function FeatureEditor({ features, onChange }) {
  const [customFeature, setCustomFeature] = useState('');
  const toggle = (feature) => onChange(features.includes(feature) ? features.filter((item) => item !== feature) : [...features, feature]);
  const addCustom = () => {
    const value = customFeature.trim();
    if (!value || features.includes(value)) return;
    onChange([...features, value]);
    setCustomFeature('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_FEATURES.map((feature) => <button type="button" key={feature} onClick={() => toggle(feature)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${features.includes(feature) ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}>{features.includes(feature) && <Check className="mr-1 inline h-3.5 w-3.5" />}{feature}</button>)}
      </div>
      <div className="flex gap-2">
        <label className="admin-field flex-1"><span>Tiện ích khác</span><input value={customFeature} onChange={(event) => setCustomFeature(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } }} placeholder="Nhập tiện ích rồi nhấn Enter" /></label>
        <button type="button" className="btn-secondary self-end" onClick={addCustom}><Plus className="h-4 w-4" /> Thêm</button>
      </div>
      {features.some((feature) => !COMMON_FEATURES.includes(feature)) && <div className="flex flex-wrap gap-2">{features.filter((feature) => !COMMON_FEATURES.includes(feature)).map((feature) => <button type="button" key={feature} onClick={() => toggle(feature)} className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800">{feature}<X className="h-3.5 w-3.5" /></button>)}</div>}
    </div>
  );
}

export default function CruiseEditorModal({ cruise, preset, onClose, onSuccess }) {
  const { addCruise, updateCruise, cruiseDepartures } = useAdminStore();
  const isEditing = Boolean(cruise);
  const [form, setForm] = useState(() => createInitialForm(cruise, preset, cruiseDepartures));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const firstDraftSave = useRef(true);

  const basePrice = useMemo(() => {
    const prices = form.cabins.map((cabin) => Number(cabin.price || 0)).filter((price) => price > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [form.cabins]);
  const gallery = useMemo(() => parseLines(form.galleryImages), [form.galleryImages]);
  const itinerary = useMemo(() => parseLines(form.itinerary), [form.itinerary]);
  const policies = useMemo(() => parseLines(form.policies), [form.policies]);
  const validFaqs = useMemo(() => form.faqs.filter((faq) => faq.question.trim() && faq.answer.trim()), [form.faqs]);

  useEffect(() => {
    if (isEditing) return undefined;
    if (firstDraftSave.current) {
      firstDraftSave.current = false;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, savedAt: Date.now() }));
        setDraftSavedAt(new Date());
      } catch {
        // Autosave is a convenience; submission remains available when storage is blocked.
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [form, isEditing]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateCabin = (index, field, value) => setForm((current) => ({ ...current, cabins: current.cabins.map((cabin, cabinIndex) => cabinIndex === index ? { ...cabin, [field]: value } : cabin) }));
  const removeCabin = (index) => setForm((current) => ({ ...current, cabins: current.cabins.filter((_, cabinIndex) => cabinIndex !== index) }));
  const updateFaq = (index, field, value) => setForm((current) => ({ ...current, faqs: current.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, [field]: value } : faq) }));
  const clearDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setForm({ ...EMPTY_FORM, cabins: [emptyCabin()], features: [], faqs: [{ question: '', answer: '' }] });
    setStep(0);
    setError('');
    setDraftSavedAt(null);
    firstDraftSave.current = true;
  };

  const stepError = (targetStep) => {
    if (targetStep === 0) {
      if (form.name.trim().length < 2) return 'Hãy nhập tên du thuyền.';
      if (form.operator.trim().length < 2) return 'Hãy nhập đơn vị vận hành.';
      if (form.destination.trim().length < 2 || form.departurePort.trim().length < 2) return 'Hãy hoàn thiện điểm đến và cảng khởi hành.';
    }
    if (targetStep === 1) {
      if (!form.cabins.length) return 'Cần ít nhất một hạng cabin.';
      if (form.cabins.some((cabin) => !cabin.name.trim() || Number(cabin.price) <= 0 || Number(cabin.units) < 1)) return 'Mỗi cabin cần có tên, giá và số lượng mở bán hợp lệ.';
      const names = form.cabins.map((cabin) => cabin.name.trim().toLocaleLowerCase('vi'));
      if (new Set(names).size !== names.length) return 'Tên các hạng cabin không được trùng nhau.';
    }
    if (targetStep === 2) {
      if (!form.image.trim()) return 'Hãy nhập ảnh bìa.';
      if (form.description.trim().length < 10) return 'Bài giới thiệu cần ít nhất 10 ký tự.';
      if (!itinerary.length) return 'Hãy thêm ít nhất một chặng trong lịch trình.';
    }
    if (targetStep === 3 && !isEditing) {
      if (!form.firstDepartureDate) return 'Hãy chọn ngày khởi hành đầu tiên.';
      if (Number(form.departureCount) < 1 || Number(form.departureIntervalDays) < 1) return 'Số chuyến và chu kỳ khởi hành phải lớn hơn 0.';
    }
    return '';
  };

  const goNext = () => {
    const message = stepError(step);
    if (message) { setError(message); return; }
    setError('');
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    for (let index = 0; index < STEPS.length; index += 1) {
      const message = stepError(index);
      if (message) { setStep(index); setError(message); return; }
    }

    setSaving(true);
    setError('');
    const cabins = form.cabins.map((cabin) => ({ name: cabin.name.trim(), price: Number(cabin.price), units: Number(cabin.units) }));
    const payload = {
      id: isEditing ? cruise.id : (form.id.trim() || makeId(form.name)),
      name: form.name.trim(), operator: form.operator.trim(), destination: form.destination.trim(), departure_port: form.departurePort.trim(),
      duration_days: Number(form.durationDays), price: basePrice, rating: Number(form.rating), review_count: Number(form.reviews), ship_class: Number(form.shipClass),
      image: form.image.trim(), gallery_images: gallery, features: form.features, cabins: cabins.map((cabin) => cabin.name), itinerary,
      description: form.description.trim(), policies, faqs: validFaqs,
      specifications: { launchedYear: form.launchedYear ? Number(form.launchedYear) : null, cabinCount: form.cabinCount ? Number(form.cabinCount) : null, hullMaterial: form.hullMaterial.trim(), route: form.route.trim() },
      status: form.status,
      ...(!isEditing && { launch_schedule: {
        first_departure_date: form.firstDepartureDate, departure_time: form.departureTime,
        departure_count: Number(form.departureCount), interval_days: Number(form.departureIntervalDays),
        cabin_inventory: cabins.map((cabin) => ({ cabin_name: cabin.name, total_units: cabin.units, price_override: cabin.price })),
      } }),
    };

    try {
      const result = isEditing ? await updateCruise(cruise.id, payload) : await addCruise(payload);
      if (!isEditing) window.localStorage.removeItem(DRAFT_KEY);
      onSuccess?.(result);
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Không thể lưu du thuyền.');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 0) return (
      <div className="space-y-5">
        <div><h3 className="text-lg font-extrabold text-slate-900">Thông tin nhận diện</h3><p className="mt-1 text-sm text-slate-500">Những thông tin khách nhìn thấy đầu tiên trên trang tìm kiếm.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-field sm:col-span-2"><span>Tên du thuyền *</span><input autoFocus value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Ví dụ: Du thuyền Ambassador Hạ Long" /></label>
          <label className="admin-field"><span>Đơn vị vận hành *</span><input value={form.operator} onChange={(event) => setField('operator', event.target.value)} placeholder="Tên công ty vận hành" /></label>
          <label className="admin-field"><span>Điểm đến *</span><input list="cruise-destinations" value={form.destination} onChange={(event) => setField('destination', event.target.value)} /><datalist id="cruise-destinations"><option value="Hạ Long" /><option value="Lan Hạ" /><option value="Cát Bà" /><option value="Nha Trang" /><option value="Mekong" /></datalist></label>
          <label className="admin-field sm:col-span-2"><span>Cảng khởi hành *</span><input value={form.departurePort} onChange={(event) => setField('departurePort', event.target.value)} placeholder="Tên cảng và khu vực đón khách" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <label className="admin-field"><span>Số ngày</span><input type="number" min="1" max="30" value={form.durationDays} onChange={(event) => setField('durationDays', event.target.value)} /></label>
          <label className="admin-field"><span>Hạng sao</span><input type="number" min="1" max="5" value={form.shipClass} onChange={(event) => setField('shipClass', event.target.value)} /></label>
          <label className="admin-field"><span>Năm hạ thủy</span><input type="number" min="1900" max="2100" value={form.launchedYear} onChange={(event) => setField('launchedYear', event.target.value)} placeholder="2018" /></label>
          <label className="admin-field"><span>Tổng cabin</span><input type="number" min="1" value={form.cabinCount} onChange={(event) => setField('cabinCount', event.target.value)} placeholder="46" /></label>
          <label className="admin-field sm:col-span-2"><span>Vật liệu thân tàu</span><input value={form.hullMaterial} onChange={(event) => setField('hullMaterial', event.target.value)} /></label>
        </div>
        <label className="admin-field"><span>Tuyến hành trình tóm tắt</span><input value={form.route} onChange={(event) => setField('route', event.target.value)} placeholder="Hạ Long · Hang Luồn · Ti Tốp · Sửng Sốt" /></label>
      </div>
    );

    if (step === 1) return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-extrabold text-slate-900">Cabin, giá và số lượng</h3><p className="mt-1 text-sm text-slate-500">Giá từ được tự tính bằng hạng cabin thấp nhất.</p></div>{!isEditing && <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, cabins: [...current.cabins, emptyCabin(basePrice || 4_500_000)] }))}><Plus className="h-4 w-4" /> Thêm cabin</button>}</div>
        {isEditing && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900"><CircleAlert className="h-4 w-4 shrink-0" />Giá và số lượng bên dưới lấy từ chuyến mở bán gần nhất. Việc sửa thông tin du thuyền không thay đổi tồn kho của các chuyến đã tạo.</div>}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">Hạng cabin</th><th className="px-4 py-3">Giá mỗi khách</th><th className="px-4 py-3">Số cabin/chuyến</th><th className="w-14 px-4 py-3"><span className="sr-only">Xóa</span></th></tr></thead>
            <tbody className="divide-y divide-slate-200">{form.cabins.map((cabin, index) => <tr key={index} className="bg-white"><td className="p-3"><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold outline-none focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-500" value={cabin.name} onChange={(event) => updateCabin(index, 'name', event.target.value)} placeholder="Deluxe Balcony" disabled={isEditing} /></td><td className="p-3"><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-500" type="number" min="1" step="50000" value={cabin.price} onChange={(event) => updateCabin(index, 'price', event.target.value)} disabled={isEditing} /></td><td className="p-3"><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-500" type="number" min="1" value={cabin.units} onChange={(event) => updateCabin(index, 'units', event.target.value)} disabled={isEditing} /></td><td className="p-3"><button type="button" onClick={() => removeCabin(index)} disabled={isEditing || form.cabins.length === 1} className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30" aria-label={`Xóa cabin ${index + 1}`}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal-50 p-4"><span className="text-sm font-bold text-teal-900">Giá hiển thị từ</span><strong className="text-xl font-extrabold text-teal-800">{formatMoney(basePrice)}</strong></div>
      </div>
    );

    if (step === 2) return (
      <div className="space-y-6">
        <div><h3 className="text-lg font-extrabold text-slate-900">Hình ảnh và nội dung bán hàng</h3><p className="mt-1 text-sm text-slate-500">Tập trung vào ảnh thật, điểm nổi bật và thông tin khách cần trước khi đặt.</p></div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4"><label className="admin-field"><span>Ảnh bìa *</span><input value={form.image} onChange={(event) => setField('image', event.target.value)} /></label><label className="admin-field"><span>Album ảnh, mỗi dòng một URL</span><textarea rows="5" value={form.galleryImages} onChange={(event) => setField('galleryImages', event.target.value)} placeholder="/images/cruises/..." /></label></div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">{form.image ? <img src={form.image} alt="Xem trước ảnh bìa" className="h-56 w-full object-cover" /> : <div className="grid h-56 place-items-center text-slate-400"><Image className="h-9 w-9" /></div>}<p className="p-3 text-xs font-semibold text-slate-600">Ảnh bìa · {gallery.length} ảnh trong album</p></div>
        </div>
        <div><div className="mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-teal-700" /><h4 className="text-sm font-extrabold text-slate-900">Tiện ích nổi bật</h4></div><FeatureEditor features={form.features} onChange={(features) => setField('features', features)} /></div>
        <label className="admin-field"><span>Bài giới thiệu *</span><textarea rows="5" value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Mô tả trải nghiệm, phong cách tàu và nhóm khách phù hợp..." /></label>
        <div className="grid gap-4 lg:grid-cols-2"><label className="admin-field"><span>Lịch trình, mỗi dòng một chặng *</span><textarea rows="6" value={form.itinerary} onChange={(event) => setField('itinerary', event.target.value)} /></label><label className="admin-field"><span>Chính sách, mỗi dòng một mục</span><textarea rows="6" value={form.policies} onChange={(event) => setField('policies', event.target.value)} /></label></div>
        <div className="space-y-3"><div className="flex items-center justify-between"><h4 className="text-sm font-extrabold text-slate-900">Câu hỏi thường gặp</h4><button type="button" onClick={() => setForm((current) => ({ ...current, faqs: [...current.faqs, { question: '', answer: '' }] }))} className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"><Plus className="h-4 w-4" /> Thêm câu hỏi</button></div>{form.faqs.map((faq, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1.5fr_auto]"><label className="admin-field"><span>Câu hỏi</span><input value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} /></label><label className="admin-field"><span>Câu trả lời</span><textarea rows="2" value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} /></label><button type="button" onClick={() => setForm((current) => ({ ...current, faqs: current.faqs.filter((_, faqIndex) => faqIndex !== index) }))} className="self-end rounded-xl p-2.5 text-rose-600 hover:bg-rose-50" aria-label="Xóa câu hỏi"><Trash2 className="h-4 w-4" /></button></div>)}</div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div><h3 className="text-lg font-extrabold text-slate-900">Mở bán và kiểm tra</h3><p className="mt-1 text-sm text-slate-500">Tạo lịch tự động và quyết định thời điểm hiển thị với khách.</p></div>
        {!isEditing && <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5"><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-teal-800" /><div><h4 className="text-sm font-extrabold text-slate-900">Lịch khởi hành định kỳ</h4><p className="text-xs text-slate-600">Mỗi chuyến dùng giá và số lượng cabin đã nhập ở bước 2.</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="admin-field"><span>Ngày đầu tiên</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={form.firstDepartureDate} onChange={(event) => setField('firstDepartureDate', event.target.value)} /></label><label className="admin-field"><span>Giờ đi</span><input type="time" value={form.departureTime} onChange={(event) => setField('departureTime', event.target.value)} /></label><label className="admin-field"><span>Số chuyến</span><input type="number" min="1" max="52" value={form.departureCount} onChange={(event) => setField('departureCount', event.target.value)} /></label><label className="admin-field"><span>Lặp lại sau</span><select value={form.departureIntervalDays} onChange={(event) => setField('departureIntervalDays', event.target.value)}><option value="1">Mỗi ngày</option><option value="7">Mỗi tuần</option><option value="14">Mỗi 2 tuần</option><option value="30">Mỗi tháng</option></select></label></div></section>}
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"><div><span className="text-xs font-bold text-slate-400">DU THUYỀN</span><strong className="mt-1 block text-sm text-slate-900">{form.name || 'Chưa đặt tên'}</strong></div><div><span className="text-xs font-bold text-slate-400">GIÁ TỪ</span><strong className="mt-1 block text-sm text-teal-800">{formatMoney(basePrice)}</strong></div><div><span className="text-xs font-bold text-slate-400">CABIN</span><strong className="mt-1 block text-sm text-slate-900">{form.cabins.length} hạng · {form.cabins.reduce((sum, cabin) => sum + Number(cabin.units || 0), 0)} phòng/chuyến</strong></div><div><span className="text-xs font-bold text-slate-400">NỘI DUNG</span><strong className="mt-1 block text-sm text-slate-900">{gallery.length + 1} ảnh · {form.features.length} tiện ích</strong></div></section>
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setField('status', 'inactive')} className={`rounded-2xl border p-4 text-left transition ${form.status === 'inactive' ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-700'}`}><strong className="flex items-center gap-2 text-sm"><Save className="h-4 w-4" /> Lưu nháp nội bộ</strong><small className="mt-1 block opacity-75">Chưa xuất hiện trên trang người dùng.</small></button><button type="button" onClick={() => setField('status', 'active')} className={`rounded-2xl border p-4 text-left transition ${form.status === 'active' ? 'border-teal-700 bg-teal-700 text-white' : 'border-teal-200 bg-white text-teal-800'}`}><strong className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4" /> Lưu và mở bán</strong><small className="mt-1 block opacity-75">Hiển thị ngay khi lưu thành công.</small></button></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ListChecks className="h-4 w-4 text-teal-700" /> Kiểm tra trước khi lưu</h4><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{[['Thông tin tàu', !stepError(0)], ['Cabin và giá', !stepError(1)], ['Hình ảnh và lịch trình', !stepError(2)], ['Lịch mở bán', !stepError(3)]].map(([label, ready]) => <span key={label} className={`flex items-center gap-2 font-bold ${ready ? 'text-emerald-700' : 'text-rose-700'}`}>{ready ? <Check className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}{label}</span>)}</div></div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cruise-editor-title">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Ship className="h-5 w-5" /></span><div className="min-w-0"><h2 id="cruise-editor-title" className="truncate text-lg font-extrabold text-slate-900">{isEditing ? `Chỉnh sửa ${cruise.name}` : 'Thêm du thuyền'}</h2><p className="text-xs text-slate-500">{isEditing ? 'Cập nhật nội dung đang vận hành' : draftSavedAt ? `Nháp tự lưu lúc ${draftSavedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Biểu mẫu tự lưu nháp trong trình duyệt'}</p></div></div><div className="flex items-center gap-1">{!isEditing && <button type="button" onClick={clearDraft} className="rounded-xl px-2.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100" title="Xóa dữ liệu nháp đang lưu">Xóa nháp</button>}<button type="button" onClick={() => setShowPreview((value) => !value)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Xem trước"><Eye className="h-5 w-5" /></button><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></div></header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[230px_1fr]">
          <nav className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r lg:p-4" aria-label="Các bước thêm du thuyền"><ol className="grid grid-cols-4 gap-2 lg:grid-cols-1">{STEPS.map(({ label, description, Icon }, index) => <li key={label}><button type="button" onClick={() => { if (index <= step) { setStep(index); setError(''); } else if (index === step + 1 && !stepError(step)) { setStep(index); setError(''); } else setError(stepError(step) || 'Hãy hoàn thành lần lượt từng bước.'); }} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition lg:p-3 ${step === index ? 'bg-teal-700 text-white shadow-sm' : index < step ? 'bg-teal-50 text-teal-900' : 'text-slate-500 hover:bg-white'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${step === index ? 'bg-white/15' : 'bg-white'}`}>{index < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span className="hidden min-w-0 lg:block"><strong className="block text-sm">{index + 1}. {label}</strong><small className="block truncate text-[11px] opacity-70">{description}</small></span></button></li>)}</ol></nav>

          <div className="min-h-0 overflow-y-auto"><div className={`mx-auto p-5 sm:p-7 ${showPreview ? 'max-w-5xl' : 'max-w-4xl'}`}>{showPreview && <aside className="mb-6 grid gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 sm:grid-cols-[180px_1fr]"><div className="overflow-hidden rounded-xl bg-white">{form.image && <img src={form.image} alt="Ảnh xem trước" className="h-36 w-full object-cover" />}</div><div><span className="text-xs font-bold text-teal-700">XEM TRƯỚC THẺ TÌM KIẾM</span><h3 className="mt-2 text-xl font-extrabold text-slate-900">{form.name || 'Tên du thuyền'}</h3><p className="mt-1 text-sm text-slate-600">{form.destination} · {form.durationDays} ngày {Math.max(0, Number(form.durationDays) - 1)} đêm</p><strong className="mt-3 block text-lg text-teal-800">Từ {formatMoney(basePrice)} / khách</strong></div></aside>}{renderStep()}</div></div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6"><div className="min-h-5 flex-1">{error && <p className="flex items-center gap-2 text-sm font-bold text-rose-700" role="alert"><CircleAlert className="h-4 w-4 shrink-0" />{error}</p>}</div><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => step ? setStep((current) => current - 1) : onClose()}><ArrowLeft className="h-4 w-4" /> {step ? 'Quay lại' : 'Đóng'}</button>{step < STEPS.length - 1 ? <button type="button" className="btn-primary" onClick={goNext}>Tiếp tục <ArrowRight className="h-4 w-4" /></button> : <button type="submit" disabled={saving} className="btn-primary"><Check className="h-4 w-4" /> {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : form.status === 'active' ? 'Lưu và mở bán' : 'Lưu nháp'}</button>}</div></footer>
      </form>
    </div>,
    document.body,
  );
}
