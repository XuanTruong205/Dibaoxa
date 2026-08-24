import { Clock3, Mail, MessageSquareText, Phone } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { useNotificationStore } from '../../../store/useNotificationStore';

const STATUS_LABELS = { new: 'Mới', in_progress: 'Đang xử lý', resolved: 'Đã hoàn tất' };
const SERVICE_LABELS = { cruise: 'Du thuyền', hotel: 'Khách sạn', flight: 'Vé máy bay', corporate: 'Doanh nghiệp', other: 'Khác' };

export default function AdminContactInquiriesView() {
  const { contactInquiries, updateContactInquiryStatus } = useAdminStore();
  const notifySuccess = useNotificationStore((state) => state.success);
  const notifyError = useNotificationStore((state) => state.error);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');
  const visibleItems = useMemo(() => filter === 'all' ? contactInquiries : contactInquiries.filter((item) => item.status === filter), [contactInquiries, filter]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateContactInquiryStatus(id, status);
      notifySuccess('Đã cập nhật yêu cầu', `Trạng thái đã chuyển thành ${STATUS_LABELS[status].toLocaleLowerCase('vi')}.`);
    } catch (error) {
      notifyError('Không thể cập nhật yêu cầu', error.message || 'Vui lòng thử lại.');
    } finally { setUpdatingId(''); }
  };

  return (
    <section className="admin-contact-view">
      <header className="admin-view-heading"><div><p className="admin-kicker">Hỗ trợ khách hàng</p><h1>Yêu Cầu Liên Hệ</h1><p>Tiếp nhận và theo dõi yêu cầu gửi từ website.</p></div><select aria-label="Lọc trạng thái" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></header>
      <div className="admin-contact-summary"><article><strong>{contactInquiries.length}</strong><span>Tổng yêu cầu</span></article><article><strong>{contactInquiries.filter((item) => item.status === 'new').length}</strong><span>Chưa tiếp nhận</span></article><article><strong>{contactInquiries.filter((item) => item.status === 'in_progress').length}</strong><span>Đang xử lý</span></article><article><strong>{contactInquiries.filter((item) => item.status === 'resolved').length}</strong><span>Đã hoàn tất</span></article></div>
      {visibleItems.length === 0 ? <div className="admin-empty-state"><MessageSquareText /><h2>Không có yêu cầu phù hợp</h2><p>Yêu cầu mới từ form liên hệ sẽ xuất hiện tại đây.</p></div> : <div className="admin-contact-list">{visibleItems.map((item) => <article key={item.id} className={`admin-contact-card status-${item.status}`}><div className="admin-contact-card__head"><div><span>{SERVICE_LABELS[item.service] || item.service}</span><h2>{item.name}</h2></div><select disabled={updatingId === item.id} value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} aria-label={`Trạng thái yêu cầu của ${item.name}`}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><p>{item.message}</p><footer><a href={`mailto:${item.email}`}><Mail />{item.email}</a><a href={`tel:${item.phone}`}><Phone />{item.phone}</a><span><Clock3 />{new Date(item.created_at).toLocaleString('vi-VN')}</span></footer></article>)}</div>}
    </section>
  );
}
