import React from 'react';

const sections = [
  ['Dữ liệu chúng tôi thu thập', 'Dibaoxa chỉ thu thập thông tin cần thiết để tạo tài khoản, xử lý đơn, hỗ trợ khách hàng và bảo vệ giao dịch. Dữ liệu có thể gồm họ tên, email, số điện thoại, thông tin hành trình và lịch sử giao dịch.'],
  ['Cách dữ liệu được sử dụng', 'Thông tin được dùng để cung cấp dịch vụ bạn yêu cầu, gửi cập nhật đơn hàng, phòng chống gian lận, cải thiện sản phẩm và thực hiện nghĩa vụ pháp lý.'],
  ['Chia sẻ dữ liệu', 'Thông tin chỉ được chia sẻ với nhà cung cấp dịch vụ liên quan đến đơn của bạn, đối tác thanh toán và cơ quan có thẩm quyền khi pháp luật yêu cầu.'],
  ['Lưu trữ và bảo vệ', 'Dibaoxa áp dụng kiểm soát truy cập, mã hóa khi truyền và các biện pháp kỹ thuật phù hợp. Dữ liệu được giữ trong thời gian cần thiết cho mục đích vận hành và pháp lý.'],
  ['Quyền của bạn', 'Bạn có thể yêu cầu xem, sửa hoặc xóa dữ liệu trong phạm vi pháp luật cho phép bằng cách liên hệ support@dibaoxa.vn.'],
];

export default function PrivacyPolicyPage({ onNavigate }) {
  return (
    <div className="legal-page">
      <nav className="simple-breadcrumb" aria-label="Đường dẫn"><button type="button" onClick={() => onNavigate('home')}>Trang chủ</button><span>/</span><span>Chính sách bảo mật</span></nav>
      <header><p className="eyebrow">Quyền riêng tư</p><h1>Chính sách bảo mật dữ liệu</h1><p>Cập nhật ngày 24/08/2026. Nội dung này mô tả cách Dibaoxa xử lý dữ liệu trên website.</p></header>
      <div className="legal-page__content">
        {sections.map(([title, content]) => <section key={title}><h2>{title}</h2><p>{content}</p></section>)}
        <section><h2>Liên hệ về dữ liệu</h2><p>Email: <a href="mailto:support@dibaoxa.vn">support@dibaoxa.vn</a>. Hotline: <a href="tel:19008899">1900 8899</a>.</p></section>
      </div>
    </div>
  );
}
