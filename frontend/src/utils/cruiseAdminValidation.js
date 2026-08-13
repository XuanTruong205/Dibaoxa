export const CRUISE_ADMIN_LIMITS = {
  name: 160,
  operator: 160,
  destination: 100,
  departurePort: 300,
  image: 1000,
  description: 20_000,
  listItem: 300,
  cabinName: 120,
  route: 500,
  hullMaterial: 120,
  faqQuestion: 300,
  faqAnswer: 2_000,
};

export function parseCruiseLines(value) {
  return String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
}

export function makeCruiseAdminId(name, now = Date.now()) {
  const slug = String(name || '')
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90) || 'du-thuyen';
  return `cruise-${slug}-${Number(now).toString(36)}`;
}

function tooLong(value, maximum) {
  return String(value || '').trim().length > maximum;
}

function firstLongLine(lines, maximum) {
  return lines.findIndex((line) => line.length > maximum);
}

export function validateCruiseAdminStep(form, targetStep, { editing = false } = {}) {
  if (targetStep === 0) {
    if (form.name.trim().length < 2) return 'Hãy nhập tên du thuyền (ít nhất 2 ký tự).';
    if (tooLong(form.name, CRUISE_ADMIN_LIMITS.name)) return `Tên du thuyền không được quá ${CRUISE_ADMIN_LIMITS.name} ký tự.`;
    if (form.operator.trim().length < 2) return 'Hãy nhập đơn vị vận hành (ít nhất 2 ký tự).';
    if (tooLong(form.operator, CRUISE_ADMIN_LIMITS.operator)) return `Đơn vị vận hành không được quá ${CRUISE_ADMIN_LIMITS.operator} ký tự.`;
    if (form.destination.trim().length < 2 || form.departurePort.trim().length < 2) return 'Hãy hoàn thiện điểm đến và cảng khởi hành.';
    if (tooLong(form.destination, CRUISE_ADMIN_LIMITS.destination)) return `Điểm đến không được quá ${CRUISE_ADMIN_LIMITS.destination} ký tự.`;
    if (tooLong(form.departurePort, CRUISE_ADMIN_LIMITS.departurePort)) return `Cảng khởi hành không được quá ${CRUISE_ADMIN_LIMITS.departurePort} ký tự.`;
    if (!Number.isInteger(Number(form.durationDays)) || Number(form.durationDays) < 1 || Number(form.durationDays) > 30) return 'Số ngày phải là số nguyên từ 1 đến 30.';
    if (!Number.isInteger(Number(form.shipClass)) || Number(form.shipClass) < 1 || Number(form.shipClass) > 5) return 'Hạng sao phải là số nguyên từ 1 đến 5.';
    if (form.launchedYear !== '' && (!Number.isInteger(Number(form.launchedYear)) || Number(form.launchedYear) < 1900 || Number(form.launchedYear) > 2100)) return 'Năm hạ thủy phải nằm trong khoảng 1900 đến 2100.';
    if (form.cabinCount !== '' && (!Number.isInteger(Number(form.cabinCount)) || Number(form.cabinCount) < 1 || Number(form.cabinCount) > 10_000)) return 'Tổng cabin phải là số nguyên lớn hơn 0.';
    if (tooLong(form.hullMaterial, CRUISE_ADMIN_LIMITS.hullMaterial)) return `Vật liệu thân tàu không được quá ${CRUISE_ADMIN_LIMITS.hullMaterial} ký tự.`;
    if (tooLong(form.route, CRUISE_ADMIN_LIMITS.route)) return `Tuyến hành trình không được quá ${CRUISE_ADMIN_LIMITS.route} ký tự.`;
  }

  if (targetStep === 1) {
    if (!form.cabins.length) return 'Cần ít nhất một hạng cabin.';
    if (form.cabins.length > 100) return 'Mỗi du thuyền chỉ được cấu hình tối đa 100 hạng cabin.';
    const incompleteIndex = form.cabins.findIndex((cabin) => !cabin.name.trim() || !Number.isInteger(Number(cabin.price)) || Number(cabin.price) <= 0 || !Number.isInteger(Number(cabin.units)) || Number(cabin.units) < 1);
    if (incompleteIndex >= 0) return `Cabin dòng ${incompleteIndex + 1} cần có tên, giá nguyên dương và số lượng nguyên dương.`;
    const longNameIndex = form.cabins.findIndex((cabin) => tooLong(cabin.name, CRUISE_ADMIN_LIMITS.cabinName));
    if (longNameIndex >= 0) return `Tên cabin dòng ${longNameIndex + 1} không được quá ${CRUISE_ADMIN_LIMITS.cabinName} ký tự.`;
    if (form.cabins.some((cabin) => Number(cabin.price) > 1_000_000_000)) return 'Giá cabin không được vượt quá 1.000.000.000 đ.';
    if (form.cabins.some((cabin) => Number(cabin.units) > 10_000)) return 'Số lượng mỗi cabin không được vượt quá 10.000.';
    const names = form.cabins.map((cabin) => cabin.name.trim().toLocaleLowerCase('vi'));
    if (new Set(names).size !== names.length) return 'Tên các hạng cabin không được trùng nhau.';
  }

  if (targetStep === 2) {
    if (!form.image.trim()) return 'Hãy nhập ảnh bìa.';
    if (tooLong(form.image, CRUISE_ADMIN_LIMITS.image)) return `Đường dẫn ảnh bìa không được quá ${CRUISE_ADMIN_LIMITS.image} ký tự.`;
    if (form.description.trim().length < 10) return 'Bài giới thiệu cần ít nhất 10 ký tự.';
    if (tooLong(form.description, CRUISE_ADMIN_LIMITS.description)) return `Bài giới thiệu không được quá ${CRUISE_ADMIN_LIMITS.description.toLocaleString('vi-VN')} ký tự.`;

    const groups = [
      ['Album ảnh', parseCruiseLines(form.galleryImages)],
      ['Tiện ích', form.features.map((item) => String(item).trim()).filter(Boolean)],
      ['Lịch trình', parseCruiseLines(form.itinerary)],
      ['Chính sách', parseCruiseLines(form.policies)],
    ];
    if (!groups[2][1].length) return 'Hãy thêm ít nhất một chặng trong lịch trình.';
    for (const [label, lines] of groups) {
      if (lines.length > (label === 'Lịch trình' ? 100 : 50)) return `${label} đang có quá nhiều dòng.`;
      const lineIndex = firstLongLine(lines, CRUISE_ADMIN_LIMITS.listItem);
      if (lineIndex >= 0) return `${label}, dòng ${lineIndex + 1} không được quá ${CRUISE_ADMIN_LIMITS.listItem} ký tự.`;
    }

    if (form.faqs.length > 30) return 'Mỗi du thuyền chỉ được thêm tối đa 30 câu hỏi thường gặp.';
    const partialFaqIndex = form.faqs.findIndex((faq) => Boolean(faq.question.trim()) !== Boolean(faq.answer.trim()));
    if (partialFaqIndex >= 0) return `FAQ dòng ${partialFaqIndex + 1} cần có cả câu hỏi và câu trả lời.`;
    const shortFaqIndex = form.faqs.findIndex((faq) => (faq.question.trim() && faq.question.trim().length < 3) || (faq.answer.trim() && faq.answer.trim().length < 3));
    if (shortFaqIndex >= 0) return `Câu hỏi và câu trả lời FAQ dòng ${shortFaqIndex + 1} cần ít nhất 3 ký tự.`;
    const longFaqQuestion = form.faqs.findIndex((faq) => tooLong(faq.question, CRUISE_ADMIN_LIMITS.faqQuestion));
    if (longFaqQuestion >= 0) return `Câu hỏi FAQ dòng ${longFaqQuestion + 1} không được quá ${CRUISE_ADMIN_LIMITS.faqQuestion} ký tự.`;
    const longFaqAnswer = form.faqs.findIndex((faq) => tooLong(faq.answer, CRUISE_ADMIN_LIMITS.faqAnswer));
    if (longFaqAnswer >= 0) return `Câu trả lời FAQ dòng ${longFaqAnswer + 1} không được quá ${CRUISE_ADMIN_LIMITS.faqAnswer.toLocaleString('vi-VN')} ký tự.`;
  }

  if (targetStep === 3 && !editing) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.firstDepartureDate || '')) return 'Hãy chọn ngày khởi hành đầu tiên.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.departureTime || '')) return 'Giờ khởi hành không hợp lệ.';
    if (!Number.isInteger(Number(form.departureCount)) || Number(form.departureCount) < 1 || Number(form.departureCount) > 52) return 'Số chuyến phải là số nguyên từ 1 đến 52.';
    if (!Number.isInteger(Number(form.departureIntervalDays)) || Number(form.departureIntervalDays) < 1 || Number(form.departureIntervalDays) > 90) return 'Chu kỳ khởi hành phải từ 1 đến 90 ngày.';
  }
  return '';
}
