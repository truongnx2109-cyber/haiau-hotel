// ============================================================
//  Khách sạn Hải Âu - Web + API JSON cho Smax AI
//  Node.js + Express. Tài liệu API tại /docs (Swagger).
// ============================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Tài liệu API chuẩn OpenAPI/Swagger tại /docs
const openapiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, "openapi.json"), "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: "Khách sạn Hải Âu - API Docs"
}));
app.get("/openapi.json", (req, res) => res.json(openapiSpec));

// ------------------------------------------------------------
// DỮ LIỆU MẪU: các loại phòng
// ------------------------------------------------------------
const ROOMS = [
  {
    id: "STD",
    anh: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
    ten: "Phòng Standard",
    mo_ta: "Phòng tiêu chuẩn 1 giường đôi, view thành phố.",
    gia_moi_dem: 600000,
    suc_chua: 2,
    tien_nghi: ["Wifi", "Điều hòa", "TV", "Tủ lạnh mini"],
    tong_so_phong: 10
  },
  {
    id: "DLX",
    anh: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    ten: "Phòng Deluxe",
    mo_ta: "Phòng cao cấp 1 giường king, view biển một phần.",
    gia_moi_dem: 1100000,
    suc_chua: 2,
    tien_nghi: ["Wifi", "Điều hòa", "TV", "Minibar", "Bồn tắm"],
    tong_so_phong: 8
  },
  {
    id: "SUITE",
    anh: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    ten: "Phòng Suite Biển",
    mo_ta: "Suite rộng có ban công, view biển trực diện.",
    gia_moi_dem: 2500000,
    suc_chua: 4,
    tien_nghi: ["Wifi", "Điều hòa", "TV", "Minibar", "Bồn tắm", "Ban công", "Phòng khách"],
    tong_so_phong: 4
  },
  {
    id: "FAM",
    anh: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    ten: "Phòng Gia Đình",
    mo_ta: "2 giường đôi, phù hợp gia đình 4 người.",
    gia_moi_dem: 1600000,
    suc_chua: 4,
    tien_nghi: ["Wifi", "Điều hòa", "TV", "Tủ lạnh", "Bàn ăn"],
    tong_so_phong: 6
  }
];

// ------------------------------------------------------------
// LƯU ĐƠN ĐẶT vào file bookings.json
// ------------------------------------------------------------
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

function docDonDat() {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) return [];
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}

function luuDonDat(list) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(list, null, 2), "utf8");
}

function soPhongDaDat(roomId, checkin, checkout) {
  const ds = docDonDat();
  return ds.filter(b =>
    b.room_id === roomId &&
    b.trang_thai !== "da_huy" &&
    checkin < b.checkout && checkout > b.checkin
  ).reduce((sum, b) => sum + (b.so_phong || 1), 0);
}

function songay(checkin, checkout) {
  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function maDonNgauNhien() {
  return "HA" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
}

// ============================================================
//  CÁC API
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ten_khach_san: "Khách sạn Hải Âu", thoi_gian: new Date().toISOString() });
});

app.get("/api/rooms", (req, res) => {
  res.json({ thanh_cong: true, so_loai: ROOMS.length, du_lieu: ROOMS });
});

app.get("/api/rooms/:id", (req, res) => {
  const room = ROOMS.find(r => r.id.toLowerCase() === req.params.id.toLowerCase());
  if (!room) return res.status(404).json({ thanh_cong: false, loi: "Không tìm thấy loại phòng" });
  res.json({ thanh_cong: true, du_lieu: room });
});

