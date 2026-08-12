import { Check, Plus, X } from 'lucide-react';
import React, { useId, useMemo, useState } from 'react';

const normalizeText = (value) => value.trim().replace(/\s+/g, ' ');
const normalizeKey = (value) => normalizeText(value).toLocaleLowerCase('vi-VN');

export default function AmenityPicker({
  label,
  options,
  value = [],
  onChange,
  customLabel = 'Thêm tiện ích khác',
  placeholder = 'Ví dụ: Phòng gym, khu vui chơi trẻ em',
  columns = 'sm:grid-cols-4',
}) {
  const inputId = useId();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const selectedValues = Array.isArray(value) ? value : [];

  const optionByKey = useMemo(
    () => new Map(options.map((item) => [normalizeKey(item), item])),
    [options],
  );

  const customItems = selectedValues.filter((item) => !optionByKey.has(normalizeKey(item)));

  const toggleOption = (item) => {
    const key = normalizeKey(item);
    const isSelected = selectedValues.some((current) => normalizeKey(current) === key);
    onChange(isSelected
      ? selectedValues.filter((current) => normalizeKey(current) !== key)
      : [...selectedValues, item]);
    setError('');
  };

  const addCustomItems = () => {
    const candidates = input
      .split(/[,;\n]/)
      .map(normalizeText)
      .filter(Boolean);

    if (!candidates.length) {
      setError('Hãy nhập ít nhất một tiện ích.');
      return;
    }

    const next = [...selectedValues];
    const existingKeys = new Set(next.map(normalizeKey));
    let addedCount = 0;

    candidates.forEach((candidate) => {
      if (candidate.length > 80 || next.length >= 30) return;
      const matchedOption = optionByKey.get(normalizeKey(candidate));
      const resolved = matchedOption || candidate;
      const key = normalizeKey(resolved);
      if (existingKeys.has(key)) return;
      next.push(resolved);
      existingKeys.add(key);
      addedCount += 1;
    });

    if (!addedCount) {
      setError(selectedValues.length >= 30 ? 'Chỉ có thể thêm tối đa 30 tiện ích.' : 'Tiện ích này đã có hoặc tên dài quá 80 ký tự.');
      return;
    }

    onChange(next);
    setInput('');
    setError('');
  };

  const removeCustomItem = (item) => {
    const key = normalizeKey(item);
    onChange(selectedValues.filter((current) => normalizeKey(current) !== key));
    setError('');
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-700">{label}</p>
      <div className={`grid grid-cols-2 gap-2 ${columns}`}>
        {options.map((item) => {
          const isSelected = selectedValues.some((current) => normalizeKey(current) === normalizeKey(item));
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggleOption(item)}
              aria-pressed={isSelected}
              className={`flex min-h-9 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition active:scale-[0.98] ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span>{item}</span>
              {isSelected
                ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Tiện ích tự thêm">
          {customItems.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 py-1.5 pl-2.5 pr-1.5 text-xs font-semibold text-blue-800">
              {item}
              <button
                type="button"
                onClick={() => removeCustomItem(item)}
                className="rounded-md p-1 text-blue-700 transition hover:bg-blue-100 hover:text-blue-950 active:scale-[0.98]"
                aria-label={`Xóa tiện ích ${item}`}
                title="Xóa tiện ích"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-[11px] font-bold text-slate-700">{customLabel}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            type="text"
            value={input}
            onChange={(event) => { setInput(event.target.value); setError(''); }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomItems();
              }
            }}
            placeholder={placeholder}
            aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ''}`}
            className="min-h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={addCustomItems}
            disabled={!input.trim()}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm
          </button>
        </div>
        <p id={`${inputId}-help`} className="text-[11px] text-slate-600">Nhấn Enter để thêm. Có thể nhập nhiều mục, ngăn cách bằng dấu phẩy.</p>
        {error && <p id={`${inputId}-error`} role="alert" className="text-[11px] font-semibold text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
