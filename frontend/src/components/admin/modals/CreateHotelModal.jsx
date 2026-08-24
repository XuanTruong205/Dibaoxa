import {
  Bed,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleHelp,
  Copy,
  Eye,
  Image as ImageIcon,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  Star,
  Trash2,
  Users,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminStore } from '../../../store/useAdminStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import AmenityPicker from './AmenityPicker';

export default function CreateHotelModal({ isOpen, onClose, onSuccess }) {
  const { addHotel } = useAdminStore();
  const notifyError = useNotificationStore((state) => state.error);

  // 1. General Info & Cover
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('Đà Nẵng');
  const [address, setAddress] = useState('');
  const [starRating, setStarRating] = useState('5');
  const [coverImage, setCoverImage] = useState('');

  // 2. Hotel Operator Info & Highlights (Starts 100% Empty)
  const [totalRoomsCount, setTotalRoomsCount] = useState('');
  const [operatorCompany, setOperatorCompany] = useState('');
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [highlightBulletsInput, setHighlightBulletsInput] = useState('');

  // 3. Rich Introduction & Gallery Photos
  const [description, setDescription] = useState('');
  const [galleryImages, setGalleryImages] = useState(['']);
  const [policiesInput, setPoliciesInput] = useState('');
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  // 4. Multiple Rooms Creator with Room Services (Starts 100% Empty)
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

  if (!isOpen) return null;

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

  const roomTemplates = [
    { label: 'Superior', name: 'Superior City View', area_sqm: 28, view_type: 'City view', max_occupancy: 2, price_per_night: 1500000, room_services: ['Điều hòa', 'Tivi'] },
    { label: 'Deluxe', name: 'Deluxe Ocean View', area_sqm: 36, view_type: 'Ocean view', max_occupancy: 2, price_per_night: 2400000, room_services: ['Điều hòa', 'Minibar', 'Áo khoác tắm'] },
    { label: 'Family Suite', name: 'Family Suite', area_sqm: 56, view_type: 'Garden view', max_occupancy: 4, price_per_night: 3800000, room_services: ['Điều hòa', 'Tivi', 'Két an toàn'] },
  ];

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

  const handleAddRoomTemplate = (template) => {
    const nextRoom = { id: Date.now() + Math.random(), images: [''], ...template };
    const firstRoomIsEmpty = rooms.length === 1 && !rooms[0].name && !rooms[0].price_per_night;
    setRooms(firstRoomIsEmpty ? [nextRoom] : [...rooms, nextRoom]);
  };

  const handleDuplicateRoom = (room) => {
    setRooms([...rooms, { ...room, id: Date.now() + Math.random(), name: `${room.name || 'Loại phòng'} bản sao`, images: [...(room.images || [''])], room_services: [...(room.room_services || [])] }]);
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
      notifyError('Thiếu loại phòng', 'Khách sạn phải có ít nhất một loại phòng.');
      return;
    }
    setRooms(rooms.filter((_, i) => i !== roomIndex));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanGallery = galleryImages.filter(Boolean);
    const bulletsList = highlightBulletsInput.split('\n').map((b) => b.trim()).filter(Boolean);

    const defaultCover = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

    const roomInventory = Math.max(1, Math.floor((Number(totalRoomsCount) || rooms.length) / rooms.length));
    const cleanRooms = rooms.map((r, i) => ({
      name: r.name || `Phòng ${i + 1}`,
      room_type: 'Deluxe',
      area_sqm: Number(r.area_sqm) || 32,
      view_type: r.view_type || 'Ocean view',
      max_occupancy: Number(r.max_occupancy) || 2,
      price_per_night: Number(r.price_per_night) || 2000000,
      bed_type: '1 giường đôi',
      total_rooms: roomInventory,
      is_available: true,
      images: r.images.filter(Boolean).length > 0 ? r.images.filter(Boolean) : [coverImage || defaultCover],
      room_services: r.room_services || [],
    }));

    try {
      const created = await addHotel({
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
      services: [],
    });

      // Reset after the server accepts the hotel.
    setName('');
    setAddress('');
    setCoverImage('');
    setDescription('');
    setTotalRoomsCount('');
    setOperatorCompany('');
    setHighlightBulletsInput('');
    setSelectedHighlights([]);
    setGalleryImages(['']);
    setPoliciesInput('');
    setFaqs([{ question: '', answer: '' }]);
    setRooms([
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

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (error) {
      notifyError('Không thể thêm khách sạn', error.message || 'Vui lòng kiểm tra dữ liệu và thử lại.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md font-sans">
      <div className="bg-white max-w-3xl w-full rounded-3xl border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* STICKY HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Khởi Tạo Khách Sạn & Loại Phòng</h2>
              <p className="text-xs text-slate-500 font-medium">Nhập thông tin giới thiệu, đặc điểm nổi bật và tạo các loại phòng lưu trú</p>
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
            
            {/* Section 1: Thông tin tổng quan */}
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
                  placeholder="Nhập tên khách sạn..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                  placeholder="Nhập địa chỉ chi tiết..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Thông tin điều hành & Số phòng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số phòng (Tổng số lượng phòng) *</label>
                  <input
                    type="number"
                    value={totalRoomsCount}
                    onChange={(e) => setTotalRoomsCount(e.target.value)}
                    placeholder="VD: 188"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Điều hành (Công ty quản lý) *</label>
                  <input
                    type="text"
                    value={operatorCompany}
                    onChange={(e) => setOperatorCompany(e.target.value)}
                    placeholder="Nhập tên đơn vị điều hành hoặc công ty quản lý..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                  placeholder="Dán URL hình ảnh đại diện (https://...)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                  placeholder="Nhập các dòng nổi bật giới thiệu bãi biển, bể bơi, quy mô phòng..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                  placeholder="Nhập bài viết chi tiết giới thiệu vị trí, không gian kiến trúc, tầm nhìn và tiện ích nổi bật..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                    <Plus className="w-3.5 h-3.5" /> Thêm Link Ảnh Giới Thiệu
                  </button>
                </div>

                <div className="space-y-2">
                  {galleryImages.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUpdateGalleryImage(idx, e.target.value)}
                        placeholder={`URL Ảnh giới thiệu #${idx + 1}...`}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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

            {/* Section 4: Danh Sách Loại Phòng & Dịch Vụ Phòng */}
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

              <div className="grid gap-2 sm:grid-cols-3">
                {roomTemplates.map((template) => (
                  <button key={template.label} type="button" onClick={() => handleAddRoomTemplate(template)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]">
                    Dùng mẫu {template.label}
                    <small className="mt-1 block font-medium text-slate-400">{template.area_sqm} m², {Number(template.price_per_night).toLocaleString('vi-VN')} đ</small>
                  </button>
                ))}
              </div>

              {/* Dynamic Rooms Array */}
              <div className="space-y-5">
                {rooms.map((room, roomIdx) => (
                  <div key={room.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        Loại Phòng #{roomIdx + 1}: {room.name || 'Chưa đặt tên'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleDuplicateRoom(room)} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"><Copy className="h-3.5 w-3.5" /> Nhân bản</button>
                        {rooms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRoom(roomIdx)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Room Name & Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên loại phòng *</label>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'name', e.target.value)}
                          placeholder="VD: Superior City View, Deluxe Ocean View..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Giá phòng / đêm (VNĐ) *</label>
                        <input
                          type="number"
                          value={room.price_per_night}
                          onChange={(e) => handleUpdateRoomField(roomIdx, 'price_per_night', e.target.value)}
                          placeholder="VD: 2500000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                          placeholder="VD: 32"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
                          placeholder="VD: 2 người"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

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
                              placeholder={`URL Hình ảnh phòng #${imgIdx + 1}...`}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><CircleHelp className="w-4 h-4" /> 5. CHÍNH SÁCH & CÂU HỎI THƯỜNG GẶP</span>
              <label className="admin-field"><span>Quy định và chính sách, mỗi dòng một mục</span><textarea rows={5} value={policiesInput} onChange={(event) => setPoliciesInput(event.target.value)} /></label>
              <div className="flex items-center justify-between"><strong className="text-xs text-slate-700">FAQ hiển thị trên trang chi tiết</strong><button type="button" onClick={() => setFaqs((current) => [...current, { question: '', answer: '' }])} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Thêm câu hỏi</button></div>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                    <label className="admin-field"><span>Câu hỏi</span><input value={faq.question} onChange={(event) => setFaqs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} /></label>
                    <label className="admin-field"><span>Câu trả lời</span><textarea rows={2} value={faq.answer} onChange={(event) => setFaqs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} /></label>
                    <button type="button" onClick={() => setFaqs((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="self-end rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Xóa câu hỏi"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
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
