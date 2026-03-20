# State Management – Fintown FE

> **Phạm vi tài liệu:** Toàn bộ lớp Redux của codebase FE (`src/redux/`).  
> Tài liệu này mô tả kiến trúc, các pattern được dùng nhất quán, phân nhóm slice,
> và hướng dẫn đọc/viết state đúng cách khi phát triển tính năng mới.

---

## 1. Tổng quan

Fintown FE sử dụng **Redux Toolkit (RTK)** làm giải pháp state management toàn cục.
Toàn bộ state được tập trung vào một Redux store duy nhất, cấu hình tại `src/redux/store.ts`.

Lý do chọn RTK thay vì Context API hay Zustand:
- Dữ liệu tài chính (báo cáo, định giá, biểu đồ) cần cache tập trung và tái sử dụng giữa nhiều component không liên quan trong cây component.
- Các tác vụ async phức tạp (fetch → loading → success/error) được chuẩn hóa bằng `createAsyncThunk`.
- DevTools hỗ trợ tốt cho việc debug dữ liệu tài chính nhiều tầng.

```
src/redux/
├── store.ts              ← Điểm khởi tạo store, combineReducers
├── hooks/                ← Typed hooks + custom hooks theo tính năng
│   ├── useAppStore.ts    ← useAppDispatch, useAppSelector
│   ├── useButtonsiderBar.ts
│   ├── useButtonstockPage.ts
│   ├── useButtonTabScenario.ts
│   └── useButtonValuetionPage.ts
├── auth/                 ← Xác thực, user profile, token
├── darkmode/             ← Theme toàn cục
├── WatchList/            ← Watchlist lưu vào localStorage
├── Notifications/        ← Thông báo realtime (combineReducers nội bộ)
└── ...                   ← Các slice theo từng domain tính năng
```

---

## 2. Cấu hình Store

File: `src/redux/store.ts`

Store được cấu hình với `configureStore` từ RTK. Một số reducer domain phức tạp dùng
`combineReducers` nội bộ trước khi đăng ký vào store tổng:

```ts
// Ví dụ: tickerList có hai slice con
const tickerListReducer = combineReducers({
  TickerList: TickerListReducer,
  Pagination: tickerListPaginationReducers,
});

const store = configureStore({
  reducer: {
    tickerList: tickerListReducer,   // state.tickerList.TickerList, state.tickerList.Pagination
    auth: authReducer,               // state.auth
    darkmode: DarkModeReducer,       // state.darkmode
    // ...
  },
});
```

**Hai type export quan trọng** — luôn dùng thay vì suy diễn thủ công:

```ts
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 3. Typed Hooks

File: `src/redux/hooks/useAppStore.ts`

Không bao giờ dùng `useDispatch` / `useSelector` trực tiếp từ `react-redux`.
Luôn dùng hai hook đã typed:

```ts
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks/useAppStore';

