import {
  ArrowLeft,
  Bed,
  Check,
  ChevronRight,
  Compass,
  Eye,
  Lock,
  MapPin,
  Maximize2,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import ImageLightboxModal from '../components/hotel/ImageLightboxModal';
import Room360Modal from '../components/hotel/Room360Modal';
import RoomDetailModal from '../components/hotel/RoomDetailModal';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';

const getLocalDate = (days = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export default function HotelDetailPage({ hotelId, initialCheckIn, initialCheckOut, onBack, onProceedBooking, onRequireLogin }) {
  const { isAuthenticated } = useAuthStore();
  const { holdRoom } = useBookingStore();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dateError, setDateError] = useState('');
  const [holdingRoomId, setHoldingRoomId] = useState(null);
  const [selected360Room, setSelected360Room] = useState(null);
  const [selectedDetailRoom, setSelectedDetailRoom] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [checkIn, setCheckIn] = useState(initialCheckIn || getLocalDate(7));
  const [checkOut, setCheckOut] = useState(initialCheckOut || getLocalDate(9));

  const fetchHotelData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [hotelResponse, roomsResponse] = await Promise.all([
        api.get(`/hotels/${hotelId}`),
        api.get(`/hotels/${hotelId}/rooms`, { params: { check_in: checkIn, check_out: checkOut } }),
      ]);
      setHotel(hotelResponse.data.data);
      setRooms(Array.isArray(roomsResponse.data.data) ? roomsResponse.data.data : []);
    } catch (error) {
      console.error('Error fetching hotel detail:', error);
      setLoadError('Không thể tải thông tin khách sạn. Vui lòng quay lại và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isValidRange = checkIn >= getLocalDate() && checkOut > checkIn;
    if (!isValidRange) {
      setDateError(checkIn < getLocalDate() ? 'Ngày nhận phòng không thể ở trong quá khứ.' : 'Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    setDateError('');
    fetchHotelData();
  }, [hotelId, checkIn, checkOut]);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socket.on('connect', () => socket.emit('join_room_channel', hotelId));
    const refreshAvailability = async () => {
      try {
        const response = await api.get(`/hotels/${hotelId}/rooms`, { params: { check_in: checkIn, check_out: checkOut } });
        setRooms(Array.isArray(response.data.data) ? response.data.data : []);
      } catch {
        // The booking endpoint will revalidate inventory if the live update is interrupted.
      }
    };
    socket.on('room_held', refreshAvailability);
    socket.on('room_booked', refreshAvailability);
    return () => socket.disconnect();
  }, [hotelId, checkIn, checkOut]);

  const handleHoldRoomAction = async (room, selectedQuantity = 1) => {
    if (checkIn < getLocalDate() || checkOut <= checkIn) {
      setDateError(checkIn < getLocalDate() ? 'Ngày nhận phòng không thể ở trong quá khứ.' : 'Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    setHoldingRoomId(room.id);
    const result = await holdRoom({
      room_id: room.id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      quantity: selectedQuantity,
      hotel,
      room,
    });
    setHoldingRoomId(null);
    setSelectedDetailRoom(null);
    if (result.success) onProceedBooking();
    else alert(result.message || 'Không thể khóa giữ phòng.');
  };

  const openLightbox = (images, initialIndex = 0, title = '') => {
    setLightboxData({ images, initialIndex, title: title || hotel?.name || 'Bộ sưu tập hình ảnh' });
  };

  const allGalleryImages = useMemo(() => {
    if (!hotel) return [];
    return [hotel.cover_image, ...(hotel.gallery_images || [])].filter((image, index, images) => image && images.indexOf(image) === index);
  }, [hotel]);

  if (loading) {
    return <div className="detail-loading" aria-label="Đang tải thông tin khách sạn"><div className="detail-loading__title" /><div className="detail-loading__gallery" /><div className="detail-loading__row"><span /><span /></div></div>;
  }

  if (!hotel) {
    return (
      <div className="hotel-empty detail-error" role="alert">
        <span className="hotel-empty__icon"><Compass /></span>
        <h2>Chưa thể mở khách sạn này</h2>
        <p>{loadError || 'Dữ liệu khách sạn hiện không khả dụng.'}</p>
        <button type="button" onClick={onBack} className="btn-secondary"><ArrowLeft /> Quay lại danh sách</button>
      </div>
    );
  }

  const gallery = allGalleryImages.length ? allGalleryImages : ['/images/dibaoxa-coastal-resort.webp'];
  const highlights = (hotel.highlights?.length ? hotel.highlights : hotel.amenities || []).slice(0, 8);
  const highlightBullets = hotel.highlight_bullets?.length ? hotel.highlight_bullets : [
    'Vị trí thuận tiện để khám phá điểm đến và các khu vực lân cận.',
    'Đội ngũ hỗ trợ trực tuyến trong suốt kỳ nghỉ.',
    'Giá và tình trạng phòng được cập nhật theo thời gian thực.',
  ];
  const totalRoomsCount = hotel.total_rooms_count || rooms.reduce((sum, room) => sum + Number(room.total_rooms || 0), 0);
  const validPrices = rooms.map((room) => Number(room.price_per_night || 0)).filter((price) => price > 0);
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;
  const rating = Number(hotel.avg_rating || hotel.star_rating || hotel.starRating || 5);
  const mapQuery = encodeURIComponent(`${hotel.name}, ${hotel.address || hotel.city || hotel.destination}, Việt Nam`);

  return (
    <div className="product-detail product-detail--hotel">
      <nav className="product-detail__breadcrumbs" aria-label="Đường dẫn">
        <button type="button" onClick={onBack}><ArrowLeft /> Tìm khách sạn</button>
        <ChevronRight />
        <span>{hotel.city || hotel.destination}</span>
        <ChevronRight />
        <strong>{hotel.name}</strong>
      </nav>

      <header className="product-detail__heading">
        <div>
          <div className="product-detail__eyebrow"><Bed /> Khách sạn {hotel.star_rating || hotel.starRating || 5} sao</div>
          <h1>{hotel.name}</h1>
          <p><Star /> {rating.toFixed(1)} · {hotel.review_count || 0} đánh giá · <MapPin /> {hotel.address}</p>
        </div>
        <div className="product-detail__headline-price">
          <span>Giá từ</span>
          <strong>{minPrice ? formatMoney(minPrice) : 'Liên hệ'}</strong>
          <small>/ phòng / đêm</small>
        </div>
      </header>

      <section className="product-gallery" aria-label="Thư viện ảnh khách sạn">
        <button type="button" className="product-gallery__peek" onClick={() => openLightbox(gallery, gallery.length - 1, hotel.name)} aria-label="Mở ảnh trước">
          <img src={gallery[gallery.length - 1]} alt="" />
          <span><Eye /></span>
        </button>
        <button type="button" className="product-gallery__main" onClick={() => openLightbox(gallery, 0, hotel.name)}>
          <img src={gallery[0]} alt={hotel.name} />
          <span><Maximize2 /> Xem tất cả {gallery.length} ảnh</span>
        </button>
        <button type="button" className="product-gallery__peek" onClick={() => openLightbox(gallery, Math.min(1, gallery.length - 1), hotel.name)} aria-label="Mở ảnh tiếp theo">
          <img src={gallery[Math.min(1, gallery.length - 1)]} alt="" />
          <span><Eye /></span>
        </button>
        <button type="button" className="product-gallery__tour" onClick={() => setSelected360Room(rooms[0] || { name: hotel.name, area_sqm: 70, bed_type: 'Giường King' })}><Eye /> Xem không gian phòng</button>
      </section>

      <div className="product-detail__body">
        <section className="product-section">
          <h2>Đặc điểm nổi bật</h2>
          <div className="product-overview">
            <div>
              <div className="product-feature-grid">
                {highlights.length ? highlights.map((item) => <div key={item}><Check /><span>{item}</span></div>) : <div><Check /><span>Tiện nghi đang được cập nhật</span></div>}
              </div>
              <ul className="product-check-list">{highlightBullets.map((item) => <li key={item}><Check /> {item}</li>)}</ul>
            </div>
            <aside className="product-info-card">
              <h3>Thông tin khách sạn</h3>
              <dl>
                <div><dt>Hạng</dt><dd>{hotel.star_rating || hotel.starRating || 5} sao</dd></div>
                <div><dt>Số phòng</dt><dd>{totalRoomsCount || 'Đang cập nhật'}</dd></div>
                <div><dt>Khu vực</dt><dd>{hotel.city || hotel.destination}</dd></div>
                <div><dt>Nhận phòng</dt><dd>14:00</dd></div>
                <div><dt>Điều hành</dt><dd>{hotel.operator_company || 'Dibaoxa Partner'}</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section id="hotel-rooms" className="product-section">
          <div className="product-section__heading"><div><h2>Các loại phòng &amp; giá</h2><p>Giá và số phòng trống được kiểm tra theo ngày bạn chọn.</p></div><span className="product-live-badge"><ShieldCheck /> Giữ phòng 10 phút</span></div>
          <div className="product-room-panel">
            <div className="product-room-toolbar">
              <label><span>Nhận phòng</span><input type="date" min={getLocalDate()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
              <label><span>Trả phòng</span><input type="date" min={checkIn || getLocalDate()} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
              {dateError && <p className="form-error" role="alert">{dateError}</p>}
            </div>
            <div className="product-room-list">
              {rooms.map((room) => {
                const isAvailable = Number(room.available_count ?? 0) > 0;
                const roomImages = room.images?.length ? room.images : [hotel.cover_image || gallery[0]];
                return (
                  <article key={room.id}>
                    <button type="button" className="product-room-list__image" onClick={() => openLightbox(roomImages, 0, room.name)} aria-label={`Xem ảnh ${room.name}`}><img src={roomImages[0]} alt={room.name} loading="lazy" /></button>
                    <div className="product-room-list__copy">
                      <h3>{room.name}</h3>
                      <p><Maximize2 /> {room.area_sqm || 32} m² <Users /> Tối đa {room.max_occupancy || 2} khách <Bed /> {room.bed_type || 'Queen/Twin'}</p>
                      <small>{(room.room_services || []).slice(0, 3).join(' · ') || room.view_type || 'Tiện nghi tiêu chuẩn'}</small>
                      <span className={isAvailable ? 'availability is-available' : 'availability is-sold-out'}>{isAvailable ? `Còn ${room.available_count} phòng` : 'Hết phòng ngày đã chọn'}</span>
                    </div>
                    <div className="product-room-list__price"><strong>{formatMoney(room.price_per_night)}</strong><span>/ đêm</span></div>
                    <button type="button" className="btn-primary product-room-list__action" onClick={() => setSelectedDetailRoom(room)} disabled={!isAvailable || holdingRoomId === room.id}><Lock /> {holdingRoomId === room.id ? 'Đang giữ...' : 'Chọn phòng'}</button>
                  </article>
                );
              })}
              {!rooms.length && <div className="product-room-empty">Chưa có phòng phù hợp trong khoảng ngày đã chọn.</div>}
            </div>
          </div>
        </section>

        <section className="product-section product-article">
          <h2>Giới thiệu</h2>
          <h3>Về {hotel.name}</h3>
          <p>{hotel.description || `${hotel.name} mang đến không gian nghỉ dưỡng tiện nghi, vị trí thuận tiện và dịch vụ phù hợp cho cả chuyến đi ngắn ngày lẫn kỳ nghỉ dài.`}</p>
          <img src={gallery[Math.min(1, gallery.length - 1)]} alt={`Không gian tại ${hotel.name}`} loading="lazy" />
          <p>Từ khách sạn, du khách có thể dễ dàng lên kế hoạch khám phá ẩm thực, cảnh quan và những trải nghiệm nổi bật tại {hotel.city || hotel.destination}. Phòng nghỉ được chuẩn bị đầy đủ tiện nghi thiết yếu và thông tin đặt phòng luôn được xác nhận trước khi thanh toán.</p>
          {gallery[2] && <img src={gallery[2]} alt={`Tiện nghi tại ${hotel.name}`} loading="lazy" />}
        </section>

        <section className="product-section">
          <h2>Quy định chung và lưu ý</h2>
          <div className="product-accordions">
            {(hotel.policies?.length ? hotel.policies : ['Nhận phòng từ 14:00 và trả phòng trước 12:00. Nhận sớm hoặc trả muộn phụ thuộc tình trạng phòng.', 'Phụ thu trẻ em và giường phụ được tính theo độ tuổi, số khách và loại phòng.', 'Điều kiện hoàn hủy áp dụng theo từng loại giá.']).map((policy, index) => <details key={policy} open={index === 0}><summary>{index === 0 ? 'Thời gian nhận và trả phòng' : `Chính sách ${index + 1}`}</summary><p>{policy}</p></details>)}
          </div>
        </section>

        <section className="product-section">
          <h2>Câu hỏi thường gặp</h2>
          <div className="product-accordions">
            {(hotel.faqs?.length ? hotel.faqs : [{ question: 'Giá phòng đã bao gồm thuế và phí chưa?', answer: 'Chi tiết thuế, phí và dịch vụ đi kèm được hiển thị trong bước xác nhận trước thanh toán.' }, { question: 'Tôi có thể đặt nhiều phòng không?', answer: 'Có. Mở loại phòng bạn muốn, chọn số lượng còn trống rồi tiếp tục giữ phòng.' }]).map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          </div>
        </section>

        <section className="product-section">
          <h2>Bản đồ và vị trí</h2>
          <div className="product-map"><iframe title={`Bản đồ ${hotel.name}`} src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
          <p className="product-map__address"><MapPin /> {hotel.address || `${hotel.city || hotel.destination}, Việt Nam`}</p>
        </section>

        <section className="product-section">
          <div className="product-section__heading"><div><h2>Đánh giá ({hotel.review_count || 0})</h2><p>Nhận xét từ khách đã lưu trú.</p></div></div>
          <div className="product-review-summary"><strong>{hotel.review_count > 0 ? rating.toFixed(1) : 'Mới'}</strong><div><span>{hotel.review_count > 0 ? 'Tuyệt hảo' : 'Chưa có điểm'}</span><small>{hotel.review_count || 0} đánh giá đã xác thực</small></div><div className="product-review-summary__bars"><span><i style={{ width: `${Math.min(100, rating * 20)}%` }} /></span><span><i style={{ width: `${Math.min(96, rating * 18)}%` }} /></span><span><i style={{ width: `${Math.min(98, rating * 19)}%` }} /></span></div></div>
          {hotel.reviews?.length ? <div className="product-review-list">{hotel.reviews.map((review) => <article key={review.id}><div><span>{(review.user?.full_name || 'K').charAt(0)}</span><div><strong>{review.user?.full_name || 'Khách hàng'}</strong><small>{new Date(review.created_at || Date.now()).toLocaleDateString('vi-VN')}</small></div><b><Star /> {Number(review.rating || 5).toFixed(1)}</b></div><p>{review.comment}</p></article>)}</div> : <div className="product-room-empty">Chưa có đánh giá nào. Khách đã hoàn tất lưu trú có thể gửi nhận xét đầu tiên.</div>}
        </section>
      </div>

      {selected360Room && <Room360Modal room={selected360Room} onClose={() => setSelected360Room(null)} />}
      {selectedDetailRoom && <RoomDetailModal room={selectedDetailRoom} hotel={hotel} checkIn={checkIn} checkOut={checkOut} onClose={() => setSelectedDetailRoom(null)} onConfirmBooking={(room, quantity) => handleHoldRoomAction(room, quantity)} />}
      {lightboxData && <ImageLightboxModal images={lightboxData.images} initialIndex={lightboxData.initialIndex} title={lightboxData.title} onClose={() => setLightboxData(null)} />}
    </div>
  );
}
