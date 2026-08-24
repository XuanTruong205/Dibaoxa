export const TAB_PATHS = Object.freeze({
  home: '/',
  cruises: '/du-thuyen',
  flights: '/ve-may-bay',
  hotels: '/khach-san',
  packages: '/goi-uu-dai',
  corporate: '/doanh-nghiep',
  blog: '/cam-nang',
  contact: '/lien-he',
  'case-studies': '/cau-chuyen-khach-hang',
  privacy: '/chinh-sach-bao-mat',
  thanks: '/cam-on',
  'my-bookings': '/don-cua-toi',
  profile: '/ho-so',
  login: '/dang-nhap',
  register: '/dang-ky',
  admin: '/admin',
});

export function pathForTab(tab, params = {}) {
  if (tab === 'cruise-detail') return `/du-thuyen/${encodeURIComponent(params.id || '')}`;
  if (tab === 'hotel-detail') return `/khach-san/${encodeURIComponent(params.id || '')}`;
  if (tab === 'booking') return `/khach-san/${encodeURIComponent(params.id || '')}/dat-phong`;
  return TAB_PATHS[tab] || '/';
}

export function resolveSitePath(pathname) {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  const fixedRoute = Object.entries(TAB_PATHS).find(([, routePath]) => routePath === path);
  if (fixedRoute) return { tab: fixedRoute[0], params: {} };

  const cruiseMatch = path.match(/^\/du-thuyen\/([^/]+)$/);
  if (cruiseMatch) return { tab: 'cruise-detail', params: { id: decodeURIComponent(cruiseMatch[1]) } };

  const bookingMatch = path.match(/^\/khach-san\/([^/]+)\/dat-phong$/);
  if (bookingMatch) return { tab: 'booking', params: { id: decodeURIComponent(bookingMatch[1]) } };

  const hotelMatch = path.match(/^\/khach-san\/([^/]+)$/);
  if (hotelMatch) return { tab: 'hotel-detail', params: { id: decodeURIComponent(hotelMatch[1]) } };

  return { tab: 'not-found', params: {} };
}

export function isPrivateTab(tab) {
  return ['admin', 'booking', 'my-bookings', 'profile', 'login', 'register', 'thanks'].includes(tab);
}