// Trong component:
const dispatch = useAppDispatch();
const data = useAppSelector(selectFinancialStatementsData);
```

Lý do: `useAppDispatch` trả về `AppDispatch` có type của toàn bộ thunk,
`useAppSelector` nhận `RootState` nên selector tự động được type-check.

---

## 4. Phân nhóm Slice

Store hiện có **~45 slice** (tính cả slice con trong combineReducers). Được phân thành 7 nhóm chức năng:

### 4.1 Hệ thống & UI chung

| Slice (key trong store) | File | Mô tả |
|---|---|---|
| `darkmode` | `darkmode/darkmodeSlice.ts` | Toggle/set dark mode toàn cục, đồng bộ với `localStorage` qua component |
| `siderBar` | `SiderBar/siderBarSlice.ts` | Trạng thái mở/đóng sidebar |
| `stockPage` | `StockPage/stockPageSlice.ts` | Tab đang active trên trang cổ phiếu |
| `btnNextPrevReport` | `BtnNextPrevReportPage/` | Nút prev/next phân trang báo cáo |
| `faq` | `FAQ/faqSlice.ts` | Dữ liệu FAQ |

### 4.2 Xác thực & Người dùng

| Slice | File | Mô tả |
|---|---|---|
| `auth` | `auth/authSlice.ts` | User, token, loading, error. Xem §5 để biết chi tiết. |

### 4.3 Dữ liệu thị trường & Cổ phiếu

| Slice | File | Mô tả |
|---|---|---|
| `tickerList.TickerList` | `TickerList/tickerListSlice.ts` | Danh sách mã CK |
| `tickerList.Pagination` | `TickerList/PaginationSlice.ts` | Phân trang danh sách |
| `tickerListOverview` | `TickerListOverview/` | Overview ticker list trang chủ dashboard |
| `cardStock.topGainer` | `CardStock/topGainerSlice.ts` | Top cổ phiếu tăng mạnh |
| `cardStock.industry` | `CardStock/industrySlice.ts` | Phân loại ngành |
| `cardStock.revenue` | `CardStock/revenueSlice.ts` | Doanh thu nhanh |
| `priceStock` | `PriceStock/priceStockSlice.ts` | Giá cổ phiếu hiện tại |
| `priceInsights` | `PriceInsights/priceInsightsSlice.ts` | Phân tích xu hướng giá |
| `topStocks` | `TopStocks/topStocksSlice.ts` | Danh sách cổ phiếu nổi bật |
| `searchVn30Stock` | `SearchAndChangeStock/` | Tìm kiếm & chuyển mã CK |
| `watchlist` | `WatchList/watchlistSlice.ts` | Watchlist cá nhân, persist vào `localStorage` |

### 4.4 Hồ sơ Doanh nghiệp

| Slice | File | Mô tả |
|---|---|---|
| `profileSummary` | `ProfileSummary/profileSummarySlice.ts` | Tóm tắt hồ sơ doanh nghiệp |
| `companyDescription` | `CompanyDescription/` | Mô tả chi tiết công ty |
| `officers` | `Officers/officersSlice.ts` | Danh sách lãnh đạo |
| `holders` | `Holders/holdersSlice.ts` | Cơ cấu cổ đông |
| `companyTransaction` | `CompanyTransactions/` | Giao dịch nội bộ |
| `dividends` | `Dividends/dividendsSlice.ts` | Lịch sử cổ tức |

### 4.5 Dữ liệu Tài chính & Báo cáo

| Slice | File | Mô tả |
|---|---|---|
| `financialStatement` | `FinancialStatement/` | Báo cáo tài chính (IS/BS/CF) |
| `financialMetric` | `FinancialMetric/` | Chỉ số tài chính |
| `reportPage` | `ReportPage/reportPageSlice.ts` | UI state trang báo cáo |
| `historicalDataPage.Historical` | `HistoricalDataPage/historicalDataPageSlice.ts` | Dữ liệu giá lịch sử |
| `historicalDataPage.Pagination` | `HistoricalDataPage/PaginationSlice.ts` | Phân trang dữ liệu lịch sử |
| `bestNPM` | `BestNPM/bestNPMSlice.ts` | Chỉ số NPM tốt nhất ngành |
| `comparison` | `Comparison/comparisonSlice.ts` | So sánh cổ phiếu |
| `searchStockComparison` | `SearchStockComparison/` | Tìm kiếm CK cho so sánh |

### 4.6 Dự báo (Forecasting)

| Slice | File | Mô tả |
|---|---|---|
| `forecastingPage` | `ForecastingPage/` | State tổng trang dự báo |
| `forecastingOverallAssessment` | `ForecastingOverallAssessment/` | Đánh giá tổng thể AI |
| `forecastingCriteria` | `ForecastingCriteria/` | Tiêu chí dự báo |
| `forecastingcharts` | `ForecastingChartConfig/` | Config biểu đồ dự báo |
| `forecastingToggle` | `ForecastingToggle/` | Toggle hiển thị các chỉ số |

### 4.7 Định giá (Valuation / DCF)

| Slice | File | Mô tả |
|---|---|---|
| `valuetionPage` | `ValuetionPage/` | State tổng trang định giá |
| `valuationParams` | `ValuationParams/` | Tham số đầu vào DCF |
| `valuationResult` | `ValuationResult/valuationResultSlice.ts` | Kết quả định giá |
| `scenarios` | `Scenarios/scenariosSlice.ts` | Các kịch bản DCF đã lưu |
| `idScenario` | `Scenarios/idScenariosSlice.ts` | ID kịch bản đang chọn |

### 4.8 Biểu đồ Kỹ thuật

| Slice | File | Mô tả |
|---|---|---|
| `instrumentList` | `InstrumentList/` | Danh sách công cụ kỹ thuật |
| `technicalChartOverview` | `TechnicalChartOverview/` | Overview biểu đồ kỹ thuật |
| `searchStockTechChart` | `SearchStockTechChart/` | Tìm kiếm CK cho tech chart |
| `techChartlayout` | `LayoutTechChart/layoutSlice.ts` | Config layout biểu đồ |

### 4.9 Thông báo

| Slice | File | Mô tả |
|---|---|---|
| `notifications.tokenData` | `Notifications/getTokenNotificationsSlice.ts` | Token Ably cho notifications |
| `notifications.dataNoti` | `Notifications/dataNotificationsSlice.ts` | Dữ liệu thông báo nhận được |

---

## 5. Pattern Slice tiêu chuẩn

Tất cả slice trong dự án đều tuân theo một trong hai pattern sau.

### Pattern A – Async Data Slice (phổ biến nhất)

Dùng cho mọi slice cần fetch dữ liệu từ API.

```ts
// Ví dụ điển hình: FinancialStatement
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

