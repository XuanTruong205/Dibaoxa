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
- URL công khai cho từng nhóm dịch vụ, trang 404 riêng, trang cảm ơn, chính sách bảo mật và câu chuyện khách hàng lấy từ đánh giá trong cơ sở dữ liệu.
- Form liên hệ được kiểm tra và lưu ở backend; Admin có hộp thư xử lý theo trạng thái mới, đang xử lý và đã hoàn tất.
- Admin quản lý hồ sơ đội ngũ công khai, gồm ảnh đã được đồng ý sử dụng, giới thiệu ngắn và thứ tự hiển thị. API công khai không trả email hoặc số điện thoại nội bộ.
- SEO theo từng trang gồm title, description, canonical, Open Graph, JSON-LD doanh nghiệp địa phương, robots và sitemap.
- CTA hỗ trợ cố định trên mobile và mục 5 câu hỏi thường gặp tại trang chủ.

## Công nghệ

- Frontend: React 18, Vite, Tailwind CSS, Zustand, Framer Motion, Lucide, Socket.IO Client.
- Backend: Node.js, Express, Prisma, SQLite, Redis, Socket.IO, Zod, JWT.
- Kiểm thử: Vitest và Supertest.

## Kiến trúc

```text
Browser
  -> React + Zustand
  -> /api/v1
  -> Express middleware, Zod validation, JWT/RBAC
  -> Controller
  -> Service and provider adapters
  -> Prisma
  -> SQLite local or production database
```

Redis và Socket.IO đảm nhiệm dữ liệu giữ chỗ có thời hạn và cập nhật thời gian thực. SerpApi, OpenAI, VietQR và SePay chỉ được gọi từ service phía backend, thông qua biến môi trường.

## Cấu trúc dự án

```text
backend/
  prisma/       schema và dữ liệu phát triển
  src/          routes, controllers, services, middleware
  tests/        unit và integration tests
frontend/
  public/       robots, sitemap và tài nguyên tĩnh
  src/          pages, components, stores, services, utilities
docs/           blueprint, API, database, security, testing, deployment
.github/        quality gate cho pull request và push
```

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

Sao chép `frontend/.env.example` thành `frontend/.env` và thay `VITE_SITE_URL` bằng tên miền thật. Chỉ khai báo `VITE_GA_MEASUREMENT_ID` khi đã tạo GA4 property cho môi trường production.

Tài liệu kiến trúc, API, cơ sở dữ liệu, luồng nghiệp vụ, bảo mật, kiểm thử và triển khai nằm trong thư mục `docs`.

## Biến môi trường

- Bắt buộc backend: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PAYMENT_MODE`.
- Production nhiều tiến trình: `REDIS_URL`.
- Thanh toán QR tự động: `VIETQR_BANK_ID`, `VIETQR_ACCOUNT_NO`, `VIETQR_ACCOUNT_NAME`, `SEPAY_WEBHOOK_API_KEY`.
- Tùy chọn: `OPENAI_API_KEY`, `OPENAI_MODEL`, `SERPAPI_API_KEY`.
- Frontend: `VITE_SITE_URL`; `VITE_GA_MEASUREMENT_ID` chỉ dùng khi có GA4 thật.

Không đưa `.env` hoặc khóa thật vào Git. Các tệp `.env.example` chỉ chứa tên biến và giá trị minh họa.

## API và vai trò

- Public: danh mục khách sạn, du thuyền, sân bay, tìm chuyến bay, đánh giá nổi bật, đội ngũ công khai và gửi yêu cầu tư vấn.
- Customer: hồ sơ, giữ và xác nhận phòng, đơn dịch vụ, thanh toán, hủy đơn và lịch sử.
- Receptionist: đơn thuộc phạm vi cơ sở, check-in, thanh toán vận hành và yêu cầu tư vấn.
- Admin: toàn bộ CRUD nội dung, tồn kho, khách hàng, nhân sự, đơn hàng, giao dịch và báo cáo.

Chi tiết method, validation và quyền nằm tại `docs/api-documentation.md`.

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
npm test
npm run build
npm run perf:check
```

GitHub Actions chạy Prisma validation, database setup, backend tests, frontend tests, production build và performance budget trên mỗi pull request.

## Thanh toán và triển khai

Giao diện local chỉ hiển thị phương thức `Demo` và ghi rõ đây không phải giao dịch ngân hàng. Backend có bước xác thực HMAC-SHA512, số tiền và trạng thái cho IPN VNPAY, nhưng để nhận thanh toán thật vẫn cần thông tin merchant, luồng tạo URL thanh toán và URL callback công khai.

SQLite phù hợp cho local/demo một tiến trình. Khi triển khai nhiều máy chủ, cần chuyển Prisma sang cơ sở dữ liệu production như PostgreSQL, chạy migration và cấu hình Redis dùng chung. Backend không cho phép fallback Redis trong `NODE_ENV=production`.

JWT hiện được gửi bằng Bearer token và lưu ở local storage hoặc session storage tùy lựa chọn “ghi nhớ đăng nhập”; dự án không tuyên bố dùng HTTP-only cookie.

## Ảnh chụp và nội dung thật

Các ảnh giao diện có thể được thêm vào hồ sơ dự án sau khi chạy local. Ảnh đội ngũ không được seed hoặc tự tạo: Admin vào mục nhân sự, thêm URL ảnh đã có sự đồng ý, bật “Hiển thị trên website” và đặt thứ tự. Trang liên hệ chỉ hiển thị hồ sơ hợp lệ.

## Khắc phục sự cố

- API báo `401`: đăng nhập lại và kiểm tra token chưa hết hạn.
- API báo `403`: tài khoản không có vai trò phù hợp hoặc lễ tân đang truy cập ngoài cơ sở được gán.
- Không có QR thật: kiểm tra `PAYMENT_MODE=vietqr` và đủ biến VietQR/SePay.
- Không có kết quả chuyến bay: kiểm tra `SERPAPI_API_KEY`, quota và endpoint `/api/v1/flights/status`.
- Prisma báo thiếu cột sau khi pull code mới: chạy `npx prisma generate` rồi `npx prisma db push` trong `backend`.
- Frontend gọi API lỗi khi chạy local: khởi động backend ở cổng 5000 trước khi chạy Vite.
