# Component Architecture, Tính Năng Chính & Styling — Fintown FE

> **Dự án:** nextjs_mvp-master (Fintown Frontend)  
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Redux Toolkit · Highcharts  
> **Tài liệu liên quan:** `README.md` · `STATE_MANAGEMENT.md` · `ROUTING_AND_LAYOUT.md`

---

## 1. Kiến Trúc Component

### 1.1 Cây thư mục `src/components/`

```
src/components/
├── Providers.tsx              # Root provider: Redux + TopLoader
├── layout/                    # Shell components — dùng trong app/(dashboard)/layout.tsx
│   ├── Header.tsx             # Header trang landing (public)
│   ├── DashboardHeader.tsx    # Header dashboard (authenticated)
│   ├── Sidebar.tsx            # Sidebar cố định 70px, icon-only
│   ├── SidebarUser.tsx        # Sidebar profile page
│   ├── Footer.tsx             # Footer landing
│   └── FooterDashboard.tsx    # Footer dashboard
├── common/                    # Shared UI primitives — tái sử dụng ở nhiều nơi
│   ├── Loader.tsx             # BarsLoader, SpinerLoader
│   ├── InputSearch.tsx        # Ô tìm kiếm cổ phiếu (có dropdown + tab)
│   ├── SlidingTabs.tsx        # Tab bar với indicator sliding animation
│   ├── LogSlidingTabs.tsx     # Biến thể SlidingTabs cho trang Log
│   ├── TimeRangeButtons.tsx   # Nút chọn khung thời gian (1W / 1M / 3M…)
│   ├── Breadcrumbs.tsx        # Breadcrumb điều hướng trang cổ phiếu
│   ├── SelectTableOrChart.tsx # Dropdown chọn chế độ xem Biểu đồ / Bảng
│   ├── UpgradeNotice.tsx      # Overlay kêu gọi nâng cấp gói (blur backdrop)
│   ├── HoverArrowLink.tsx     # Link có mũi tên, dùng trong sidebar hover menu
│   ├── BtnSidebar.tsx         # Nút icon sidebar với trạng thái active
│   ├── NoneData.tsx           # Placeholder "Không có dữ liệu"
│   ├── Pagination.tsx         # Phân trang (được đặt ở organisms nhưng dùng chung)
│   ├── getCookie.tsx          # Utility đọc cookie (client-side)
│   └── parseJwt.jsx           # Decode JWT payload
├── form/
│   └── Login.tsx              # Form đăng nhập
├── charts/                    # Biểu đồ thuần — nhận props, không gọi Redux trực tiếp
│   ├── CardStockChart.tsx
│   ├── CompareChart.tsx
│   ├── DividendsChart.tsx
│   ├── HistoricalRevenueAndProfit.tsx
│   ├── MiniColumnChart.tsx
│   ├── ProgressCircle.tsx
│   ├── forecasting/           # Biểu đồ dự báo (nhiều chỉ số)
│   ├── MarketIndicatorChart/
│   ├── PriceStockLineChart/
│   ├── TechnicalChart/        # Highcharts Stock + Stock Tools
│   └── valuetion/             # Biểu đồ định giá
└── organisms/                 # Feature-level components — kết hợp charts + common + Redux
    ├── dashboard/             # Trang tổng quan thị trường
    ├── stocklist/             # Danh sách cổ phiếu
    ├── companyprofile/        # Hồ sơ doanh nghiệp
    ├── comparison/            # So sánh cổ phiếu
    ├── statement/             # Báo cáo tài chính
    ├── forecasting/           # Kết quả dự báo AI
    ├── technicalchart/        # Thanh công cụ biểu đồ kỹ thuật
    ├── technicalindicator/    # Chỉ báo kỹ thuật
    ├── transaction/           # Lịch sử giao dịch
    ├── valuetion/             # Công cụ định giá cổ phiếu
    ├── StockMetricsSummary.tsx
    ├── StockProfileSummary.tsx
    ├── Notifications.tsx
    ├── Pricing.tsx
    ├── DateRangePicker.tsx
    ├── Pagination.tsx
    ├── FAQ.tsx
    ├── CardSignup.tsx
    └── NotFoundComponent.tsx
```

### 1.2 Phân tầng component

