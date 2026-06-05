# 🏨 Khách sạn Hải Âu — API Demo cho Smax AI

Web demo nhỏ bằng **Node.js + Express**, cung cấp các API JSON để Smax AI gọi vào lấy/ghi dữ liệu đặt phòng.

---

## 1. Cài đặt & chạy

Cần cài [Node.js](https://nodejs.org) (bản LTS).

```bash
npm install      # cài thư viện (chỉ chạy lần đầu)
npm start        # chạy server
```

Sau khi chạy, mở trình duyệt: **http://localhost:3000** — có sẵn trang test bấm thử các API.

Đơn đặt phòng được lưu trong file `bookings.json` (tự tạo).

---

## 2. Đưa web ra Internet để Smax AI gọi được (có domain)

Smax AI nằm trên cloud nên không gọi được `localhost`. Cần một "đường hầm" công khai. Dùng **ngrok** (miễn phí):

1. Tải ngrok: https://ngrok.com/download → đăng ký tài khoản free → lấy authtoken.
2. Cấu hình 1 lần:
   ```bash
   ngrok config add-authtoken <TOKEN_CỦA_BẠN>
   ```
3. Mở **2 cửa sổ terminal**:
   - Cửa sổ 1: `npm start` (server vẫn chạy)
   - Cửa sổ 2: `ngrok http 3000`
4. ngrok in ra domain công khai, ví dụ:
   ```
   Forwarding  https://abcd-1234.ngrok-free.app -> http://localhost:3000
   ```
   → Đây là **domain** bạn đưa cho đồng nghiệp / dán vào Smax AI.

> Lưu ý: domain free của ngrok đổi mỗi lần khởi động lại. Muốn domain cố định miễn phí → đăng ký 1 "static domain" trong dashboard ngrok (free 1 domain), rồi chạy:
> `ngrok http --url=ten-cua-ban.ngrok-free.app 3000`

**Lựa chọn khác:** Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`) cũng miễn phí và không cần đăng ký.

---

## 3. Danh sách API

Base URL = domain ngrok của bạn (ví dụ `https://abcd-1234.ngrok-free.app`).

| Method | Đường dẫn | Chức năng |
|--------|-----------|-----------|
| GET | `/api/health` | Kiểm tra server sống |
| GET | `/api/rooms` | Danh sách tất cả loại phòng |
| GET | `/api/rooms/:id` | Chi tiết 1 loại phòng (vd `/api/rooms/DLX`) |
| GET | `/api/availability?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&room_id=DLX` | Kiểm tra phòng trống (room_id tùy chọn) |
| POST | `/api/bookings` | Đặt phòng |
| GET | `/api/bookings/:ma_don` | Tra cứu 1 đơn theo mã |
| GET | `/api/bookings?sdt=0901234567` | Các đơn theo số điện thoại |
| POST | `/api/bookings/:ma_don/cancel` | Hủy đơn |

### Ví dụ — Đặt phòng (POST `/api/bookings`)

Body JSON gửi lên:
```json
{
  "ten_khach": "Nguyễn Văn A",
  "sdt": "0901234567",
  "room_id": "DLX",
  "so_phong": 1,
  "checkin": "2026-06-20",
  "checkout": "2026-06-22",
  "ghi_chu": "Phòng tầng cao"
}
```

Kết quả trả về:
```json
{
  "thanh_cong": true,
  "thong_bao": "Đặt phòng thành công",
  "du_lieu": {
    "ma_don": "HA12345678",
    "ten_khach": "Nguyễn Văn A",
    "room_id": "DLX",
    "tong_tien": 2200000,
    "trang_thai": "da_xac_nhan"
  }
}
```

---

## 4. Nối với Smax AI

Trong Smax AI, dùng khối/hành động **gọi API (HTTP Request / Webhook)**:

- **Lấy danh sách phòng**: phương thức `GET`, URL `https://<domain-ngrok>/api/rooms`.
- **Kiểm tra phòng trống**: `GET` URL `https://<domain-ngrok>/api/availability?checkin={{ngay_nhan}}&checkout={{ngay_tra}}` — thay `{{...}}` bằng biến hội thoại của Smax.
- **Đặt phòng**: `POST` URL `https://<domain-ngrok>/api/bookings`, Header `Content-Type: application/json`, Body là JSON như ví dụ trên (gắn biến của Smax vào).
- **Tra cứu đơn**: `GET` URL `https://<domain-ngrok>/api/bookings/{{ma_don}}`.

Smax đọc dữ liệu trong JSON trả về (vd `du_lieu.ma_don`, `du_lieu.tong_tien`) để trả lời khách.

---

## 5. Cấu trúc thư mục

```
server.js          # toàn bộ logic API
package.json       # khai báo thư viện
public/index.html  # trang web test API
bookings.json      # nơi lưu đơn đặt (tự tạo khi có đơn đầu tiên)
```

---

## 6. Cập nhật bản 1.1 — Web thật + Swagger

- **Trang chủ** (`/`): nay là một website khách sạn hoàn chỉnh (hero, giới thiệu, danh sách phòng có ảnh, form đặt phòng, tra cứu/hủy đơn). Dữ liệu phòng lấy trực tiếp từ API.
- **Tài liệu API Swagger** (`/docs`): giao diện chuẩn OpenAPI để xem & bấm thử mọi API ngay trên trình duyệt — gửi link `…/docs` cho lập trình viên hoặc dùng để hiểu cách Smax AI gọi.
- **File mô tả OpenAPI** (`/openapi.json`): có thể import vào Postman, Smax, hoặc công cụ khác.
- **Trang test nhanh** (`/test.html`): bảng bấm thử API như bản cũ.

Sau khi chạy `npm start`:
- Web:    http://localhost:3000
- Docs:   http://localhost:3000/docs
- Test:   http://localhost:3000/test.html