// 1. Định nghĩa interface state
interface XxxState {
  data: SomeType[];
  loading: boolean;
  error: string | null;
}

// 2. Khởi tạo state
const initialState: XxxState = { data: [], loading: false, error: null };

// 3. Async thunk – gọi API
export const fetchXxx = createAsyncThunk(
  'xxx/fetch',
  async (params: ParamType) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/...`);
    return response.json();
  }
);

// 4. Slice
const xxxSlice = createSlice({
  name: 'xxx',
  initialState,
  reducers: { /* sync reducers nếu cần */ },
  extraReducers: (builder) => {
    builder
      .addCase(fetchXxx.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(fetchXxx.fulfilled,  (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchXxx.rejected,   (state, action) => { state.loading = false; state.error = action.error.message || null; });
  },
});

// 5. Selectors (luôn đặt ở cuối file)
export const selectXxxData    = (state: RootState) => state.xxx.data;
export const selectXxxLoading = (state: RootState) => state.xxx.loading;
export const selectXxxError   = (state: RootState) => state.xxx.error;

export default xxxSlice.reducer;
```

**Quy tắc khi dùng Pattern A:**
- Luôn handle đủ 3 case: `pending` / `fulfilled` / `rejected`.
- `error` nên là `string | null`, không để `undefined`.
- Selector đặt ở cuối file slice, không tách file riêng.

### Pattern B – UI State Slice

Dùng cho state UI thuần (tab active, toggle, config layout) — không có async.

```ts
// Ví dụ: StockPage, DarkMode, SiderBar
const xxxSlice = createSlice({
  name: 'xxx',
  initialState,
  reducers: {
    setSomething: (state, action: PayloadAction<ValueType>) => {
      state.field = action.payload;
    },
  },
});

export const { setSomething } = xxxSlice.actions;
export const selectSomething = (state: RootState) => state.xxx.field;
export default xxxSlice.reducer;
```

---

## 6. Slice đặc biệt cần lưu ý

### 6.1 Auth Slice (`src/redux/auth/authSlice.ts`)

Slice phức tạp nhất trong project. Quản lý toàn bộ vòng đời xác thực:

| Thunk | Endpoint | Mô tả |
|---|---|---|
| `login` | `POST /auth/login` | Đăng nhập, lưu token vào cookie qua `js-cookie` |
| `fetchUserProfile` | `GET /auth/profile` | Lấy thông tin user sau khi có token |
| `refreshToken` | `POST /auth/refresh` | Làm mới token trước khi hết hạn |
| `verifyEmail` | Mailgun API | Validate email khi đăng ký |
| `updateUserInformation` | `PUT /general/user/update` | Cập nhật hồ sơ |
| `updateUserAvatar` | `POST /general/user/change-avatar` | Upload avatar (multipart/form-data) |

**Token strategy:**

```
Token lưu ở hai nơi:
  - Redux state: state.auth.token  ← mất khi refresh trang
  - Cookie (js-cookie): key "token"  ← tồn tại qua session

Selector selectToken() ưu tiên lấy từ Redux, fallback sang Cookie:
  selectToken = selectTokenFromRedux(state) || selectTokenFromCookies()
```

**Lưu ý khi dùng token trong thunk khác:**

```ts
// Cách đúng – đọc cookie trực tiếp trong thunk (không dispatch fetchUserProfile trước)
const token = Cookies.get('token');
if (!token) return rejectWithValue('Token không tồn tại');
```

**Selectors xuất:**
- `selectToken(state)` — token ưu tiên Redux → Cookie
- `selectUser(state)` — object user hoặc `null`
- `selectScope(state)` — mảng quyền `scope[]` của user

### 6.2 WatchList Slice (`src/redux/WatchList/watchlistSlice.ts`)

Slice duy nhất persist dữ liệu vào **localStorage** không qua middleware:

```ts
// Khởi tạo từ localStorage (chỉ chạy phía client)
const initialState = {
  watchlist: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('watchlist') || '[]')
    : [],
};

// Mỗi reducer tự sync lại vào localStorage sau khi cập nhật state
toggleWatchlist: (state, action) => {
  // ... xử lý state
  localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
}
```

**Lưu ý:** Pattern này không dùng `redux-persist`. Nếu cần persist thêm slice khác,
cân nhắc dùng `redux-persist` thay vì tự viết tay.

### 6.3 DarkMode Slice (`src/redux/darkmode/darkmodeSlice.ts`)

Slice chỉ giữ state trong Redux. Việc đồng bộ vào `localStorage` và toggle class `dark` trên `<body>`
được xử lý ở component `DashboardLayout`, không phải trong slice:

```ts
// DashboardLayout.tsx
useEffect(() => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  dispatch(setDarkMode(darkMode));
  document.body.classList.toggle('dark', darkMode);
}, []);
```

### 6.4 Notifications (combineReducers nội bộ)

```
state.notifications
  ├── tokenData   ← Ably connection token
  └── dataNoti    ← Dữ liệu thông báo nhận realtime
```

Hai slice con được combine tại `Notifications/index.ts` trước khi đăng ký vào store.
Pattern này giống `tickerList` và `historicalDataPage` — các domain có nhiều slice con liên quan.

### 6.5 Scenarios Slice (`src/redux/Scenarios/scenariosSlice.ts`)

Slice hỗ trợ cả FETCH và POST trong cùng một slice — khác với các slice data thông thường chỉ có fetch:

```ts
// Hỗ trợ 2 thunk
fetchScenarios  → GET  /valuation/{name}/{symbol}/scenarios
postScenario    → POST /valuation/{name}/{symbol}/scenarios
```

**Selector đặc biệt:**
- `selectNewestScenario` — trả về kịch bản mới nhất dựa trên `saveAt` (format `dd/MM/yyyy`)
- `selectIsScenariosEmpty` — boolean check nhanh

---

## 7. Custom Hooks theo tính năng

Ngoài `useAppDispatch` / `useAppSelector`, dự án có thêm 4 custom hook trong `redux/hooks/`:

| Hook | File | Mục đích |
|---|---|---|
| `useSetSelectedButtonStockPage(idx)` | `useButtonstockPage.ts` | Dispatch `setSelectedButtonActive` khi component mount — dùng trên từng sub-page của `/co-phieu/[symbol]` |
| `useButtonsiderBar` | `useButtonsiderBar.ts` | Quản lý active state của Sidebar |
| `useButtonTabScenario` | `useButtonTabScenario.ts` | Tab active trên trang Scenarios |
| `useButtonValuetionPage` | `useButtonValuetionPage.ts` | Tab active trên trang Định giá |

Pattern chung của các hook này:

```ts
const useSetSelectedButtonXxx = (buttonIndex: number) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setXxx({ button: buttonIndex }));
  }, [dispatch, buttonIndex]);
};
```

Dùng trong component bằng cách gọi hook ở đầu function component,
truyền vào index cố định tương ứng với tab của trang đó.

---

## 8. Data Flow tổng quát

```
User action / component mount
        │
        ▼
dispatch(fetchXxx(params))          ← useAppDispatch()
        │
        ├─── pending  → state.loading = true
        │
        ├─── API call (axios hoặc fetch)
        │     └─── Authorization: Bearer {token từ Cookie}
        │
        ├─── fulfilled → state.data = payload, state.loading = false
        │
        └─── rejected  → state.error = message, state.loading = false
                │
                ▼
    component đọc state qua useAppSelector(selectXxxLoading)
    và render loading spinner / error message / data
```

### Lấy token cho API call trong thunk

Phần lớn các thunk cần auth đọc token theo cách này:

```ts
const token = Cookies.get('token');
if (!token) return rejectWithValue('Token không tồn tại');

const response = await fetch(api, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

Một số ít thunk (như `refreshToken`, `fetchUserProfile`) dùng `axios` thay vì `fetch` — không có sự khác biệt về logic, chỉ là convention chưa được chuẩn hóa toàn project.

---

## 9. Quy ước khi thêm Slice mới

1. **Tạo thư mục** `src/redux/FeatureName/` với PascalCase.
2. **Tạo file** `featureNameSlice.ts` — dùng camelCase cho file.
3. **Export** tất cả thunk, action creators, selectors từ file slice.
4. **Tạo** `index.ts` re-export nếu cần (optional, nhưng nhất quán với các slice hiện tại).
5. **Đăng ký** reducer vào `store.ts` với key camelCase.
6. **Không** tạo selector ở file riêng — giữ trong slice file.
7. **Không** dùng `useSelector<RootState, ...>` trực tiếp — dùng `useAppSelector`.

```ts
// store.ts — thêm vào reducer object
import featureNameReducer from './FeatureName/featureNameSlice';

const store = configureStore({
  reducer: {
    // ...existing
    featureName: featureNameReducer,
  },
});
```

---

## 10. Những điểm cần cải thiện (kỹ thuật nợ)

| Vấn đề | Nơi gặp | Đề xuất |
|---|---|---|
| Dùng lẫn `axios` và `fetch` trong thunk | Nhiều slice | Chuẩn hóa về một HTTP client (khuyến nghị `axios` vì có interceptor) |
| WatchList tự persist vào localStorage | `WatchList/watchlistSlice.ts` | Cân nhắc `redux-persist` nếu cần persist thêm slice |
| `RootState` re-export nhầm trong slice con | `ValuationParams/index.ts`, `Notifications/index.ts` | Xóa, chỉ import `RootState` từ `store.ts` |
| Không có error boundary cho async thunk | Toàn bộ | Thêm global error handler hoặc toast notification |
| Comment debug `console.log` còn trong production code | `Scenarios/scenariosSlice.ts` | Dọn sạch trước khi release |

---

*Tài liệu này phản ánh trạng thái codebase tại thời điểm khảo sát.
Cập nhật khi thêm slice mới hoặc thay đổi kiến trúc store.*
