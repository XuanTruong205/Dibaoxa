# API vé máy bay và khách sạn cho OTA cá nhân (đối chiếu 2026)

Ngày kiểm tra: **14/08/2026**. Phạm vi nguồn: chỉ tài liệu, trang đối tác và điều khoản do chính nhà cung cấp công bố.

## Kết luận điều hành

Không có lựa chọn GDS/OTA lớn nào vừa **miễn phí vô điều kiện**, vừa cho dữ liệu production thời gian thực, vừa cho phép một cá nhân tự động xuất vé/đặt phòng ngay lập tức. Cần phân biệt ba mức:

1. **Sandbox/test miễn phí**: dùng dữ liệu giả, giới hạn hoặc cache; không phản ánh chắc chắn giá và tồn kho thật.
2. **Affiliate/redirect**: có thể tham gia miễn phí và nhận hoa hồng, nhưng khách hoàn tất đặt chỗ trên trang nhà cung cấp.
3. **Booking API production**: cho phép đặt ngay trên MyViVu, nhưng thường cần KYC, hợp đồng, phương thức thanh toán, phê duyệt luồng và/hoặc đối tác xuất vé.

Khuyến nghị thực tế cho MyViVu:

- **Không bắt đầu tích hợp mới với Amadeus Self-Service:** sản phẩm/portal đã bị đánh dấu deprecated và kho mã chính thức được archive ngày 17/07/2026.
- **Giai đoạn MVP có booking thật:** Duffel Flights cho vé máy bay và Nuitee Connect (LiteAPI) cho khách sạn. Cả hai có sandbox không phí trả trước và đường lên production rõ hơn GDS truyền thống.
- **Giai đoạn chưa muốn chịu trách nhiệm thanh toán/hậu mãi:** Agoda Affiliate hoặc Travelpayouts/Aviasales theo mô hình redirect.
- **Chỉ cân nhắc Amadeus Enterprise, Sabre, Booking.com Demand API hoặc Agoda Demand API đầy đủ** sau khi đã có pháp nhân, traffic/volume và đầu mối account manager.

## Ma trận quyết định nhanh

| Nhà cung cấp | Bắt đầu test miễn phí | Dữ liệu production thật | Search | Book trên MyViVu | Rào cản production chính | Phù hợp OTA cá nhân mới |
|---|---:|---:|---:|---:|---|---|
| Amadeus Self-Service | **Không còn lựa chọn mới** | Sản phẩm đã deprecated 17/07/2026 | Chỉ còn tài liệu/kho mã lưu trữ | Không nên xây tích hợp mới | Chuyển sang Amadeus Enterprise theo hợp đồng | **Không phù hợp** |
| Amadeus Enterprise | Không có public sandbox/free tier | Có | Flight + hotel/GDS | Theo hợp đồng/quyền đại lý | Request-only, điều kiện và giá tùy chỉnh | **Không phù hợp giai đoạn đầu** |
| Sabre APIs | Không thấy free tier công khai | Có | Flight + hotel/GDS | Có | Quan hệ agency/Developer Partner, PCC, hợp đồng và account manager | **Không phù hợp giai đoạn đầu** |
| Booking.com Demand API | Có sandbox, nhưng chỉ sau khi là Managed Affiliate Partner | Có | Accommodation; một số vertical khác | Accommodation: tùy quyền | Hợp đồng Managed Affiliate + Account Manager + production approval | **Khó tiếp cận khi mới bắt đầu** |
| Agoda | Affiliate redirect: miễn phí; Demand API: theo phê duyệt | Có | Hotel | Redirect: không; Demand Book API được duyệt: có | Feasibility review, contract, certification, Account Manager | **Phù hợp redirect; API đầy đủ khó hơn** |
| Duffel | Có | Có | Flight | Có | KYC, business verification, balance/payment | **Phù hợp MVP flight** |
| Nuitee Connect / LiteAPI | Có | Có | Hotel | Có | Gắn payment method để có production key | **Phù hợp MVP hotel** |
| Travelpayouts / Aviasales | Data API/công cụ affiliate: có | Realtime Search API có điều kiện | Flight | Không, chuyển sang agency/airline | Realtime API yêu cầu tối thiểu 50.000 MAU | **Phù hợp content/redirect, không phải booking engine mới** |

