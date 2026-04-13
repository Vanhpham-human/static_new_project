# TechChain Admin Dashboard

He thong phan tich doanh thu cua chuoi cua hang cong nghe dung `Express + EJS + MongoDB (Mongoose) + Chart.js`.

## 1) Cai dat

```bash
npm install
cp .env.example .env
```

Dam bao MongoDB dang chay local hoac sua `MONGO_URI` trong `.env`.

## 2) Seed du lieu lon

```bash
npm run seed
```

So luong du lieu:
- Users: 500
- Employees: 30
- Products: 100 (10 danh muc)
- Orders: 5,000
- OrderDetails: ~15,000 (2-4 san pham/don, trung binh xap xi 3)

Script seed dung `insertMany` + chia chunk de tranh treo bo nho.

## 3) Chay dashboard

```bash
npm start
```

Mo:
- [http://localhost:3000/dashboard/overview](http://localhost:3000/dashboard/overview)
- [http://localhost:3000/dashboard/reports](http://localhost:3000/dashboard/reports)

## 4) Tinh nang theo de bai

- Schema day du + rang buoc + index cho truong lon.
- Line chart doanh thu theo thoi gian.
- Bar chart doanh thu theo danh muc.
- Bang Top 10 khach hang.
- Bang hieu suat nhan vien (thuong 1%).
- Bang canh bao ton kho `stock < 10`.
- Bo loc thoi gian: all / thisMonth / lastMonth / last7Days.
- Truy van loi nhuan rong = Tong doanh thu - Tong gia von.

## 5) Tra loi cac cau hoi tu duy

### 5.1 Truyen du lieu Aggregation vao Chart.js trong EJS

Tren server, gui mang aggregation qua `res.render(...)`. Trong EJS:

```ejs
<script>
  const monthlyRevenue = <%- JSON.stringify(monthlyRevenue) %>;
</script>
```

`JSON.stringify()` bien object JS thanh JSON hop le de trinh duyet dung truc tiep cho Chart.js.

### 5.2 Toi uu khi 100,000+ orders

Nen index:
- `orders.orderDate`
- `orders.status`
- `orders.customer`
- `orders.staff`
- `orderdetails.order`
- `orderdetails.product`
- `products.category`
- `products.stock`
- `users.email` (unique)
- `employees.code` (unique)

Co the dung compound index nhu:
- `orders: { orderDate: 1, status: 1 }`
- `orders: { customer: 1, orderDate: -1 }`
- `orders: { staff: 1, orderDate: -1 }`
- `orderdetails: { order: 1, product: 1 }`

Virtuals trong Mongoose **khong thay the index** va khong toi uu aggregation nang. Virtuals chi nen dung de hien thi thuoc tinh tinh toan nho, khong nen dua vao truy van lon.

### 5.3 Bao mat phan quyen nhan vien/manager

- Them truong `role` vao employee/user (`staff`, `manager`, `admin`).
- Dung middleware auth (`JWT` hoac session).
- Route dashboard tong hop:
  - chi `manager/admin` duoc xem tong quan toan he thong.
- Route danh sach don:
  - `staff` bat buoc them filter `staff = req.user._id`.
- Khong tin role gui tu client, chi lay tu token/session server da xac thuc.

### 5.4 Truy van loi nhuan rong

Da co san trong `src/services/dashboardService.js`:
- `$lookup` order + product
- loc `Completed`
- tinh:
  - `totalRevenue = sum(quantity * unitPrice)`
  - `totalCost = sum(quantity * product.costPrice)`
  - `netProfit = totalRevenue - totalCost`

## 6) Cau truc thu muc

```txt
src/
  app.js
  config/db.js
  models/
  routes/dashboard.js
  services/dashboardService.js
  views/
scripts/seed.js
public/css/styles.css
```
