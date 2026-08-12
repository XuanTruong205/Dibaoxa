import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
  Phone,
  SearchX,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useTravelPlanStore } from '../../store/useTravelPlanStore';
import TravelOrderDialog from './TravelOrderDialog';

export function getDateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

export function useFavoriteIds(storageKey) {
  const [ids, setIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const toggle = (id) => {
    setIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return { ids, toggle };
}

export function TravelSearchHero({ label, title, description, image, imageAlt, children }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="travel-search-hero" aria-labelledby="travel-search-title">
      <motion.div
        className="travel-search-hero__copy"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="travel-search-hero__label">{label}</span>
        <h1 id="travel-search-title">{title}</h1>
        <p>{description}</p>
        {children}
      </motion.div>
      <motion.div
        className="travel-search-hero__media"
        initial={reduceMotion ? false : { opacity: 0, x: 30, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.72, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src={image} alt={imageAlt} loading="eager" decoding="async" />
      </motion.div>
    </section>
  );
}

export function FavoriteButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      className={`travel-favorite ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Bỏ lưu ${label}` : `Lưu ${label}`}
      title={active ? 'Đã lưu' : 'Lưu yêu thích'}
    >
      <Heart />
    </button>
  );
}

export function ResultsToolbar({ count, sort, onSort, onOpenFilters, resultLabel = 'lựa chọn', sortOptions }) {
  const options = sortOptions || [
    { value: 'recommended', label: 'Đề xuất' },
    { value: 'price-asc', label: 'Giá thấp nhất' },
    { value: 'price-desc', label: 'Giá cao nhất' },
    { value: 'rating', label: 'Đánh giá cao' },
  ];
  return (
    <div className="travel-results-toolbar">
      <div>
        <strong>{count} {resultLabel}</strong>
        <span>Giá đang hiển thị đã gồm thuế và phí cơ bản.</span>
      </div>
      <div>
        <button type="button" className="travel-filter-trigger" onClick={onOpenFilters}><SlidersHorizontal /> Bộ lọc</button>
        <label>
          <span>Sắp xếp</span>
          <select value={sort} onChange={(event) => onSort(event.target.value)} className="glass-input">
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

export function ResultsPagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const visiblePages = Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter((item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1);
  return (
    <nav className="catalog-pagination" aria-label="Phân trang kết quả">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft /> Trước</button>
      {visiblePages.map((item, index) => (
        <React.Fragment key={item}>
          {index > 0 && visiblePages[index - 1] !== item - 1 && <span aria-hidden="true">...</span>}
          <button type="button" className={item === page ? 'is-active' : ''} aria-current={item === page ? 'page' : undefined} onClick={() => onChange(item)}>{item}</button>
        </React.Fragment>
      ))}
      <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Tiếp <ChevronRight /></button>
    </nav>
  );
}

export function ResultsSkeleton({ variant = 'standard', count = 3 }) {
  return (
    <div className={`travel-results-list travel-results-list--${variant}`} aria-label="Đang tải kết quả">
      {Array.from({ length: count }, (_, index) => (
        <div className="travel-result-skeleton" key={index} aria-hidden="true">
          <span />
          <div><i /><i /><i /></div>
        </div>
      ))}
    </div>
  );
}

export function EmptyResults({ title, description, onReset, imageSrc, imageAlt = '' }) {
  return (
    <div className="travel-empty" role="status">
      {imageSrc
        ? <img className="travel-empty__illustration" src={imageSrc} alt={imageAlt} loading="lazy" decoding="async" />
        : <span><SearchX /></span>}
      <h2>{title}</h2>
      <p>{description}</p>
      <button type="button" className="btn-secondary" onClick={onReset}>Đặt lại bộ lọc</button>
    </div>
  );
}

function SavedPlanDialog({ selection, onClose, onViewPlans }) {
  const savePlan = useTravelPlanStore((state) => state.savePlan);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', note: '' });
  const [errors, setErrors] = useState({});
  const [savedPlan, setSavedPlan] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!selection) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selection, onClose]);

  useEffect(() => {
    setErrors({});
    setSavedPlan(null);
    setForm({ fullName: '', email: '', phone: '', note: '' });
  }, [selection]);

  if (!selection) return null;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.fullName.trim().length < 2) nextErrors.fullName = 'Vui lòng nhập họ tên người liên hệ.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Email chưa đúng định dạng.';
    if (!/^[0-9+\s]{9,15}$/.test(form.phone)) nextErrors.phone = 'Số điện thoại cần từ 9 đến 15 chữ số.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSavedPlan(savePlan({ ...selection, traveler: form }));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="travel-dialog-backdrop"
        role="presentation"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        <motion.section
          className="travel-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="travel-dialog-title"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.99 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <button type="button" className="travel-dialog__close" onClick={onClose} aria-label="Đóng"><X /></button>
          {savedPlan ? (
            <div className="travel-dialog__success">
              <span><CheckCircle2 /></span>
              <h2 id="travel-dialog-title">Đã lưu hành trình</h2>
              <p>Dibaoxa đã lưu lựa chọn với mã <strong>{savedPlan.id}</strong>. Đây chưa phải giao dịch thanh toán.</p>
              <div>
                <button type="button" className="btn-primary" onClick={onViewPlans}>Xem hành trình <ArrowRight /></button>
                <button type="button" className="btn-secondary" onClick={onClose}>Tiếp tục tìm</button>
              </div>
            </div>
          ) : (
            <>
              <div className="travel-dialog__heading">
                <span>{selection.type === 'flight' ? 'Hành trình bay' : 'Hành trình du thuyền'}</span>
                <h2 id="travel-dialog-title">{selection.title}</h2>
                <p>{selection.summary}</p>
              </div>
              <div className="travel-dialog__price">
                <span>Giá tham khảo</span><strong>{formatMoney(selection.totalPrice)}</strong>
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <label className="field-group">
                  <span><UserRound /> Họ và tên</span>
                  <input className="glass-input" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} autoFocus />
                  {errors.fullName && <small className="form-error">{errors.fullName}</small>}
                </label>
                <label className="field-group">
                  <span><Mail /> Email</span>
                  <input className="glass-input" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                  {errors.email && <small className="form-error">{errors.email}</small>}
                </label>
                <label className="field-group">
                  <span><Phone /> Điện thoại</span>
                  <input className="glass-input" inputMode="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                  {errors.phone && <small className="form-error">{errors.phone}</small>}
                </label>
                <label className="field-group travel-dialog__note">
                  <span><CalendarDays /> Ghi chú</span>
                  <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} placeholder="Nhu cầu đặc biệt hoặc thời gian liên hệ phù hợp" />
                </label>
                <p className="travel-dialog__disclaimer">Giá vé và cabin sẽ được xác nhận lại trước khi thanh toán.</p>
                <button type="submit" className="btn-primary">Lưu hành trình <ArrowRight /></button>
              </form>
            </>
          )}
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

export function PlanDialog(props) {
  return <TravelOrderDialog {...props} />;
}