## 1. Amadeus: Self-Service đã đóng

Thông tin “Amadeus có API Self-Service miễn phí để bắt đầu” đã **không còn đúng vào tháng 8/2026**. Tổ chức GitHub chính thức `amadeus4dev` ghi `[DEPRECATED]`, được administrator archive ngày **17/07/2026**, và trỏ đến statement của Amadeus. Các SDK, OpenAPI spec và sample Self-Service hiện chỉ còn là repository lưu trữ, không phải nền tảng nên chọn cho tích hợp mới. [Tổ chức GitHub chính thức Amadeus for Developers](https://github.com/amadeus4dev), [statement được Amadeus dẫn chiếu](https://amadeus.com/en/industry-messaging/statement-regarding-amadeus-for-developers-portal)

Các trang cũ vẫn có thể xuất hiện trên công cụ tìm kiếm với free monthly quota, `test.api.amadeus.com`, pay-as-you-go và quy trình Flight Create Orders. Đó là **tài liệu lịch sử trước khi đóng portal**, không được dùng để kết luận rằng người dùng mới còn có thể đăng ký hoặc lên production năm 2026.

Lựa chọn Amadeus còn phù hợp là **Enterprise APIs**: catalog đầy đủ hơn, account manager/support riêng, giá tùy chỉnh, cấp quyền theo yêu cầu và có thể có điều kiện đặc biệt. Tài liệu FAQ cũ của chính Amadeus mô tả Enterprise theo mô hình request-only/custom pricing, khác hẳn Self-Service. [Amadeus FAQ lưu trữ](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/)

### Đánh giá

Không thiết kế MyViVu dựa trên Amadeus Self-Service. Chỉ liên hệ Amadeus Enterprise khi đã có pháp nhân, volume, yêu cầu GDS rõ ràng và ngân sách hợp đồng; ở giai đoạn cá nhân nên chọn Duffel/Nuitee.

## 2. Sabre

### Mô hình truy cập

Tài liệu Sabre Offers and Orders yêu cầu Sabre credentials; credentials và một số Application ID phải lấy qua **Sabre Account Manager**. Endpoint tách rõ certification (`api.cert.platform.sabre.com`) và production (`api.platform.sabre.com`). Certification không đồng nghĩa với public sandbox tự đăng ký. [Sabre Offers and Orders API User Guide](https://developer.sabre.com/sites/default/files/2024-06/Sabre%20Offers%20and%20Orders%20APIs%20User%20Guide.pdf)

Sabre Partner Hub nói developer triển khai solution trên nền tảng Sabre phải subscribe chương trình Sabre Developer Partner; quyền lợi/tier phụ thuộc mức đầu tư. Sabre cũng hướng developer muốn truy cập API portfolio sang quy trình Partner. [Sabre Partner Hub](https://partners.sabre.com/partners/), [Partner tiers](https://partners.sabre.com/partners/tiers)

### Search, booking và pricing

Sabre cung cấp search/book/service end-to-end cho nội dung GDS/NDC thông qua Offer and Order APIs, nhưng quyền dùng gắn với Sabre-connected agency/developer partner và credentials/PCC phù hợp. [Sabre Offers and Orders guide](https://developer.sabre.com/sites/default/files/2024-06/Sabre%20Offers%20and%20Orders%20APIs%20User%20Guide.pdf)

Không có free tier Self-Service chung trong tài liệu công khai. Một **mẫu addendum Sabre APIs công khai, Rev. Feb25**, ghi implementation fee USD 1.000; subscription USD 291,67/tháng không support hoặc USD 458,33/tháng có support và 50 sessions; thêm block 50 sessions là USD 250. Mẫu cũng nêu supplemental content reservation fee USD 1/PNR tại APAC/Mexico và USD 3,75/PNR ở các điểm bán khác (trừ Brazil). Đây là **mẫu hợp đồng**, không phải báo giá phổ quát; giá thực tế phụ thuộc PCC, thị trường và hợp đồng, nên phải lấy quote từ Account Manager. [Sabre APIs addendum mẫu](https://static.marketplace.sabre.com/media/products/sapi/files/5d3c5a51-1bd5-4d86-9fe7-411ded9f6c73)

### Đánh giá

Sabre là lựa chọn enterprise/agency, không phải “free API cho dự án cá nhân”. Chỉ nên làm khi MyViVu đã có mô hình đại lý, PCC/quyền ticketing, volume và ngân sách hợp đồng.

## 3. Booking.com Affiliate / Demand API

### Điều kiện truy cập

Demand API không phải API mở chỉ cần email. Checklist chính thức yêu cầu:

- đã đăng ký là **Booking.com Managed Affiliate Partner**;
- có Partner Centre do Account Manager cấp sau khi ký hợp đồng;
- tạo API token và `X-Affiliate-Id` trong Partner Centre.

Nguồn: [Demand API prerequisites](https://developers.booking.com/demand/docs/getting-started/prerequisites).

### Sandbox và production

Sandbox `https://demandapi-sandbox.booking.com/3.2` dùng sample properties/attractions; có thể kiểm tra search, availability, booking, modify và cancel accommodation mà không chạm live inventory. Sandbox tối đa 50 request/phút. Với accommodation payment test, tài liệu yêu cầu thẻ thật; charge tạm thời và được hoàn tự động theo lịch. [Demand API sandbox](https://developers.booking.com/demand/docs/getting-started/sandbox)

Production `https://demandapi.booking.com/3.2` dùng live integration. Rate limit production là theo partner account và phải hỏi Account Manager. Sau khi kiểm thử sandbox, cần liên hệ Account Manager để xin production access. [Demand API reference](https://developers.booking.com/demand/docs/open-api/3.2/demand-api), [rate limiting](https://developers.booking.com/demand/docs/development-guide/rate-limiting), [production readiness](https://developers.booking.com/demand/docs/development-guide/production-readiness)

### Quyền search và booking

Booking.com hỗ trợ các mức content-only, search/look/redirect, search/look/book và post-booking; endpoint order cho phép preview, create, details, modify, cancel tùy quyền của partner. Không phải partner nào cũng được cấp toàn bộ endpoint; `403` nghĩa là đã xác thực nhưng không được phép dùng endpoint. [Demand API overview](https://developers.booking.com/demand), [authentication](https://developers.booking.com/demand/docs/development-guide/authentication)

Tại thời điểm kiểm tra, trang sản phẩm đánh dấu **Flights** và **Airport taxis** là “Coming soon”; vì vậy không nên chọn Demand API hiện tại làm nguồn flight production cho MyViVu chỉ dựa vào marketing “stays, transportation and attractions”. [Demand API product page](https://developers.booking.com/demand)

Booking.com không công bố bảng giá API chung trong tài liệu đã kiểm tra; commission, payment model, rate limit và quyền endpoint phụ thuộc cấu hình/hợp đồng partner. Ví dụ một số TPI/net rate còn yêu cầu addendum và quyền VCC riêng. [TPI net rates requirements](https://developers.booking.com/demand/docs/accommodations/tpi/net-how-to)

### Đánh giá

Đây là API hotel rất mạnh nhưng **không phải lựa chọn khởi đầu miễn phí/tự phục vụ**. Nên bắt đầu bằng affiliate redirect; chỉ xin Demand API khi đã chứng minh traffic và có Account Manager.

## 4. Agoda Partners

### Affiliate redirect miễn phí

Agoda công bố Affiliate Program không thu phí tham gia, nhưng ứng viên thông thường phải có website và mọi đơn đều qua review. Với bộ công cụ affiliate chuẩn, người dùng được gửi sang Agoda; Agoda hoàn tất booking/payment, affiliate nhận commission cho completed stay. [Agoda Affiliate FAQ](https://partners.agoda.com/en-us/faq.html)

Đây là phương án không phí trả trước dễ hiểu nhất, nhưng **không phải booking API white-label hoàn toàn**.

### Agoda Demand API đầy đủ

Tài liệu Demand hiện hành chia ba mô hình:

- **Online Affiliate/MSE:** chỉ Search API; phù hợp so sánh giá/redirect.
- **Agoda Fulfill Assisted:** Search + Book; Agoda thu tiền, gửi voucher và xử lý post-booking support.
- **Partner Fulfillment:** Search + Book + post-book APIs; partner tự thu tiền và hỗ trợ khách.

Luồng có Content, Search, Pre-check, Book, Report và Cancel; Agoda khuyến nghị Pre-check vì allotment và price thay đổi động. [Agoda Demand – Getting Started](https://developer.agoda.com/demand/docs/getting-started)

Đây không phải API tự đăng ký. Quy trình chính thức gồm feasibility/commercial review, nhận site credentials, tích hợp trong sandbox, Agoda certification, ký contract và vendor registration, capacity planning rồi mới go-live. Sandbox mirror production nhưng dung lượng hạn chế; test trên live cần Account Manager phê duyệt rõ ràng và test trái phép có thể chịu cancellation fee không hoàn lại. [Agoda Demand – Environment Setup](https://developer.agoda.com/demand/docs/environment-setup)

Tài liệu công khai không nêu free quota hay bảng giá Demand API. Vì vậy phải xem API search/book là **quyền thương mại được account manager phê duyệt**, không phải quyền mặc định khi tạo affiliate account.

Lưu ý không nhầm Affiliate API (bán phòng cho khách) với Agoda Connectivity/YCS/OTA API (để property/channel manager cập nhật rate, availability và lấy booking). Connectivity Partner phải qua assessment, NDA, test và review trước go-live. [Agoda Connectivity – Become a Partner](https://www.agodaconnectivity.com/become-a-partner), [Connectivity documentation](https://www.agodaconnectivity.com/documentation)

### Đánh giá

Với MyViVu mới, Agoda Affiliate redirect là thực tế; Agoda Demand Search/Book chỉ nên lập kế hoạch sau khi có feasibility review, contract, certification và approval bằng văn bản.

## 5. Các lựa chọn khả thi không phí trả trước

### 5.1 Duffel Flights — khuyến nghị cho flight MVP

- Test mode là sandbox miễn phí/risk-free; Duffel Airways dùng lịch và giá giả, còn airline sandbox có thể thiếu ổn định. Không được dùng test price như giá thật. [Duffel test mode](https://duffel.com/docs/api/overview/test-mode/duffel-airways), [test prices are not live](https://help.duffel.com/hc/en-gb/articles/4410085835282-Are-the-flight-prices-in-test-mode-sandbox-real)
- Có search, tạo order, ancillary, cancel/change theo capability. Production cho phép booking thật bằng Managed Content mà không cần IATA riêng.
- Go-live yêu cầu xác minh email, loại hình kinh doanh, thông tin cá nhân/doanh nghiệp và KYC. Sau activation có live token; nếu không dùng Duffel Payments thì nạp Balance để thanh toán flight. [Getting started/activation](https://duffel.com/guides/getting-started)
- Bảng giá công khai theo USD: **USD 3/confirmed order**, Managed Content **1% tổng order**, ancillary **USD 2/món**; vượt search-to-book ratio 1.500:1 bị tính **USD 0,005/excess search**. Trang giá ghi zero upfront cost/no upfront fee. [Duffel pricing](https://duffel.com/pricing)

Điểm cần kiểm tra trước khi chọn: Duffel Payments không có ở mọi quốc gia, Payment Intents hiện ghi không nhận khách mới; MyViVu có thể phải tự thu tiền và nạp Duffel Balance. [Duffel Payment Intents](https://duffel.com/docs/api/payment-intents)

### 5.2 Nuitee Connect (LiteAPI) — khuyến nghị cho hotel MVP

- Mỗi account có free sandbox key, không cần thẻ; có thể chạy Rates → Prebook → Book giả lập. Muốn booking thật thì thêm credit card để lấy production key và cấu hình payout. [Getting a sandbox key](https://docs.liteapi.travel/docs/getting-a-sandbox-key), [Booking a room](https://docs.liteapi.travel/docs/booking-a-room)
- Core booking workflow Rates → Prebook → Book được công bố **free** nếu tuân thủ Terms và reasonable look-to-book ratio. Premium endpoint: price index USD 0,05/request, places USD 0,01/request; các endpoint khác phần lớn miễn phí theo fair use. [API pricing](https://docs.liteapi.travel/reference/api-pricing-usage-costs)
- Có booking và confirmation code thật trong production; sandbox dùng payment method mô phỏng và không charge. [Complete a booking](https://docs.liteapi.travel/reference/post_rates-book)

Đây là lựa chọn dễ nhất để có full hotel checkout mà không ký trực tiếp với từng khách sạn. Cần đọc kỹ ToS, settlement, refund, chargeback và nghĩa vụ customer support trước go-live; “API call miễn phí” không có nghĩa tiền phòng/chargeback là miễn phí.

### 5.3 Travelpayouts / Aviasales — flight affiliate/redirect

- Flight Data API cung cấp dữ liệu cache (lịch sử search gần đây), phù hợp trang content/giá tham khảo; người dùng click “Book” để sang agency/airline, không phải MyViVu phát hành vé.
- Real-time Flight Search API phiên bản từ 01/11/2025 chỉ cấp cho project từ **50.000 MAU**, mặc định 100 request/giờ trên mỗi user IP. [Aviasales Flights Search API](https://support.travelpayouts.com/hc/en-us/articles/30565016140434-Aviasales-Flights-Search-API-real-time-and-multi-city-search)
- Search phải do user khởi tạo, chạy server-side, hiển thị đầy đủ kết quả và chỉ tạo booking link sau khi user bấm Book; không được scrape/auto-collect. [Search API rules](https://support.travelpayouts.com/hc/en-us/articles/34788165535250-Search-API-usage-rules)
- Data API/công cụ affiliate có sau khi đăng ký và kết nối chương trình; Search API realtime cần duyệt riêng. [Affiliate tools](https://support.travelpayouts.com/hc/en-us/articles/203955643-Affiliate-tools-for-Aviasales-program)

Do ngưỡng 50.000 MAU, đây là lựa chọn zero-upfront cho affiliate/content, **không phải nguồn realtime phù hợp cho OTA mới**.

## 6. Kiến trúc đề xuất cho MyViVu

Không nên “đồng bộ giá và tồn kho thời gian thực” bằng cron vào database. Giá/ghế/phòng là dữ liệu động và có thể hết ngay sau khi search. Booking.com cũng yêu cầu không lưu dynamic price/availability, chỉ cache static content và gọi lại trước booking. [Booking.com production readiness](https://developers.booking.com/demand/docs/development-guide/production-readiness)

Luồng nên là:

```text
Frontend MyViVu
    -> Backend Search API
        -> FlightProvider adapter (Duffel sandbox / Duffel live)
        -> HotelProvider adapter (Nuitee sandbox / Nuitee live)
    <- normalized offers + providerOfferId + expiresAt

User chọn offer
    -> Backend reprice/prebook
    -> kiểm tra lại giá + availability
    -> payment/booking
    -> lưu provider booking/order ID
    -> webhook/polling cập nhật trạng thái
```

Các nguyên tắc triển khai:

1. Giữ API key ở backend; không gọi vendor từ React/browser.
2. Tách `FlightProvider` và `HotelProvider` để đổi vendor mà không sửa UI/domain model.
3. Chỉ đồng bộ/cache **static content**: airport, city, hotel metadata, image có quyền sử dụng.
4. Search động khi người dùng submit; cache rất ngắn và gắn `expiresAt`.
5. Luôn reprice/precheck ngay trước khi thu tiền và book.
6. Dùng idempotency key cho booking; không retry mù khi timeout.
7. Lưu mapping `internalOrderId <-> providerOrderId`, raw status và audit log.
8. Nhận webhook; có polling bù khi webhook thất lạc.
9. Thiết kế manual operations cho cancel/change/refund vì nhiều provider không tự động hóa toàn bộ hậu mãi.
10. Tách feature flag `mock`, `sandbox`, `production`; UI phải gắn nhãn rõ sandbox/demo để không bán nhầm dữ liệu test.

## 7. Lộ trình triển khai ít rủi ro

### Tuần 1–2: prototype không phát sinh tiền

- Đăng ký Duffel và Nuitee sandbox; không tạo tích hợp mới dựa trên Amadeus Self-Service đã deprecated.
- Chuẩn hóa model `Offer`, `Price`, `CancellationPolicy`, `Passenger/Guest`, `ProviderOrder`.
- Xây search + detail + precheck giả lập; chưa bật payment thật.

### Tuần 3–4: hotel production trước

- Chọn Nuitee production hoặc Agoda redirect.
- Hoàn thiện idempotency, payment return URL, booking status, cancel/refund runbook.
- Đặt hạn mức chi tiêu/alerts và log mọi request booking.

### Sau khi hotel ổn định: flight production

- Chọn Duffel nếu muốn full booking API và chấp nhận KYC/balance/fees.
- Nếu sau này chọn GDS Enterprise thay Duffel, chốt hợp đồng, quyền ticketing/consolidator và phạm vi post-booking trước khi phát triển sâu.
- Chuẩn bị customer support cho schedule change, reissue và refund; đây là phần vận hành, không chỉ là tích hợp API.

### Khi có traffic/volume

- Nộp hồ sơ Booking.com Managed Affiliate/Agoda full API.
- Chỉ đàm phán Sabre/Amadeus Enterprise khi cần coverage, negotiated fares, PCC/workflow và SLA ở quy mô doanh nghiệp.

## 8. Checklist trước khi ký/go-live

- API có trả **live price và live availability** hay chỉ cache/test?
- Quyền hiện tại là search, redirect, reserve/PNR hay ticket issuance/confirmed booking?
- Ai là merchant of record và ai xử lý chargeback?
- Có cần PCI DSS, 3DS, VCC, deposit/balance/credit line không?
- Ai xử lý cancel, change, refund và schedule change ngoài giờ?
- Fee gồm per-call, per-order, % order, FX, ancillary, look-to-book và support nào?
- Có quyền dùng ảnh, review và hotel content trong cache không?
- Production access có được xác nhận bằng hợp đồng/email Account Manager không?
- Rate limit, SLA, sandbox parity và webhook retry policy là gì?
- Có budget cap/alert và kill switch cho production booking chưa?

## Ghi chú về tính cập nhật

Các quota, phí, country coverage và tiêu chí partner có thể thay đổi. Trước khi code production, cần chụp/lưu bảng giá và Terms tại ngày ký, đồng thời xin xác nhận bằng văn bản về: endpoint được cấp, thị trường Việt Nam, payment/settlement, commission, rate limit và quyền booking/ticketing.