```
Page (app/...)
   └── Layout (layout/*)
         └── Organism (organisms/*)
               ├── Chart (charts/*)
               └── Common (common/*)
```

| Tầng | Trách nhiệm | Kết nối Redux |
|------|------------|--------------|
| **Layout** | Shell, navigation, auth header | Có (Sidebar, DashboardHeader) |
| **Organism** | Tính năng hoàn chỉnh của một domain | Có |
| **Chart** | Render biểu đồ Highcharts / custom | Không (nhận props) |
| **Common** | UI primitives tái sử dụng | Có một phần (InputSearch, SlidingTabs...) |
| **Form** | Form xác thực | Có |

---

## 2. Các Component Quan Trọng

### 2.1 `Providers.tsx` — Root Provider

```tsx
// src/components/Providers.tsx
export default function Providers({ children }) {
  return (
    <>
      <TopLoader color="#25B770" height={4} showSpinner={false} />
      <Provider store={store}>
        {children}
      </Provider>
    </>
  );
}
```

- Bọc toàn bộ app bằng Redux `<Provider>`.
- `nextjs-toploader` hiển thị thanh tiến trình xanh (#25B770) khi chuyển route.
- Được mount tại `src/app/layout.tsx` (root layout).

---

### 2.2 `Sidebar.tsx` — Thanh điều hướng chính

**Vị trí:** Cố định bên trái, rộng 70px, toàn màn hình chiều cao.

**Tính năng:**
- Icon-only navigation với 5 nhóm tính năng chính.
- Hover tooltip dạng fly-out menu (dùng CSS `group-hover`) cho nhóm "Phân tích" và "Định giá".
- Toggle dark/light mode — đọc/ghi `localStorage.theme` và dispatch lên Redux `darkmode` slice.
- Khi toggle dark mode, đồng thời dispatch cập nhật màu sắc cho **13 biểu đồ forecasting** (upColorChart).

**Cấu trúc điều hướng:**

| Icon (Boxicons) | Đích | Redux button index |
|-----------------|------|--------------------|
| `bxs-grid` | `/dashboard/` | 0 |
| `bx-left-indent` | `/dashboard/co-phieu` | 2 |
| `bx-bar-chart` | Hover menu → các trang phân tích | 3 |
| `bxs-calculator` | Hover menu → các mô hình định giá | 6 |
| `bx-equalizer` | `/dashboard/bieu-do-ky-thuat/VCB/` | 5 |

**Fly-out menu mẫu:**
```tsx
<div className="relative group">
  <BtnSidebar class_icon="bx bx-bar-chart" active={selectedButton === 3} />
  <div className="absolute left-full top-0 hidden group-hover:block ...">
    <HoverArrowLink href="/dashboard/co-phieu/VCB/" label="Chỉ số kỹ thuật" />
    {/* ... */}
  </div>
</div>
```

---

### 2.3 `DashboardHeader.tsx` — Header Dashboard

**Vị trí:** Cố định top-0, offset trái 70px (= chiều rộng sidebar).

**Logic render theo context:**
```tsx
// Trang biểu đồ kỹ thuật → hiển thị MarketSummary thay vì InputSearch
{isTechnicalChart ? <MarketSummary /> : <InputSearch />}
```

**Tính năng auth:**
- Đọc cookie `token` → refresh token + fetch user profile khi mount.
- Hiển thị avatar, fullname, role badge (color-coded: `basic` = đỏ, `partner` = xanh dương, `pro` = xanh lá).
- Dropdown profile: liên kết đến thông tin cá nhân, quyền hạn, lịch sử thanh toán, đăng xuất.
- Tích hợp `NotificationsComponent` (bell icon + chấm đỏ real-time).
- Nút "Nâng cấp" → `/dashboard/dang-ky-goi`.

---

### 2.4 `InputSearch.tsx` — Tìm Kiếm Cổ Phiếu

**Luồng hoạt động:**

```
User nhập query
   → Nếu rỗng: hiển thị VN30 stocks (fetch một lần, cache Redux)
   → Nếu có query:
       1. Filter local từ VN30 cache
       2. Nếu không tìm thấy → fetchSearchStockByQuery (API)
   → Dropdown hiển thị kết quả (tối đa hiển thị, scroll 228px)
```

**Tab định tuyến trong dropdown:**
```
Báo cáo   → /dashboard/co-phieu/{symbol}/bao-cao-doanh-nghiep
Dự báo    → /dashboard/co-phieu/{symbol}/ket-qua-du-bao
Biểu đồ   → /dashboard/bieu-do-ky-thuat/{symbol}
Biến động → /dashboard/co-phieu/{symbol}
Định giá  → /dashboard/dinh-gia-co-phieu/{symbol}
Hồ sơ     → /dashboard/co-phieu/{symbol}/ho-so-doanh-nghiep
```

- Nhấn Enter → tự động navigate đến kết quả đầu tiên của tab đang active.
- Click outside → đóng dropdown (sử dụng `mousedown` event listener).

---

### 2.5 `SlidingTabs.tsx` — Tab Bar Animation

Component tab tái sử dụng với thanh indicator trượt mượt mà.

```tsx
<SlidingTabs
  onTabChange={(index, api) => { /* xử lý đổi tab */ }}
  tabs={[{ id: 0, label: 'Máy tính', api: '' }, ...]}
  gap="18px"
  startIndex={0}
  fontsize="14px"
/>
```

**Cơ chế indicator:**
```tsx
// Đọc offsetLeft của tab element → set transform translateX
useEffect(() => {
  const el = tabRefs.current[activeTab];
  if (el) {
    setIndicatorStyle({ transform: `translateX(${el.offsetLeft}px)` });
  }
}, [activeTab]);
```

**Tích hợp Redux:**  
Khi `selectedButton === 6` (trang Định giá), `SlidingTabs` tự động sync với `selectHistorySelectedButton` để nhảy đến tab "Lưu trữ định giá" khi user bấm xem chi tiết kịch bản.

---

### 2.6 `StockMetricsSummary.tsx` — Tóm Tắt Chỉ Số Cổ Phiếu

Hiển thị các chỉ số tài chính chính của một mã cổ phiếu:

- Giá kết phiên + % thay đổi (delta) với color-code: xanh (tăng), đỏ (giảm), vàng (đứng).
- Range bar Low–Close–High với indicator tam giác vị trí hiện tại.
- Grid 3 cột: Vốn hóa, P/E, ROE, Khối lượng, P/B, ROA, Số CP lưu hành, EPS.
- Tích hợp `ChangeStockInput` để đổi mã cổ phiếu tại chỗ.
- Loading state: hiển thị `BarsLoader` khi data chưa về.

---

### 2.7 `Notifications.tsx` — Hệ Thống Thông Báo Real-time

**Kiến trúc:**

```
Mount → fetchNotificationsToken (REST API)
      → fetchNotifications (REST API, limit=5)
      → Ably WebSocket subscribe("public:notification", "new-notification")
            → Khi nhận event: fetchNotifications lại, prepend vào list
```

**3 chế độ cập nhật state (`start` flag):**

| start | Hành động |
|-------|-----------|
| `1` | Tải thêm thông báo cũ → append xuống cuối |
| `2` | Có thông báo mới từ WebSocket → prepend lên đầu |
| `3` | Load lần đầu → replace toàn bộ |

- Chấm đỏ trên icon chuông khi có notification chưa đọc (`isReaded === false`).
- Click vào notification → đánh dấu đã đọc (PATCH API) + navigate đến trang dự báo của mã liên quan.

---

### 2.8 `ValuationCentral.tsx` — Trung Tâm Định Giá

Component điều phối toàn bộ màn hình định giá:

- **Tab "Máy tính"** → render `FairValueCalculator` (tính toán theo mô hình được chọn).
- **Tab "Lưu trữ định giá"** → render `PriceHistoryTab` (danh sách kịch bản đã lưu).
- **Popup lưu kịch bản** với animation slide-down, validation inline (tên ≤ 50 ký tự, ghi chú ≤ 1000 ký tự).
- Tự động tính `upside` (%) và `adjustedPrice` dựa trên kết quả định giá + giá thị trường hiện tại.

---

### 2.9 `UpgradeNotice.tsx` — Overlay Kêu Gọi Nâng Cấp

Overlay với `backdropFilter: blur(8px)` che phủ nội dung premium, hiển thị:

- Danh sách 4 quyền lợi của gói Pro.
- 2 option chọn gói (Monthly / Yearly) dạng radio card với highlight khi selected.
- Nút CTA → navigate đến trang payment theo `programId` lấy từ API pricing.
- Sử dụng `useRef` để trigger hidden `<Link>` thay vì `router.push` (để tránh re-render).

---

### 2.10 `Loader.tsx` — Loading States

Hai loại loader, render thuần CSS qua ID selector trong `globals.css`:

```tsx
export const BarsLoader = () => <div id="BarsLoader"></div>;
export const SpinerLoader = () => <div id="SpinerLoader"></div>;
```

- `BarsLoader`: 3 cột nhảy lên xuống (dùng cho loading data lớn như StockMetricsSummary).
- `SpinerLoader`: vòng tròn xoay (dùng cho loading nhỏ, inline).

---

## 3. Tính Năng Chính

### 3.1 Quản Lý Xác Thực (Auth)

| Điểm xử lý | Mô tả |
|------------|-------|
| `DashboardHeader.tsx` | Check cookie `token` → refreshToken + fetchUserProfile mỗi khi mount |
| `src/redux/auth/authSlice.ts` | State: `user`, `token`, `loading`, `error` |
| `getCookie.tsx` / `js-cookie` | Đọc cookie phía client |
| `parseJwt.jsx` | Decode JWT để lấy thông tin user trước khi gọi API |

Gói người dùng (`role`) được hiển thị color-coded:
- `basic` → `#FF6347` (cam đỏ)
- `partner` → `blue-500`
- `pro` / khác → `#25B770` (xanh Fintown)

### 3.2 Dark / Light Mode

**Cơ chế:**

```
localStorage.theme ('dark' | 'light')
   ↕ đồng bộ hai chiều
Redux darkmode slice (isDarkMode: boolean)
   ↓
Sidebar.tsx useEffect → document.body.classList.toggle('dark')
   ↓
Tailwind darkMode: 'class' → các class dark:* được kích hoạt
   ↓ (đồng thời)
upColorChart() → dispatch 13 actions cập nhật màu chart
```

**Quy ước màu trong Tailwind:**
```
Light mode: class thường (vd: bg-fintown-bg)
Dark mode:  class dark: (vd: dark:bg-fintown-bg-light)
```
> Chú ý: tên suffix `-light` trong token màu chỉ màu dùng cho **light mode**, không phải màu sáng hơn.

### 3.3 Tìm Kiếm Cổ Phiếu (Smart Search)

- Ưu tiên dữ liệu VN30 từ cache Redux (tránh gọi API thừa).
- Fallback sang API search khi query không match VN30.
- Dropdown hỗ trợ 6 tab điều hướng đến các trang khác nhau.
- Scroll virtualization: `max-h-[228px] overflow-y-scroll`.

### 3.4 Biểu Đồ Kỹ Thuật (Technical Chart)

- Dựa trên **Highcharts Stock** với Stock Tools (vẽ tay, thêm indicator).
- Các CSS override toàn bộ giao diện Highcharts popup trong `globals.css` (khoảng 150+ dòng) để match Fintown dark theme.
- `TimeRangeButtons` dispatch `fetchPriceStocksNoVolume` với các tham số `start/end/interval/limit` tương ứng từng khung thời gian.
- `MarketSummary` hiển thị thay thế InputSearch khi ở trang biểu đồ kỹ thuật.

### 3.5 Công Cụ Định Giá (Valuation)

7 mô hình định giá, mỗi mô hình là một route riêng:

| Route | Mô hình |
|-------|---------|
| `chiet-khau-dong-tien` | DCF – Chiết khấu dòng tiền |
| `chiet-khau-co-tuc` | DDM – Chiết khấu cổ tức |
| `benjamin-graham` | Graham Formula |
| `he-so-pe` | P/E Valuation |
| `he-so-pb` | P/B Valuation |
| `phuong-phap-peg` | PEG Ratio |
| `mo-hinh-capm` | CAPM |

- `SliderWithValue` + `UpsideRangeSlider`: input tham số với giá trị upside động.
- `ValuationResult`: hiển thị kết quả + % upside so với giá thị trường.
- `FilterTimeScenariors` + `QuarterYearSelector`: chọn kỳ báo cáo làm cơ sở tính toán.

### 3.6 Thông Báo Real-time

- **Ably WebSocket** cho push notification (tích hợp tại `Notifications.tsx`).
- Token Ably được lấy từ backend REST (`fetchNotificationsToken`).
- Unread badge (chấm đỏ) tự động ẩn/hiện theo trạng thái `isReaded`.

### 3.7 Hệ Thống Gói / Pricing

- `Pricing.tsx`: Trang so sánh 3 gói (Basic / Pro Monthly / Pro Yearly), data lấy từ API `portal.fintown.software/api/general/pricing`.
- `UpgradeNotice.tsx`: Overlay inline khi user cố truy cập tính năng premium.
- `CardSignup.tsx`: Card kêu gọi đăng ký tài khoản.

---

## 4. Styling

### 4.1 Công Nghệ Styling

| Công cụ | Mục đích |
|---------|---------|
| **Tailwind CSS** | Primary utility styling |
| `tailwind.config.js` | Custom design tokens (`fintown.*`) |
| `src/styles/globals.css` | Base styles, CSS animations, Highcharts overrides |
| **Boxicons** | Icon library (`bx bx-*`, import qua CDN/head) |
| **Inter** (Google Fonts) | Font chính, khai báo trong Tailwind `fontFamily.inter` |

### 4.2 Design Token System (`fintown.*`)

Toàn bộ màu sắc được định nghĩa trong `tailwind.config.js` theo namespace `fintown`:

**Màu brand:**
```
fintown-pr9: #25B770   // Màu primary xanh lá — CTA, active state, progress bar
```

**Background:**
```
fintown-bg              dark: #181A20  |  light: #FFFFFF
fintown-bg-stn          dark: #1E2329  |  light: #FFFFFF   (section/card background)
fintown-bg-card         dark: #2B3139  |  light: #333545
```

**Text:**
```
fintown-txt-1           dark: #EAECEF  |  light: #101010   (heading, primary text)
fintown-txt-2           #848E9C                             (muted, secondary text)
fintown-txt-3           dark: #5A979E  |  light: #202630
```

**Border:**
```
fintown-br              dark: #2B3139  |  light: #D9D9D9
fintown-br-btn          dark: #2B3139  |  light: #848E9C
```

**Button states:**
```
fintown-btn-1..5        (nền button ở các trạng thái)
fintown-btn-active-1    dark: #32A071  |  light: #25B770   (active button bg)
fintown-btn-active-2    dark: #EAECEF  |  light: #EAECEF
```

**Trạng thái giao dịch:**
```
fintown-stt-buy:  #0ECB81   (tăng — xanh)
fintown-stt-sell: #F6465D   (giảm — đỏ)
fintown-stt-hold: #F0B90B   (đứng giá — vàng)
```

**Màu biểu đồ:**
```
fintown-chart-1: #2B3139
fintown-chart-2: #656F79
fintown-chart-3: #D9D9D9
fintown-chart-4: #8A47FF   (purple)
fintown-chart-5: #FFD147   (yellow)
fintown-chart-6: #16C784   (green)
fintown-chart-7: #E14040   (red)
```

### 4.3 Quy Ước Dùng Dark Mode

```tsx
// Pattern chuẩn cho mọi component
className="bg-fintown-bg dark:bg-fintown-bg-light"
className="text-fintown-txt-1 dark:text-fintown-txt-1-light"
className="border-fintown-br dark:border-fintown-br-light"
```

> Token gốc (không suffix) = dark mode. Token `-light` = light mode.  
> Điều này ngược với convention thông thường — cần chú ý khi đọc code.

### 4.4 Custom CSS trong `globals.css`

**Global base:**
```css
body, main { @apply font-inter; }
```

**Scrollbar styling:**
- `body`: scrollbar 6px, thumb màu `#16C784`, track `#181A20`.
- `.custom-scrollbarmini`: 8px, thumb `rgba(255,255,255,0.2)`.
- `.custom-scrollbarmini2`: 4px, thumb `rgb(96,112,103)`, track transparent.

**Utility classes:**
```css
.anchor-section     { scroll-margin-top: 80px; }   /* offset scroll cho fixed header */
.truncate-text      { -webkit-line-clamp: 2; }      /* clamp text 2 dòng */
```

**CSS-only Loaders:**
```css
#BarsLoader  { /* 3-bar wave animation */ }
#SpinerLoader { /* circular spinner */ }
```

**Highcharts UI overrides** (~200 dòng):
- Popup `.highcharts-no-tooltip`: background `#1E2329`, border `#2B3139`, bo góc 8px.
- Input/Select trong popup: border `#2B3139`, focus highlight `#25B770`.
- List indicator: scrollbar thumb màu `#25B770`.
- Nút confirm/save: background `rgb(37 183 112)`, hover `rgb(43, 209, 129)`.
- Ẩn nút fullscreen: `li.highcharts-full-screen { display: none; }`.

### 4.5 Container & Layout

```js
// tailwind.config.js
container: {
  center: true,
  padding: "2rem",
  screens: { "2xl": "1400px" }
}
```

Layout dashboard sử dụng fixed positioning:
- Sidebar: `fixed left-0 w-[70px] h-screen`
- Header: `fixed top-0 w-[calc(100%-70px)] ml-[70px] h-[70px]`
- Main content: `ml-[70px] pt-[70px]`

### 4.6 TopLoader

```tsx
// Providers.tsx
<TopLoader color="#25B770" height={4} showSpinner={false} />
```

Thanh loading route chuyển trang màu brand (#25B770), cao 4px, không có spinner góc.

---

## 5. Patterns & Conventions

### 5.1 Conditional color dựa trên delta (giá cổ phiếu)

```tsx
// Pattern tái sử dụng ở nhiều component
const colorClass = 
  delta === undefined ? 'bg-fintown-stt-hold'
  : delta < 0         ? 'bg-fintown-stt-sell'
  : delta > 0         ? 'bg-fintown-stt-buy'
  :                     'bg-fintown-stt-hold';
```

### 5.2 Loading state pattern

```tsx
if (data === null) {
  return <div className='flex justify-center items-center h-[428px]'>
    <BarsLoader />
  </div>;
}
// render bình thường khi data đã về
```

### 5.3 Click-outside handler pattern

```tsx
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

Được sử dụng nhất quán trong: `InputSearch`, `SelectTableOrChart`, `DashboardHeader`, `Notifications`.

### 5.4 Số tiền / số lượng

```tsx
// Tất cả số lớn format bằng toLocaleString('en-US') → dấu phẩy phân cách nghìn
NowData?.close.toLocaleString('en-US')

// Giá gói: ≥1000 → hiển thị "k" (vd: 299k)
const formatPrice = (price) => price >= 1000 ? (price / 1000).toFixed(0) + 'k' : price.toString();
```

---

## 6. Sơ Đồ Tổng Thể

```
┌────────────────────────────────────────────────────────────────┐
│                         Browser                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Providers.tsx (Redux Store + TopLoader)                │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  Layout                                           │  │   │
│  │  │  ┌──────────┐  ┌──────────────────────────────┐   │  │   │
│  │  │  │ Sidebar  │  │      DashboardHeader         │   │  │   │
│  │  │  │ (70px)   │  │  InputSearch | MarketSummary │   │  │   │
│  │  │  │ darkmode │  │  UserMenu | Notifications    │   │  │   │
│  │  │  └──────────┘  └──────────────────────────────┘   │  │   │
│  │  │  ┌─────────────────────────────────────────────┐  │  │   │
│  │  │  │  Page Content                               │  │  │   │
│  │  │  │  ┌────────────────┐  ┌──────────────────┐   │  │  │   │
│  │  │  │  │   Organisms    │  │     Charts       │   │  │  │   │
│  │  │  │  │ (domain logic) │  │  (Highcharts /   │   │  │  │   │
│  │  │  │  │                │  │   custom SVG)    │   │  │  │   │
│  │  │  │  └────────────────┘  └──────────────────┘   │  │  │   │
│  │  │  │  ┌──────────────────────────────────────┐   │  │  │   │
│  │  │  │  │  Common (SlidingTabs, TimeRange, ...)│   │  │  │   │
│  │  │  │  └──────────────────────────────────────┘   │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```
