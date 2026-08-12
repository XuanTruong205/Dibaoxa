export const VIETNAM_AIRPORTS = [
  { code: 'HAN', name: 'Cảng hàng không quốc tế Nội Bài', city: 'Hà Nội', region: 'Miền Bắc' },
  { code: 'HPH', name: 'Cảng hàng không quốc tế Cát Bi', city: 'Hải Phòng', region: 'Miền Bắc' },
  { code: 'VDO', name: 'Cảng hàng không quốc tế Vân Đồn', city: 'Quảng Ninh', region: 'Miền Bắc' },
  { code: 'DIN', name: 'Cảng hàng không Điện Biên', city: 'Điện Biên Phủ', region: 'Miền Bắc' },
  { code: 'THD', name: 'Cảng hàng không Thọ Xuân', city: 'Thanh Hóa', region: 'Miền Bắc' },
  { code: 'VII', name: 'Cảng hàng không quốc tế Vinh', city: 'Nghệ An', region: 'Miền Trung' },
  { code: 'VDH', name: 'Cảng hàng không Đồng Hới', city: 'Quảng Bình', region: 'Miền Trung' },
  { code: 'HUI', name: 'Cảng hàng không quốc tế Phú Bài', city: 'Huế', region: 'Miền Trung' },
  { code: 'DAD', name: 'Cảng hàng không quốc tế Đà Nẵng', city: 'Đà Nẵng', region: 'Miền Trung' },
  { code: 'VCL', name: 'Cảng hàng không Chu Lai', city: 'Quảng Nam', region: 'Miền Trung' },
  { code: 'UIH', name: 'Cảng hàng không Phù Cát', city: 'Quy Nhơn', region: 'Miền Trung' },
  { code: 'TBB', name: 'Cảng hàng không Tuy Hòa', city: 'Phú Yên', region: 'Miền Trung' },
  { code: 'CXR', name: 'Cảng hàng không quốc tế Cam Ranh', city: 'Khánh Hòa', region: 'Miền Trung' },
  { code: 'PXU', name: 'Cảng hàng không Pleiku', city: 'Gia Lai', region: 'Tây Nguyên' },
  { code: 'BMV', name: 'Cảng hàng không Buôn Ma Thuột', city: 'Đắk Lắk', region: 'Tây Nguyên' },
  { code: 'DLI', name: 'Cảng hàng không quốc tế Liên Khương', city: 'Đà Lạt', region: 'Tây Nguyên' },
  { code: 'SGN', name: 'Cảng hàng không quốc tế Tân Sơn Nhất', city: 'TP. Hồ Chí Minh', region: 'Miền Nam' },
  { code: 'VCA', name: 'Cảng hàng không quốc tế Cần Thơ', city: 'Cần Thơ', region: 'Miền Nam' },
  { code: 'PQC', name: 'Cảng hàng không quốc tế Phú Quốc', city: 'Kiên Giang', region: 'Miền Nam' },
  { code: 'VKG', name: 'Cảng hàng không Rạch Giá', city: 'Kiên Giang', region: 'Miền Nam' },
  { code: 'CAH', name: 'Cảng hàng không Cà Mau', city: 'Cà Mau', region: 'Miền Nam' },
  { code: 'VCS', name: 'Cảng hàng không Côn Đảo', city: 'Bà Rịa - Vũng Tàu', region: 'Miền Nam' },
];

export const VIETNAM_AIRPORT_CODES = new Set(VIETNAM_AIRPORTS.map((airport) => airport.code));

export function getVietnamAirport(code) {
  return VIETNAM_AIRPORTS.find((airport) => airport.code === code);
}
