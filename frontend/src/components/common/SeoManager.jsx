import { useEffect } from 'react';
import { isPrivateTab, pathForTab } from '../../utils/siteRoutes';

const DEFAULT_IMAGE = '/images/dibaoxa-coastal-resort.webp';
const SITE_NAME = 'Dibaoxa';

const SEO_BY_TAB = {
  home: ['Du lịch Việt Nam, khách sạn, du thuyền và vé máy bay', 'Lên kế hoạch du lịch Việt Nam cùng Dibaoxa với khách sạn, du thuyền, vé máy bay và hỗ trợ hành trình trong một nơi.'],
  cruises: ['Tìm du thuyền Hạ Long và Lan Hạ', 'So sánh du thuyền, cabin, lịch khởi hành và giá theo hành trình tại Hạ Long, Lan Hạ và Cát Bà.'],
  flights: ['Tìm vé máy bay nội địa Việt Nam', 'Tìm chuyến bay giữa các sân bay Việt Nam, xem hành trình và quản lý đơn ngay trên Dibaoxa.'],
  hotels: ['Tìm khách sạn và khu nghỉ dưỡng Việt Nam', 'Khám phá khách sạn, resort và phòng nghỉ theo điểm đến, ngày lưu trú và ngân sách.'],
  packages: ['Gói du lịch và staycation', 'Khám phá các gói du lịch và staycation được thiết kế cho hành trình tại Việt Nam.'],
  corporate: ['Du lịch doanh nghiệp và đoàn riêng', 'Giải pháp du lịch doanh nghiệp, nghỉ dưỡng đoàn và hỗ trợ hành trình theo yêu cầu.'],
  blog: ['Cẩm nang du lịch Việt Nam', 'Kinh nghiệm chọn khách sạn, du thuyền, vé máy bay và lên lịch trình tại Việt Nam.'],
  contact: ['Liên hệ tư vấn du lịch', 'Gửi yêu cầu tư vấn du thuyền, khách sạn, vé máy bay hoặc hành trình doanh nghiệp tới Dibaoxa.'],
  'case-studies': ['Câu chuyện khách hàng', 'Đọc trải nghiệm thực tế được gửi bởi khách hàng sau các kỳ nghỉ và hành trình cùng Dibaoxa.'],
  privacy: ['Chính sách bảo mật', 'Tìm hiểu cách Dibaoxa thu thập, sử dụng và bảo vệ dữ liệu cá nhân của khách hàng.'],
  thanks: ['Cảm ơn bạn đã liên hệ', 'Dibaoxa đã tiếp nhận yêu cầu và sẽ phản hồi theo thông tin bạn cung cấp.'],
  'not-found': ['Không tìm thấy trang', 'Trang bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ khác.'],
  'hotel-detail': ['Chi tiết khách sạn và phòng nghỉ', 'Xem hình ảnh, tiện ích, chính sách, loại phòng và tình trạng phòng theo ngày.'],
  'cruise-detail': ['Chi tiết du thuyền và cabin', 'Xem thư viện ảnh, cabin, lịch khởi hành, hành trình và chính sách du thuyền.'],
  booking: ['Xác nhận đặt phòng', 'Kiểm tra thông tin khách, phòng, dịch vụ và thanh toán trước khi xác nhận đơn.'],
  login: ['Đăng nhập', 'Đăng nhập tài khoản Dibaoxa để quản lý đơn và hành trình.'],
  register: ['Đăng ký tài khoản', 'Tạo tài khoản Dibaoxa để đặt dịch vụ và theo dõi hành trình.'],
  profile: ['Hồ sơ cá nhân', 'Quản lý thông tin tài khoản và quyền lợi thành viên Dibaoxa.'],
  'my-bookings': ['Đơn và hành trình của tôi', 'Theo dõi đặt phòng, vé máy bay, du thuyền và trạng thái thanh toán.'],
  admin: ['Quản trị vận hành', 'Khu vực quản trị nội bộ của Dibaoxa.'],
};

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

export default function SeoManager({ tab, entityName, entityDescription, entityImage, entityId }) {
  useEffect(() => {
    const [baseTitle, baseDescription] = SEO_BY_TAB[tab] || SEO_BY_TAB.home;
    const title = entityName ? `${entityName} | ${SITE_NAME}` : `${baseTitle} | ${SITE_NAME}`;
    const description = entityDescription?.slice(0, 158) || baseDescription;
    const origin = import.meta.env.VITE_SITE_URL || window.location.origin;
    const path = pathForTab(tab, { id: entityId });
    const canonicalUrl = new URL(path, origin).toString();
    const imageUrl = new URL(entityImage || DEFAULT_IMAGE, origin).toString();
    const noIndex = isPrivateTab(tab) || tab === 'not-found';

    document.title = title;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['TravelAgency', 'LocalBusiness'],
          '@id': `${origin}/#organization`,
          name: SITE_NAME,
          url: origin,
          image: imageUrl,
          telephone: '19008899',
          email: 'support@dibaoxa.vn',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Landmark 81',
            addressLocality: 'Thành phố Hồ Chí Minh',
            addressCountry: 'VN',
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          name: SITE_NAME,
          url: origin,
          publisher: { '@id': `${origin}/#organization` },
        },
        {
          '@type': 'WebPage',
          name: title,
          description,
          url: canonicalUrl,
          isPartOf: { '@id': `${origin}/#website` },
        },
      ],
    };
    let script = document.getElementById('dibaoxa-structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'dibaoxa-structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(graph);
  }, [tab, entityName, entityDescription, entityImage, entityId]);

  return null;
}
