# Dibaoxa

Dibaoxa là ứng dụng đặt phòng khách sạn full-stack gồm React/Vite ở frontend và Express/Prisma ở backend. Dự án có dữ liệu demo hoàn chỉnh, phân quyền người dùng, luồng giữ phòng chống đặt trùng, thanh toán mô phỏng minh bạch và trang quản trị dùng chung một nguồn dữ liệu API.

## Chức năng chính

- Tìm khách sạn theo thành phố, ngày lưu trú, hạng sao, từ khóa và khoảng giá.
- Xem chi tiết khách sạn, phòng, dịch vụ, đánh giá và số phòng còn lại theo ngày.
- Giữ phòng 10 phút trước khi xác nhận; giá và dịch vụ được tính lại ở server.
- Vòng đời đơn: `pending_payment` -> `confirmed` -> `checked_in` -> `checked_out`, hoặc `cancelled`.
- Thanh toán `Demo` dành riêng cho môi trường phát triển; QR check-in chỉ xuất hiện sau khi thanh toán thành công.
- Hủy đơn, hoàn trạng thái thanh toán và điều chỉnh lại điểm thưởng theo đúng một lần chuyển trạng thái.
- Đăng nhập JWT, phân quyền `customer`, `receptionist`, `admin`; quyền quản trị được kiểm tra lại từ cơ sở dữ liệu.
- Dashboard quản trị lấy khách sạn, đơn đặt phòng, thanh toán, khách hàng, nhân sự, gói du lịch và báo cáo từ backend.
- Socket.IO cập nhật trạng thái giữ/đặt phòng; Redis được dùng cho TTL và khóa phân tán khi được cấu hình.
- Tìm vé máy bay nội địa từ Google Flights qua SerpApi, với danh mục 22 sân bay Việt Nam và trạng thái nguồn dữ liệu hiển thị rõ trên giao diện.
- Xem chi tiết du thuyền, thư viện ảnh toàn màn hình, cabin, lịch trình, quy định, đánh giá và yêu cầu đặt chỗ.

## Công nghệ

- Frontend: React 18, Vite, Tailwind CSS, Zustand, Framer Motion, Lucide, Socket.IO Client.
- Backend: Node.js, Express, Prisma, SQLite, Redis, Socket.IO, Zod, JWT.
- Kiểm thử: Vitest và Supertest.

## Khởi chạy local

Yêu cầu Node.js 20.19 trở lên. Redis là tùy chọn khi phát triển; nếu không có `REDIS_URL`, backend dùng bộ nhớ của tiến trình hiện tại. Production bắt buộc có Redis.

### Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```

API chạy tại `http://localhost:5000`. Tệp `.env.example` mô tả đầy đủ biến môi trường; hãy thay `JWT_SECRET` trước khi triển khai.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173`. Vite chuyển tiếp `/api` và `/socket.io` tới backend local.

## Kết nối vé máy bay thật cho dự án cá nhân

Đăng ký gói miễn phí tại SerpApi, tạo API key rồi thêm vào `backend/.env`:

```dotenv
SERPAPI_API_KEY="your-serpapi-key"
```

Backend tìm Google Flights với tiền tệ VND và lưu kết quả giống nhau trong 10 phút để tiết kiệm hạn mức miễn phí. Khóa chỉ nằm ở backend; frontend gọi các endpoint `/api/v1/flights/status`, `/api/v1/flights/airports` và `/api/v1/flights/search`, không nhận hoặc lưu API key. Đây là chức năng tìm kiếm và so sánh giá, không phải hệ thống phát hành vé.

## Tài khoản demo

Mật khẩu mặc định trong development là `123456`. Có thể thay bằng biến `DEMO_PASSWORD` trước khi chạy seed.

| Vai trò | Email | Phạm vi |
| --- | --- | --- |
| Khách hàng Gold | `customer@dibaoxa.vn` | Tìm kiếm, đặt/hủy phòng, xem QR |
| Quản trị viên | `admin@dibaoxa.vn` | Toàn bộ dashboard và vận hành |
| Lễ tân | `reception@dibaoxa.vn` | Đơn đặt phòng và check-in/check-out |

Seed dùng `upsert`, vì vậy có thể chạy lại mà không xóa hoặc nhân đôi dữ liệu mẫu. Bộ dữ liệu gồm 4 khách sạn, 11 loại phòng, 11 dịch vụ, 8 đánh giá, 2 gói du lịch và 2 hồ sơ nhân sự.

## Kiểm tra

```powershell
cd backend
npm test
npx prisma validate

cd ..\frontend
npm run build
```

## Thanh toán và triển khai

Giao diện local chỉ hiển thị phương thức `Demo` và ghi rõ đây không phải giao dịch ngân hàng. Backend có bước xác thực HMAC-SHA512, số tiền và trạng thái cho IPN VNPAY, nhưng để nhận thanh toán thật vẫn cần thông tin merchant, luồng tạo URL thanh toán và URL callback công khai.

SQLite phù hợp cho local/demo một tiến trình. Khi triển khai nhiều máy chủ, cần chuyển Prisma sang cơ sở dữ liệu production như PostgreSQL, chạy migration và cấu hình Redis dùng chung. Backend không cho phép fallback Redis trong `NODE_ENV=production`.

JWT hiện được gửi bằng Bearer token và lưu ở local storage hoặc session storage tùy lựa chọn “ghi nhớ đăng nhập”; dự án không tuyên bố dùng HTTP-only cookie.
