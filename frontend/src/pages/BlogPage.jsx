import { ArrowRight, CalendarDays, Search, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useMemo, useState } from 'react';

const POSTS = [
  { id: 1, category: 'Du thuyền', title: 'Chọn hành trình 2 ngày 1 đêm hay 3 ngày 2 đêm?', summary: 'So sánh thời lượng nghỉ, điểm tham quan và nhịp trải nghiệm phù hợp cho từng nhóm khách.', date: '08/08/2026', image: '/images/dibaoxa-cruise-hero.png', body: ['Hành trình 2 ngày 1 đêm phù hợp với cuối tuần và những nhóm muốn tập trung vào các điểm nổi bật.', 'Hành trình 3 ngày 2 đêm có thêm thời gian nghỉ, đi sâu hơn vào vùng vịnh và ít vội hơn giữa các hoạt động.', 'Hãy chọn dựa trên số ngày nghỉ, độ tuổi thành viên và mức độ tham gia hoạt động của cả nhóm.'] },
  { id: 2, category: 'Du lịch', title: 'Chuẩn bị gì cho chuyến đi Hạ Long đầu tiên', summary: 'Giấy tờ, hành lý, giờ có mặt tại cảng và những lưu ý trước khi lên tàu.', date: '02/08/2026', image: '/images/dibaoxa-discover-vietnam.webp', body: ['Nên mang giấy tờ tùy thân, trang phục nhẹ, giày dễ di chuyển và một áo khoác mỏng.', 'Có mặt tại điểm đón đúng giờ giúp đơn vị vận hành hoàn tất thủ tục và đưa khách lên tàu theo lịch.', 'Nếu có yêu cầu ăn uống, hãy thông báo trước để du thuyền chuẩn bị phù hợp.'] },
  { id: 3, category: 'Khách sạn', title: 'Kết hợp du thuyền và nghỉ dưỡng ven biển', summary: 'Sắp xếp khách sạn trước hoặc sau hành trình để chuyến đi bớt gấp.', date: '25/07/2026', image: '/images/dibaoxa-coastal-resort.webp', body: ['Một đêm khách sạn trước ngày lên tàu giúp bạn chủ động nếu bay từ tỉnh khác.', 'Sau hành trình, nghỉ thêm một đêm phù hợp với gia đình có trẻ nhỏ hoặc người lớn tuổi.', 'Ưu tiên chỗ nghỉ gần điểm đón hoặc thuận đường ra sân bay để giảm thời gian di chuyển.'] },
  { id: 4, category: 'Vé máy bay', title: 'Chọn giờ bay phù hợp với giờ lên du thuyền', summary: 'Tính khoảng đệm giữa giờ hạ cánh và thời gian tập trung tại cảng.', date: '18/07/2026', image: '/images/dibaoxa-flight-hero.png', body: ['Không nên chọn chuyến bay hạ cánh quá sát giờ tập trung tại cảng.', 'Khoảng đệm hợp lý cần tính cả thời gian lấy hành lý và di chuyển đường bộ.', 'Với chuyến sáng sớm, cân nhắc đến điểm khởi hành từ tối hôm trước.'] },
  { id: 5, category: 'Du lịch', title: 'Lịch trình dành cho gia đình có trẻ nhỏ', summary: 'Chọn cabin, hoạt động và thời gian nghỉ phù hợp với nhịp sinh hoạt của trẻ.', date: '12/07/2026', image: '/images/dibaoxa-dalat-retreat.webp', body: ['Cabin gia đình hoặc cabin thông nhau giúp phụ huynh dễ chăm sóc trẻ.', 'Nên ưu tiên tàu có khu vực chung rộng, thực đơn linh hoạt và lịch trình không quá dày.', 'Kiểm tra trước chính sách tuổi và phụ thu của từng đơn vị vận hành.'] },
];

const CATEGORIES = ['Tất cả', 'Du lịch', 'Khách sạn', 'Du thuyền', 'Vé máy bay'];

export default function BlogPage() {
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  const posts = useMemo(() => POSTS.filter((post) => (category === 'Tất cả' || post.category === category) && (!query.trim() || `${post.title} ${post.summary}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))), [category, query]);

  return (
    <div className="mixi-content-page mixi-blog-page">
      <section className="mixi-page-hero"><div><span>Kinh nghiệm du lịch</span><h1>Thông tin cho hành trình sắp tới.</h1><p>Tìm hiểu trước về điểm đến, phương tiện và nơi nghỉ.</p></div><img src="/images/dibaoxa-discover-vietnam.webp" alt="Khám phá Việt Nam" /></section>
      <section className="mixi-blog-catalog">
        <div className="mixi-blog-toolbar"><div>{CATEGORIES.map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><label><Search /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bài viết" /></label></div>
        {posts.length ? <div className="mixi-blog-list">{posts.map((post, index) => <motion.article key={post.id} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}><img src={post.image} alt={post.title} /><div><span>{post.category}</span><h2>{post.title}</h2><p>{post.summary}</p><footer><time><CalendarDays /> {post.date}</time><button type="button" onClick={() => setSelectedPost(post)}>Đọc bài viết <ArrowRight /></button></footer></div></motion.article>)}</div> : <div className="mixi-home-empty"><Search /><h2>Không tìm thấy bài viết</h2><p>Hãy thử từ khóa hoặc chủ đề khác.</p><button type="button" className="btn-secondary" onClick={() => { setQuery(''); setCategory('Tất cả'); }}>Đặt lại tìm kiếm</button></div>}
      </section>

      <AnimatePresence>{selectedPost && <motion.div className="travel-dialog-backdrop" role="presentation" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPost(null); }}><motion.article className="mixi-blog-reader" role="dialog" aria-modal="true" aria-labelledby="blog-reader-title" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><button type="button" onClick={() => setSelectedPost(null)} aria-label="Đóng"><X /></button><img src={selectedPost.image} alt={selectedPost.title} /><div><span>{selectedPost.category} · {selectedPost.date}</span><h2 id="blog-reader-title">{selectedPost.title}</h2>{selectedPost.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></motion.article></motion.div>}</AnimatePresence>
    </div>
  );
}