app.get("/api/availability", (req, res) => {
  const { checkin, checkout, room_id } = req.query;
  if (!checkin || !checkout) {
    return res.status(400).json({ thanh_cong: false, loi: "Thiếu checkin hoặc checkout (định dạng YYYY-MM-DD)" });
  }
  const sn = songay(checkin, checkout);
  if (isNaN(sn) || sn <= 0) {
    return res.status(400).json({ thanh_cong: false, loi: "Ngày không hợp lệ, checkout phải sau checkin" });
  }
  let danhsach = ROOMS;
  if (room_id) {
    danhsach = ROOMS.filter(r => r.id.toLowerCase() === room_id.toLowerCase());
    if (danhsach.length === 0)
      return res.status(404).json({ thanh_cong: false, loi: "Không tìm thấy loại phòng" });
  }
  const ketqua = danhsach.map(r => {
    const daDat = soPhongDaDat(r.id, checkin, checkout);
    const conTrong = Math.max(0, r.tong_so_phong - daDat);
    return {
      room_id: r.id,
      ten: r.ten,
      anh: r.anh,
      gia_moi_dem: r.gia_moi_dem,
      so_phong_con_trong: conTrong,
      con_phong: conTrong > 0,
      tong_tien_du_kien: r.gia_moi_dem * sn
    };
  });
  res.json({ thanh_cong: true, checkin, checkout, so_dem: sn, du_lieu: ketqua });
});

app.post("/api/bookings", (req, res) => {
  const { ten_khach, sdt, room_id, checkin, checkout, so_phong, ghi_chu } = req.body || {};
  if (!ten_khach || !sdt || !room_id || !checkin || !checkout) {
    return res.status(400).json({
      thanh_cong: false,
      loi: "Thiếu thông tin bắt buộc: ten_khach, sdt, room_id, checkin, checkout"
    });
  }
  const room = ROOMS.find(r => r.id.toLowerCase() === room_id.toLowerCase());
  if (!room) return res.status(404).json({ thanh_cong: false, loi: "Loại phòng không tồn tại" });
  const sn = songay(checkin, checkout);
  if (isNaN(sn) || sn <= 0)
    return res.status(400).json({ thanh_cong: false, loi: "Ngày không hợp lệ" });
  const soLuong = parseInt(so_phong) || 1;
  const daDat = soPhongDaDat(room.id, checkin, checkout);
  const conTrong = room.tong_so_phong - daDat;
  if (soLuong > conTrong) {
    return res.status(409).json({
      thanh_cong: false,
      loi: `Không đủ phòng. Chỉ còn ${conTrong} phòng ${room.ten} trong khoảng ngày này.`
    });
  }
  const don = {
    ma_don: maDonNgauNhien(),
    ten_khach, sdt,
    room_id: room.id,
    ten_phong: room.ten,
    checkin, checkout,
    so_dem: sn,
    so_phong: soLuong,
    tong_tien: room.gia_moi_dem * sn * soLuong,
    ghi_chu: ghi_chu || "",
    trang_thai: "da_xac_nhan",
    ngay_tao: new Date().toISOString()
  };
  const ds = docDonDat();
  ds.push(don);
  luuDonDat(ds);
  res.status(201).json({ thanh_cong: true, thong_bao: "Đặt phòng thành công", du_lieu: don });
});

app.get("/api/bookings/:ma_don", (req, res) => {
  const ds = docDonDat();
  const don = ds.find(b => b.ma_don.toLowerCase() === req.params.ma_don.toLowerCase());
  if (!don) return res.status(404).json({ thanh_cong: false, loi: "Không tìm thấy đơn đặt" });
  res.json({ thanh_cong: true, du_lieu: don });
});

app.get("/api/bookings", (req, res) => {
  const { sdt } = req.query;
  let ds = docDonDat();
  if (sdt) ds = ds.filter(b => b.sdt === sdt);
  res.json({ thanh_cong: true, so_don: ds.length, du_lieu: ds });
});

app.post("/api/bookings/:ma_don/cancel", (req, res) => {
  const ds = docDonDat();
  const don = ds.find(b => b.ma_don.toLowerCase() === req.params.ma_don.toLowerCase());
  if (!don) return res.status(404).json({ thanh_cong: false, loi: "Không tìm thấy đơn đặt" });
  don.trang_thai = "da_huy";
  luuDonDat(ds);
  res.json({ thanh_cong: true, thong_bao: "Đã hủy đơn", du_lieu: don });
});

app.listen(PORT, () => {
  console.log(`✅ Server Khách sạn Hải Âu chạy tại http://localhost:${PORT}`);
  console.log(`   • Trang web:    http://localhost:${PORT}`);
  console.log(`   • Trang test:   http://localhost:${PORT}/test.html`);
  console.log(`   • Tài liệu API: http://localhost:${PORT}/docs`);
});
