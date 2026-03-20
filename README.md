# Fintown – Frontend Codebase

> **Lưu ý:** Đây là phần Frontend (FE) của dự án Fintown — nền tảng phân tích và định giá cổ phiếu. Backend/API được quản lý ở repository riêng.

---

## 📋 Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu |
|--------|----------------------|
| Node.js | `>= 14.0.0` (khuyến nghị 18.x LTS) |
| npm | `>= 8.x` |
| Trình duyệt | Chrome / Edge / Firefox mới nhất |

---

## 🚀 Cài đặt & Khởi chạy

### 1. Clone dự án

```bash
git clone <repo-url>
cd nextjs_mvp-master
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env.local` ở thư mục gốc (tham khảo `.env.example` nếu có):

```env
NEXT_PUBLIC_API_URL=<URL backend API>
# Thêm các biến môi trường khác nếu cần
```

### 4. Chạy môi trường Development

```bash
npm run dev
# hoặc
npm run inw
```

Ứng dụng sẽ chạy tại: [http://localhost:3000](http://localhost:3000)

### 5. Build Production

```bash
npm run build
npm run start
```

---

## 📁 Cấu trúc thư mục

```
nextjs_mvp-master/
├── public/                  # Static assets (ảnh, icons, ...)
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (main)/          # Layout trang chủ (landing page)
│   │   ├── (user)/          # Luồng người dùng: signup, profile, payment
│   │   └── dashboard/       # Khu vực chính sau đăng nhập
│   │       ├── co-phieu/            # Trang danh sách & chi tiết cổ phiếu
│   │       │   └── [symbol]/        # Dynamic route theo mã CK
│   │       │       ├── ho-so-doanh-nghiep/
│   │       │       ├── bao-cao-doanh-nghiep/
│   │       │       ├── du-lieu-lich-su/
│   │       │       ├── ket-qua-du-bao/
│   │       │       └── so-sanh/
│   │       ├── dinh-gia-co-phieu/   # Công cụ định giá DCF/P/E
│   │       ├── bieu-do-ky-thuat/    # Biểu đồ kỹ thuật (Highcharts)
│   │       ├── dang-ky-goi/         # Trang gói dịch vụ
│   │       ├── ve-chung-toi/
│   │       ├── lien-he/
│   │       └── phap-ly/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── charts/          # Các component biểu đồ
│   │   ├── common/          # UI tái sử dụng chung
│   │   ├── form/            # Form components (Formik + Yup)
│   │   ├── organisms/       # Component phức hợp theo trang
│   │   └── Providers.tsx    # Redux Provider + TopLoader
│   ├── redux/               # Redux Toolkit – state management
│   │   ├── store.ts         # Cấu hình store trung tâm
│   │   ├── auth/            # Slice xác thực
│   │   ├── darkmode/        # Slice dark mode
│   │   └── ...              # Các slice theo từng tính năng
│   ├── interfaces/          # TypeScript interfaces/types
│   ├── typings/             # Khai báo kiểu bổ sung
│   ├── utils/               # Hàm tiện ích dùng chung
│   └── styles/              # CSS toàn cục (globals.css)
├── .prettierrc              # Cấu hình Prettier
├── tailwind.config.js       # Cấu hình Tailwind CSS
├── tsconfig.json            # Cấu hình TypeScript
└── package.json
```

---

## 🛠️ Tech Stack chính

| Thư viện | Mục đích |
|----------|---------|
| **Next.js 14** (App Router) | Framework React, routing, SSR/CSR |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling utility-first |
| **MUI (Material UI)** | Component UI nâng cao |
| **Redux Toolkit** | State management toàn cục |
| **Highcharts** | Biểu đồ tài chính, kỹ thuật |
| **Axios** | HTTP client gọi API |
| **Formik + Yup** | Form & validation |
| **Ably** | Realtime (giá cổ phiếu live) |
| **react-toastify** | Thông báo toast |
| **dayjs** | Xử lý ngày tháng |

---

## 🧭 Các trang chính

| Route | Mô tả |
|-------|-------|
| `/` | Trang chủ / Landing page |
| `/signup` | Đăng ký tài khoản |
| `/profile` | Hồ sơ người dùng |
| `/payment` | Quản lý gói dịch vụ |
| `/dashboard` | Tổng quan thị trường |
| `/dashboard/co-phieu` | Danh sách cổ phiếu |
| `/dashboard/co-phieu/[symbol]/ho-so-doanh-nghiep` | Hồ sơ doanh nghiệp |
| `/dashboard/co-phieu/[symbol]/bao-cao-doanh-nghiep` | Báo cáo tài chính |
| `/dashboard/co-phieu/[symbol]/du-lieu-lich-su` | Dữ liệu lịch sử giá |
| `/dashboard/co-phieu/[symbol]/ket-qua-du-bao` | Kết quả dự báo AI |
| `/dashboard/co-phieu/[symbol]/so-sanh` | So sánh cổ phiếu |
| `/dashboard/dinh-gia-co-phieu` | Công cụ định giá DCF |
| `/dashboard/bieu-do-ky-thuat` | Biểu đồ kỹ thuật nâng cao |

---

## 🎨 Quy ước code

- **Formatter:** Prettier (chạy tự động theo cấu hình `.prettierrc`)
- **Extension khuyến nghị (VSCode):**
  - Tailwind CSS IntelliSense
  - Prettier – Code Formatter
- **Naming convention:** camelCase cho biến/hàm, PascalCase cho component
- **Import alias:** `@/src/...` thay thế đường dẫn tương đối

---

## 🌙 Dark Mode

Dark mode được quản lý qua Redux slice `darkmode` và lưu trạng thái vào `localStorage` với key `darkMode`. Tailwind sử dụng class `dark` trên `<body>` để áp dụng theme.

---

## 🔌 Realtime

Dự án sử dụng **Ably** để nhận dữ liệu giá cổ phiếu theo thời gian thực. Cần cấu hình Ably API key trong biến môi trường.

---

## 📝 Ghi chú phát triển

- Đây là **codebase FE only** — toàn bộ business logic xử lý dữ liệu tài chính, tính toán định giá, AI forecasting nằm ở phía Backend.
- Các slice Redux phần lớn đóng vai trò cache dữ liệu từ API, ít có business logic phức tạp phía FE.
- Khi thêm tính năng mới, tạo slice Redux riêng theo cấu trúc `redux/<FeatureName>/`.