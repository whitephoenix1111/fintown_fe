# Routing & Layout – Fintown FE

> **Phạm vi tài liệu:** Toàn bộ cấu trúc routing và layout hierarchy của codebase FE (`src/app/`).  
> Tài liệu này mô tả cách Next.js App Router được tổ chức, layout lồng nhau, dynamic routes,
> auth guard thực tế, và mối liên hệ giữa routing với Redux state.

---

## 1. Tổng quan – App Router

Dự án dùng **Next.js 14 App Router** (không phải Pages Router). Toàn bộ routing nằm trong `src/app/`.

Cây thư mục routing:

```
src/app/
├── layout.tsx                          ← Root layout (toàn bộ app)
├── not-found.tsx                       ← Trang 404 toàn cục
│
├── (main)/                             ← Route group: Landing page
│   ├── layout.tsx                      ← Layout có Header + Footer công khai
│   └── page.tsx                        ← Trang chủ (/) – login form + hero
│
├── (user)/                             ← Route group: Luồng người dùng
│   ├── signup/                         ← /signup – Đăng ký tài khoản
│   ├── profile/                        ← /profile – Hồ sơ cá nhân
│   └── payment/                        ← /payment – Quản lý gói dịch vụ
│
└── dashboard/                          ← Khu vực chính sau đăng nhập
    ├── layout.tsx                      ← Layout có Sidebar + DashboardHeader
    ├── page.tsx                        ← /dashboard – Tổng quan thị trường
    ├── co-phieu/
    │   ├── page.tsx                    ← /dashboard/co-phieu – Danh sách CK
    │   └── [symbol]/                   ← Dynamic route theo mã CK
    │       ├── layout.tsx              ← Layout tab-bar cho mã CK
    │       ├── page.tsx                ← /dashboard/co-phieu/[symbol]/ – Chỉ số kỹ thuật
    │       ├── bao-cao-doanh-nghiep/   ← Tab 1: Báo cáo tài chính
    │       ├── ho-so-doanh-nghiep/     ← Tab 2: Hồ sơ doanh nghiệp
    │       ├── ket-qua-du-bao/         ← Tab 3: Kết quả dự báo AI
    │       ├── du-lieu-lich-su/        ← Tab 4: Dữ liệu lịch sử giá
    │       └── so-sanh/                ← Tab 5: So sánh cổ phiếu
    ├── dinh-gia-co-phieu/              ← /dashboard/dinh-gia-co-phieu – Công cụ DCF
    ├── bieu-do-ky-thuat/               ← /dashboard/bieu-do-ky-thuat – Tech chart
    ├── dang-ky-goi/                    ← /dashboard/dang-ky-goi – Gói dịch vụ
    ├── ve-chung-toi/
    ├── lien-he/
    └── phap-ly/
```

**Lưu ý về Route Groups:** Tên thư mục trong dấu `()` (ví dụ `(main)`, `(user)`) là **route groups** —
chúng không xuất hiện trong URL, chỉ dùng để nhóm layout khác nhau. Tức là:
- `(main)/page.tsx` → URL là `/`
- `(user)/signup/page.tsx` → URL là `/signup`

---

## 2. Layout Hierarchy

### Tầng 1 – Root Layout (`src/app/layout.tsx`)

