import {
  Bed,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleHelp,
  Edit,
  Image as ImageIcon,
  MapPin,
  Plus,
  Star,
  Trash2,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminStore } from '../../../store/useAdminStore';
import AmenityPicker from './AmenityPicker';

export default function EditHotelModal({ isOpen, onClose, hotelToEdit, onSuccess }) {
  const { updateHotel } = useAdminStore();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('Đà Nẵng');
  const [address, setAddress] = useState('');
  const [starRating, setStarRating] = useState('5');
  const [coverImage, setCoverImage] = useState('');

  const [totalRoomsCount, setTotalRoomsCount] = useState('188');
  const [operatorCompany, setOperatorCompany] = useState('');
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [highlightBulletsInput, setHighlightBulletsInput] = useState('');

  const [description, setDescription] = useState('');
  const [galleryImages, setGalleryImages] = useState(['']);
  const [policiesInput, setPoliciesInput] = useState('');
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  const [rooms, setRooms] = useState([
    {
      id: 1,
      name: '',
      area_sqm: '',
      view_type: 'Ocean view',
      max_occupancy: '',
      price_per_night: '',
      images: [''],
      room_services: [],
    },
  ]);

  const defaultHighlightOptions = [
    'Lễ tân 24h',
    'Bể bơi ngoài trời',
    'Ban công/Cửa sổ',
    'Wifi miễn phí',
    'Nhà hàng',
    'Bãi biển riêng',
    'Spa & Massage',
    'Đưa đón sân bay',
  ];

  const defaultRoomServiceOptions = [
    'Điều hòa',
    'Bồn tắm/Cabin tắm đứng',
    'Máy sấy tóc',
    'Minibar',
    'Tivi',
    'Bàn làm việc',
    'Nước đóng chai miễn phí',
    'Két an toàn',
    'Áo khoác tắm',
  ];

  useEffect(() => {
    if (hotelToEdit) {
      setName(hotelToEdit.name || '');
      setDestination(hotelToEdit.destination || hotelToEdit.city || 'Đà Nẵng');
      setAddress(hotelToEdit.address || '');
      setStarRating(String(hotelToEdit.star_rating || hotelToEdit.starRating || 5));
      setCoverImage(hotelToEdit.cover_image || '');
      setDescription(hotelToEdit.description || '');
      setTotalRoomsCount(String(hotelToEdit.total_rooms_count || 188));
      setOperatorCompany(hotelToEdit.operator_company || '');

      setSelectedHighlights(hotelToEdit.highlights || []);
      setHighlightBulletsInput(
        hotelToEdit.highlight_bullets ? hotelToEdit.highlight_bullets.join('\n') : ''
      );

      setGalleryImages(hotelToEdit.gallery_images && hotelToEdit.gallery_images.length > 0 ? hotelToEdit.gallery_images : ['']);
      setPoliciesInput((hotelToEdit.policies || []).join('\n'));
      setFaqs(hotelToEdit.faqs?.length ? hotelToEdit.faqs : [{ question: '', answer: '' }]);

      if (hotelToEdit.rooms && hotelToEdit.rooms.length > 0) {
        setRooms(
          hotelToEdit.rooms.map((r, i) => ({
            id: r.id || Date.now() + i,
            name: r.name || '',
            room_type: r.room_type || 'Deluxe',
            area_sqm: r.area_sqm || 32,
            view_type: r.view_type || 'Ocean view',
            max_occupancy: r.max_occupancy || 2,
            price_per_night: r.price_per_night || r.price || 1500000,
            bed_type: r.bed_type || '1 giường đôi',
            total_rooms: r.total_rooms || 10,
            is_available: r.is_available !== false,
            images: r.images && r.images.length > 0 ? r.images : [''],
            room_services: r.room_services || [],
          }))
        );
      }
    }
  }, [hotelToEdit]);

  if (!isOpen || !hotelToEdit) return null;

  // Gallery Handlers
  const handleAddGalleryImage = () => {
    setGalleryImages([...galleryImages, '']);
  };

  const handleUpdateGalleryImage = (index, value) => {
    const updated = [...galleryImages];
    updated[index] = value;
    setGalleryImages(updated);
  };

  const handleRemoveGalleryImage = (index) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  // Rooms Handlers
  const handleAddRoom = () => {
    setRooms([
      ...rooms,
      {
        id: Date.now() + Math.random(),
        name: '',
        area_sqm: '',
        view_type: 'Ocean view',
        max_occupancy: '',
        price_per_night: '',
        images: [''],
        room_services: [],
      },
    ]);
  };

  const handleUpdateRoomField = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };

  const handleAddRoomImage = (roomIndex) => {
    const updated = [...rooms];
    updated[roomIndex].images.push('');
    setRooms(updated);
  };

  const handleUpdateRoomImage = (roomIndex, imgIndex, value) => {
    const updated = [...rooms];
    updated[roomIndex].images[imgIndex] = value;
    setRooms(updated);
  };

  const handleRemoveRoomImage = (roomIndex, imgIndex) => {
    const updated = [...rooms];
    updated[roomIndex].images = updated[roomIndex].images.filter((_, i) => i !== imgIndex);
    setRooms(updated);
  };

  const handleRemoveRoom = (roomIndex) => {
    if (rooms.length === 1) {
      alert('Khách sạn phải có ít nhất 1 loại phòng!');
      return;
    }
    setRooms(rooms.filter((_, i) => i !== roomIndex));
  };

  const updateFaq = (index, field, value) => setFaqs((current) => current.map((faq, faqIndex) => (
    faqIndex === index ? { ...faq, [field]: value } : faq
  )));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanGallery = galleryImages.filter(Boolean);
    const bulletsList = highlightBulletsInput.split('\n').map((b) => b.trim()).filter(Boolean);
    const defaultCover = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

    const roomInventory = Math.max(1, Math.floor((Number(totalRoomsCount) || rooms.length) / rooms.length));
    const cleanRooms = rooms.map((r, i) => ({
      ...(typeof r.id === 'string' && r.id.trim()
        ? { id: r.id.trim().slice(0, 120) }
        : {}),
      name: r.name || `Phòng ${i + 1}`,
      room_type: r.room_type || 'Deluxe',
      area_sqm: Number(r.area_sqm) || 32,
      view_type: r.view_type || 'Ocean view',
      max_occupancy: Number(r.max_occupancy) || 2,
      price_per_night: Number(r.price_per_night) || 2000000,
      bed_type: r.bed_type || '1 giường đôi',
      total_rooms: Number(r.total_rooms) || roomInventory,
      is_available: r.is_available !== false,
      images: r.images.filter(Boolean).length > 0 ? r.images.filter(Boolean) : [coverImage || defaultCover],
      room_services: r.room_services || [],
    }));

    try {
      await updateHotel(hotelToEdit.id, {
      name,
      city: destination,
      address,
      star_rating: Number(starRating),
      operator_company: operatorCompany || 'Công ty TNHH Dịch vụ & Khách Sạn Dibaoxa',
      cover_image: coverImage || defaultCover,
      gallery_images: cleanGallery.length > 0 ? cleanGallery : [coverImage || defaultCover],
      description,
      amenities: selectedHighlights,
      highlights: selectedHighlights,
      highlight_bullets: bulletsList,
      policies: policiesInput.split('\n').map((item) => item.trim()).filter(Boolean),
      faqs: faqs.map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })).filter((faq) => faq.question && faq.answer),
      rooms: cleanRooms,
      services: (hotelToEdit.services || []).map((service) => ({
        ...(service.id ? { id: service.id } : {}),
        name: service.name,
        price: Number(service.price) || 0,
        description: service.description || service.name,
      })),
    });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert(error.message || 'Không thể cập nhật khách sạn.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md font-sans">
      <div className="bg-white max-w-3xl w-full rounded-3xl border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* STICKY HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Chỉnh Sửa Khách Sạn & Loại Phòng</h2>
              <p className="text-xs text-slate-500 font-medium">Tùy chỉnh thông tin điều hành, đặc điểm nổi bật & danh sách dịch vụ phòng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE INNER BODY */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Section 1: Thông tin chung */}
            <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                1. THÔNG TIN KHÁCH SẠN & ĐƠN VỊ ĐIỀU HÀNH
              </span>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Khách Sạn / Resort *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Điểm Đến / Thành Phố</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Phú Quốc">Phú Quốc</option>
                    <option value="Đà Lạt">Đà Lạt</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Nha Trang">Nha Trang</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hạng Sao</label>
                  <select
                    value={starRating}
                    onChange={(e) => setStarRating(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="5">5 Sao (Luxury)</option>
                    <option value="4">4 Sao (Premium)</option>
                    <option value="3">3 Sao (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Thông tin điều hành & Số phòng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số phòng (Tổng số phòng) *</label>
                  <input
                    type="number"
                    value={totalRoomsCount}
                    onChange={(e) => setTotalRoomsCount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Điều hành (Công ty quản lý) *</label>
                  <input
                    type="text"
                    value={operatorCompany}
                    onChange={(e) => setOperatorCompany(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Ảnh Bìa */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Đường dẫn Ảnh Bìa Khách Sạn (Cover Image)</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section 2: Đặc điểm nổi bật */}
            <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
                <Star className="w-4 h-4 text-blue-600" />
                2. ĐẶC ĐIỂM NỔI BẬT KHÁCH SẠN
              </span>

              <AmenityPicker
                label="Tùy chọn các tiện ích nổi bật"
                options={defaultHighlightOptions}
                value={selectedHighlights}
                onChange={setSelectedHighlights}
                customLabel="Tiện ích khách sạn chưa có trong danh sách"
                placeholder="Ví dụ: Phòng gym, khu vui chơi trẻ em"
              />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Các dòng ghi chú nổi bật (Mỗi dòng 1 ý):</label>
                <textarea
                  rows={3}
                  value={highlightBulletsInput}
                  onChange={(e) => setHighlightBulletsInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section 3: Bài viết giới thiệu & Album Gallery */}
            <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                3. GIỚI THIỆU KHÁCH SẠN & ALBUM ÁNH GALLERY
              </span>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung văn bản giới thiệu *</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Gallery Images List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Album Hình Ảnh Giới Thiệu (Gallery Images)</label>
                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Link Ảnh
                  </button>
                </div>

                <div className="space-y-2">
                  {galleryImages.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUpdateGalleryImage(idx, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      {galleryImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Thêm & Chỉnh Sửa Các Loại Phòng */}
            <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-blue-600" />
                  4. DANH SÁCH CÁC LOẠI PHÒNG & DỊCH VỤ PHÒNG ({rooms.length} PHÒNG)
                </span>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> + Thêm Loại Phòng Mới
                </button>
              </div>

              {/* Dynamic Rooms Array */}
              <div className="space-y-5">
                {rooms.map((room, roomIdx) => (
                  <div key={room.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        Loại Phòng #{roomIdx + 1}: {room.name || 'Chưa đặt tên'}
                      </span>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(roomIdx)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa loại phòng này
                        </button>
                      )}
                    </div>

                    {/* Room Name & Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên loại phòng *</label>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'name', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Giá phòng / đêm (VNĐ) *</label>
                        <input
                          type="number"
                          value={room.price_per_night}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'price_per_night', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Area, View Type, Max Occupancy */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Diện tích phòng (m²) *</label>
                        <input
                          type="number"
                          value={room.area_sqm}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'area_sqm', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Hướng nhìn (View Type)</label>
                        <select
                          value={room.view_type}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'view_type', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="City view">City view (Hướng thành phố)</option>
                          <option value="Ocean view">Ocean view (Hướng biển)</option>
                          <option value="Garden view">Garden view (Hướng sân vườn)</option>
                          <option value="Lake view">Lake view (Hướng hồ)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Sức chứa tối đa (Người) *</label>
                        <input
                          type="number"
                          value={room.max_occupancy}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'max_occupancy', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span>
                        <strong className="block text-[11px] text-slate-700">Trạng thái mở bán</strong>
                        <small className="text-[10px] text-slate-500">Tắt mở bán nếu loại phòng đã có đơn và không thể xóa.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={room.is_available !== false}
                        onChange={(e) => handleUpdateRoomField(roomIdx, 'is_available', e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-blue-600"
                      />
                    </label>

                    {/* Dịch Vụ Có Sẵn Ở Phòng */}
                    <div className="border-t border-slate-100 pt-3">
                      <AmenityPicker
                        label="Dịch vụ và tiện nghi có sẵn ở phòng này"
                        options={defaultRoomServiceOptions}
                        value={room.room_services || []}
                        onChange={(nextServices) => handleUpdateRoomField(roomIdx, 'room_services', nextServices)}
                        customLabel="Tiện nghi phòng chưa có trong danh sách"
                        placeholder="Ví dụ: Máy pha cà phê, loa Bluetooth"
                        columns="sm:grid-cols-3"
                      />
                    </div>

                    {/* Multiple Room Images */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Hình ảnh phòng này ({room.images.length} ảnh)</label>
                        <button
                          type="button"
                          onClick={() => handleAddRoomImage(roomIdx)}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Thêm ảnh phòng
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {room.images.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="flex items-center gap-2">
                            <input
                              type="url"
                              value={imgUrl}
                              onChange={(e) => handleUpdateRoomImage(roomIdx, imgIdx, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                            {room.images.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRoomImage(roomIdx, imgIdx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>

          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <CircleHelp className="w-4 h-4" /> 5. CHÍNH SÁCH, FAQ & NỘI DUNG CHI TIẾT
            </span>
            <label className="admin-field">
              <span>Quy định và chính sách, mỗi dòng một mục</span>
              <textarea rows={5} value={policiesInput} onChange={(event) => setPoliciesInput(event.target.value)} placeholder="Thời gian nhận và trả phòng&#10;Chính sách trẻ em&#10;Điều kiện hoàn hủy" />
            </label>
            <div className="flex items-center justify-between">
              <strong className="text-xs text-slate-700">Câu hỏi thường gặp</strong>
              <button type="button" onClick={() => setFaqs((current) => [...current, { question: '', answer: '' }])} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Thêm câu hỏi</button>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                  <label className="admin-field"><span>Câu hỏi</span><input value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} /></label>
                  <label className="admin-field"><span>Câu trả lời</span><textarea rows={2} value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} /></label>
                  <button type="button" onClick={() => setFaqs((current) => current.filter((_, faqIndex) => faqIndex !== index))} className="self-end rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Xóa câu hỏi"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
              Bản đồ trên trang người dùng được tạo tự động từ địa chỉ khách sạn phía trên.
            </div>
          </div>

          </div>

          {/* STICKY FOOTER */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="btn-primary py-2.5 px-6 text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu Khách Sạn & Cập Nhật Hệ Thống
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}
