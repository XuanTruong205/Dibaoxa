import { httpError } from './httpError.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || 'Asia/Ho_Chi_Minh';

export function getTodayDateString(timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseDateOnly(value, fieldName = 'Ngày') {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw httpError(400, `${fieldName} phải đúng định dạng YYYY-MM-DD.`, 'INVALID_DATE');
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw httpError(400, `${fieldName} không tồn tại trên lịch.`, 'INVALID_DATE');
  }
  return date;
}

export function parseStayDates(checkInDate, checkOutDate, { allowPast = false } = {}) {
  const checkIn = parseDateOnly(checkInDate, 'Ngày nhận phòng');
  const checkOut = parseDateOnly(checkOutDate, 'Ngày trả phòng');

  if (checkOut <= checkIn) {
    throw httpError(400, 'Ngày trả phòng phải sau ngày nhận phòng.', 'INVALID_STAY_RANGE');
  }
  if (!allowPast && checkInDate < getTodayDateString()) {
    throw httpError(400, 'Ngày nhận phòng không được nằm trong quá khứ.', 'PAST_CHECK_IN');
  }

  return {
    checkIn,
    checkOut,
    nights: Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS),
  };
}

export function validateOptionalStayRange(checkInDate, checkOutDate, options) {
  if (!checkInDate && !checkOutDate) return null;
  if (!checkInDate || !checkOutDate) {
    throw httpError(400, 'Phải truyền đồng thời ngày nhận phòng và ngày trả phòng.', 'INCOMPLETE_STAY_RANGE');
  }
  return parseStayDates(checkInDate, checkOutDate, options);
}

export function dateRangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}