Áp dụng cho **toàn bộ app**. Không render UI, chỉ thiết lập:

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        {/* Boxicons CDN, Highcharts CSS, favicon */}
      </head>
      <body className="font-inter custom-scrollbar">
        <Providers>   {/* Redux Provider + NextJS TopLoader */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

`Providers` là component duy nhất inject Redux store vào cây component,
đồng thời render thanh loading xanh ở top (`nextjs-toploader`, màu `#25B770`).

### Tầng 2a – Main Layout (`src/app/(main)/layout.tsx`)

Dùng cho trang landing (`/`). Layout đơn giản:

```
┌─────────────────────────────┐
│  Header (public)            │  ← Header.tsx – không có auth
├─────────────────────────────┤
│  <main className="mt-[70px]"│
│    {children}               │
│  </main>                    │
├─────────────────────────────┤
│  Footer                     │
└─────────────────────────────┘
```

### Tầng 2b – Dashboard Layout (`src/app/dashboard/layout.tsx`)

Layout chính sau khi đăng nhập. **Client Component** vì cần đọc `localStorage` và `usePathname`:

```
┌───┬──────────────────────────────────┐
│   │  DashboardHeader (fixed, 70px)   │
│ S ├──────────────────────────────────┤
│ i │                                  │
│ d │  <main                           │
│ e │    className="ml-[70px] pt-[70px]│
│ b │    bg-fintown-bg dark:..."        │
│ a │  >                               │
│ r │    {children}                    │
│   │                                  │
│   │    {shouldShowFooter &&           │
│   │      <FooterDashboard />}         │
│   │                                  │
└───┴──────────────────────────────────┘
```

**Logic điều kiện Footer** — một số trang không hiển thị Footer:

```ts
// Các route dưới đây không có footer
const routesWithoutFooter = [
  '/dashboard/co-phieu',
  '/dashboard/dinh-gia-co-phieu',
  '/dashboard/bieu-do-ky-thuat'
];

// Ngoài ra, trang hồ sơ doanh nghiệp cũng không có footer
const isStockProfilePage = pathname.startsWith('/dashboard/co-phieu/')
  && pathname.endsWith('/ho-so-doanh-nghiep');

const shouldShowFooter = !(isRouteWithoutFooter || isStockProfilePage);
```

**Lý do thiết kế:** Các trang biểu đồ và dữ liệu cần tối đa diện tích màn hình,
không phù hợp với footer.

### Tầng 3 – Stock Symbol Layout (`src/app/dashboard/co-phieu/[symbol]/layout.tsx`)

Layout đặc biệt nhất trong app. Hiển thị:
1. Breadcrumbs
2. Header thông tin mã CK (`StockProfileSummary` + `StockMetricsSummary`)
3. Tab bar điều hướng 6 sub-pages
4. `{children}` — nội dung sub-page

```
┌──────────────────────────────────────────┐
│  Breadcrumbs                             │
├──────────────────────────────────────────┤
│  StockProfileSummary  │ StockMetricsSummary│
├──────────────────────────────────────────┤
│  [Kỹ thuật][Báo cáo][Hồ sơ][Dự báo][LS][So sánh] ← Tab bar
├──────────────────────────────────────────┤
│  {children} ← nội dung tab đang active  │
└──────────────────────────────────────────┘
```

---

## 3. Dynamic Route `[symbol]`

### Validation mã CK

Layout của `[symbol]` thực hiện validate ngay khi mount — trước khi render bất kỳ nội dung nào:

```ts
// src/app/dashboard/co-phieu/[symbol]/layout.tsx
const symbol = params.symbol.toUpperCase();
const isValidSymbol = /^[A-Z]{3}$/.test(symbol); // Phải là đúng 3 chữ cái in hoa
if (!isValidSymbol) {
    notFound(); // → Chuyển về not-found.tsx toàn cục
}
```

**Quy tắc validation hiện tại:** Mã CK phải đúng **3 ký tự, chữ cái Latin hoa** (VCB, HPG, VNM...).
Nếu URL là `/dashboard/co-phieu/vcb` vẫn hợp lệ vì được `.toUpperCase()` trước khi test.

### Fetch dữ liệu tại Layout

Layout `[symbol]` thực hiện **một lần fetch** `ProfileSummary` dùng chung cho tất cả sub-pages:

```ts
const hasFetched = useRef(false);

useEffect(() => {
    if (!hasFetched.current) {
        dispatch(fetchProfileSummaries({ symbol }));
        hasFetched.current = true;  // Chỉ fetch 1 lần dù re-render
    }
}, [symbol, dispatch]);
```

`hasFetched` dùng `useRef` (không phải `useState`) để tránh trigger re-render khi flag thay đổi.
Đây là pattern tối ưu cho fetch-once-on-mount.

### Tab navigation và Redux state

Tab bar ở layout `[symbol]` đồng bộ active state vào Redux (`stockPage.selectedButton`):

| Index | Route | Tên tab |
|-------|-------|---------|
| 0 | `/dashboard/co-phieu/[symbol]/` | Chỉ số kỹ thuật |
| 1 | `/dashboard/co-phieu/[symbol]/bao-cao-doanh-nghiep` | Báo cáo doanh nghiệp |
| 2 | `/dashboard/co-phieu/[symbol]/ho-so-doanh-nghiep` | Hồ sơ doanh nghiệp |
| 3 | `/dashboard/co-phieu/[symbol]/ket-qua-du-bao` | Kết quả dự báo |
| 4 | `/dashboard/co-phieu/[symbol]/du-lieu-lich-su` | Dữ liệu lịch sử |
| 5 | `/dashboard/co-phieu/[symbol]/so-sanh` | So sánh |

Mỗi sub-page gọi hook `useSetSelectedButtonStockPage(index)` khi mount để đánh dấu tab đang active.
Xem `src/redux/hooks/useButtonstockPage.ts` và `STATE_MANAGEMENT.md §7`.

---

## 4. Auth Guard – Cơ chế bảo vệ Route

**Fintown FE không dùng middleware Next.js** (`middleware.ts`) để bảo vệ route.  
Thay vào đó, auth guard được implement trực tiếp trong các page component qua Redux + `useEffect`.

### Guard trên trang chủ `/` (redirect khi đã đăng nhập)

```ts
// src/app/(main)/page.tsx
const token = useAppSelector(selectToken);
const router = useRouter();

useEffect(() => {
    if (token) {
        router.push('/dashboard'); // Đã login → đẩy vào dashboard
    }
}, [router]);
```

`selectToken` ưu tiên lấy từ Redux state, fallback sang Cookie — xem chi tiết tại `STATE_MANAGEMENT.md §6.1`.

### Guard trên Dashboard Header (kiểm tra token và refresh)

`DashboardHeader` chạy logic này mỗi khi mount (tức là mỗi lần vào bất kỳ trang dashboard):

```ts
// src/components/layout/DashboardHeader.tsx
useEffect(() => {
    const checkAndRefreshToken = async () => {
        const token = Cookies.get('token');
        if (token) {
            await Promise.all([
                dispatch(refreshToken()).unwrap(),
                dispatch(fetchUserProfile()).unwrap(),
            ]);
        }
        setIsTokenChecked(true);
    };
    checkAndRefreshToken();
}, [dispatch]);
```

Luồng:
1. Đọc token từ Cookie
2. Nếu có token → song song `refreshToken` + `fetchUserProfile`
3. Cập nhật Redux `auth.user` với dữ liệu mới nhất từ API
4. Set `isTokenChecked = true` → ẩn loading spinner, hiển thị UI

**Lưu ý quan trọng:** Nếu không có token trong Cookie, header vẫn render bình thường
nhưng hiển thị nút "Đăng nhập" / "Đăng ký" thay vì thông tin user. Không có redirect cứng
về trang login ở tầng layout — các trang dashboard có thể xem được một phần mà không cần login.
Các tính năng cần auth (fetch dữ liệu có `Authorization`) sẽ fail ở tầng API và xử lý lỗi qua Redux.

### Hiển thị theo role user

Header hiển thị màu role khác nhau:

```ts
// Trong DashboardHeader
className={`
    ${user?.role === 'basic'   ? 'text-[#FF6347]'      : ''}  // Cam
    ${user?.role === 'partner' ? 'text-blue-500'        : ''}  // Xanh
    ${                           'text-fintown-pr9'     }       // Xanh lá (default/premium)
`}
```

---

## 5. Sidebar và điều hướng chính

Sidebar là **fixed**, `z-50`, `width: 70px`, nằm bên trái màn hình. Đây là điều hướng cấp 1 của toàn dashboard.

| Icon | Route mặc định | Redux index | Mô tả |
|------|---------------|-------------|-------|
| `bx-grid` | `/dashboard/` | 0 | Tổng quan |
| `bx-left-indent` | `/dashboard/co-phieu` | 2 | Danh sách cổ phiếu |
| `bx-bar-chart` | Hover menu | 3 | Sub-menu CK (dùng VCB làm mặc định) |
| `bx-calculator` | Hover menu | 6 | Sub-menu Định giá (dùng VCB làm mặc định) |
| `bx-equalizer` | `/dashboard/bieu-do-ky-thuat/VCB/` | 5 | Biểu đồ kỹ thuật |

**Đặc điểm thiết kế Sidebar:**
- Sidebar icon `bx-bar-chart` và `bx-calculator` **không navigate trực tiếp** — chúng hiển thị dropdown khi hover với danh sách sub-routes hardcode mã `VCB`.
- Sidebar tự xử lý **toàn bộ dark mode**: đọc `localStorage`, sync vào Redux `darkmode`, cập nhật `document.body.classList`, và cập nhật màu cho **13 biểu đồ Highcharts** cùng lúc thông qua `ForecastingChartConfig` slices.

### Tương tác Sidebar ↔ `[symbol]` Layout

Sidebar dùng `SiderBar` Redux slice (key `siderBar`) trong khi `[symbol]` layout dùng `StockPage` Redux slice (key `stockPage`) — **hai slice riêng biệt** cho hai cấp điều hướng khác nhau:

```
siderBar.selectedButton   → Sidebar icon nào đang active (cấp 1)
stockPage.selectedButton  → Tab nào đang active trong trang CK (cấp 2)
```

---

## 6. Luồng điều hướng người dùng

### Người dùng chưa đăng nhập

```
/ (trang chủ)
  ├── Form đăng nhập ở trang chủ (không redirect ra trang riêng)
  └── Link → /signup
           ├── Bước 1: Nhập email (validate qua Mailgun API)
           ├── Bước 2: Đặt mật khẩu
           └── Bước 3: Đặt họ tên → Đăng ký xong
```

**Lưu ý:** Form đăng nhập được render **trực tiếp trên trang chủ** (`LoginForm` component),
không phải trang riêng `/login`. Sau khi login thành công, Redux `auth.token` được set
và `useEffect` ở trang chủ redirect về `/dashboard`.

### Người dùng đã đăng nhập

```
/dashboard (tổng quan)
  ├── /dashboard/co-phieu (danh sách)
  │     └── /dashboard/co-phieu/[VCB|HPG|...] (trang CK)
  │           ├── / (Chỉ số kỹ thuật) ← tab 0
  │           ├── /bao-cao-doanh-nghiep  ← tab 1
  │           ├── /ho-so-doanh-nghiep    ← tab 2
  │           ├── /ket-qua-du-bao        ← tab 3
  │           ├── /du-lieu-lich-su       ← tab 4
  │           └── /so-sanh               ← tab 5
  ├── /dashboard/dinh-gia-co-phieu/[symbol]/[method]
  ├── /dashboard/bieu-do-ky-thuat/[symbol]
  └── /profile/information | /profile/permission | /profile/history
```

---

## 7. Signup – Multi-step Form (không dùng routing)

Trang `/signup` là một multi-step form được quản lý bằng **local state** (`useState`), không dùng routing:

```ts
// Trạng thái điều hướng nội bộ
const [tienTrinh, setTienTrinh] = useState('email'); // 'email' | 'loading' | 'password' | 'fullname'
```

| Giá trị `tienTrinh` | Component render |
|---|---|
| `'email'` | Form nhập email + validate real-time |
| `'loading'` | Spinner (1 giây, giả lập verify) |
| `'password'` | Component `<Password />` |
| `'fullname'` | Component `<Setfullname />` |

Flow verify email: validate regex trước (client-side), sau đó gọi **Mailgun API** từ Redux thunk `verifyEmail`
(xem `STATE_MANAGEMENT.md §6.1`).

---

## 8. `not-found.tsx`

File `src/app/not-found.tsx` là trang 404 toàn cục của Next.js App Router.
Được trigger bởi:
- URL không khớp bất kỳ route nào
- Gọi `notFound()` từ `next/navigation` trong code (ví dụ: khi `[symbol]` không hợp lệ)

---

## 9. Những điểm cần lưu ý khi phát triển

### Thêm trang mới trong Dashboard

```
1. Tạo thư mục: src/app/dashboard/ten-tinh-nang/
2. Tạo file: page.tsx
3. Trang tự động được bảo bọc bởi DashboardLayout (Sidebar + Header)
4. Thêm link vào Sidebar nếu cần điều hướng cấp 1
5. Footer tự hiển thị trừ khi thêm route vào routesWithoutFooter trong dashboard/layout.tsx
```

### Thêm sub-page cho `[symbol]`

```
1. Tạo thư mục: src/app/dashboard/co-phieu/[symbol]/ten-sub-page/
2. Tạo file: page.tsx
3. Gọi hook useSetSelectedButtonStockPage(N) với index mới ở đầu page
4. Thêm Link + button vào tab bar trong [symbol]/layout.tsx
5. Cập nhật bảng index trong STATE_MANAGEMENT.md §7
```

### Không dùng `useDispatch`/`useSelector` trực tiếp

Header hiện đang dùng `useDispatch<AppDispatch>()` và `useSelector<RootState, ...>()` trực tiếp —
đây là exception so với quy ước chung. Khi sửa `DashboardHeader.tsx`, chuyển sang
`useAppDispatch()` / `useAppSelector()` để đồng nhất codebase.

---

## 10. Sơ đồ Layout lồng nhau

```
RootLayout (app/layout.tsx)
│   Redux Provider, TopLoader, <html>, <body>
│
├── MainLayout (app/(main)/layout.tsx)          → URL: /
│   │   Header công khai + Footer
│   └── page.tsx (HomePage)
│         Auth guard: redirect → /dashboard nếu có token
│
├── (user) group (không có layout riêng)        → URL: /signup, /profile, /payment
│   └── signup/page.tsx
│         Multi-step form: email → password → fullname
│
└── DashboardLayout (app/dashboard/layout.tsx)  → URL: /dashboard/**
    │   Sidebar (fixed 70px) + DashboardHeader (fixed 70px top)
    │   Auth check: refreshToken + fetchUserProfile tại Header
    │   Conditional Footer
    │
    ├── page.tsx (Dashboard overview)
    │
    ├── co-phieu/page.tsx
    │
    ├── co-phieu/[symbol]/layout.tsx            → URL: /dashboard/co-phieu/[VCB]/...
    │   │   Validate symbol → notFound() nếu invalid
    │   │   Breadcrumbs + StockProfileSummary + StockMetricsSummary
    │   │   Tab bar (6 tabs) ↔ Redux stockPage.selectedButton
    │   │   Fetch ProfileSummary (once)
    │   │
    │   ├── page.tsx          (tab 0: Chỉ số kỹ thuật)
    │   ├── bao-cao-.../      (tab 1)
    │   ├── ho-so-.../        (tab 2)
    │   ├── ket-qua-.../      (tab 3)
    │   ├── du-lieu-.../      (tab 4)
    │   └── so-sanh/          (tab 5)
    │
    ├── dinh-gia-co-phieu/
    ├── bieu-do-ky-thuat/
    └── ...các trang tĩnh
```

---

*Tài liệu này phản ánh trạng thái routing tại thời điểm khảo sát.
Cập nhật khi thêm route mới hoặc thay đổi layout hierarchy.*
