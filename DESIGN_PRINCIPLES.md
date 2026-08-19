# Nguyên Tắc Thiết Kế & Ràng Buộc Redesign UI (ui-craft Method)

Tài liệu này định nghĩa các nguyên tắc và giới hạn kỹ thuật bắt buộc phải tuân thủ trong quá trình thiết kế lại (Redesign) Trang chủ và trang Tài khoản (Account) của LocHerbal.

---

## 🎨 1. Hệ Màu Sắc & Nhận Diện Thương Hiệu
*   **Xanh lá Thảo dược Đặc trưng:** Giữ nguyên tông màu xanh dược liệu ấm áp tự nhiên làm chủ đạo. Không chuyển sang tông màu xám/lạnh kiểu công nghệ thuần túy.
*   **Bắt buộc dùng Token:** Mọi màu sắc thiết kế mới hoặc tinh chỉnh phải sử dụng đúng các CSS variables đã định nghĩa trong `globals.css` (thuộc `@theme inline`), **tuyệt đối không hardcode** các mã màu hex mới trực tiếp vào style class (ví dụ: dùng `text-primary-700`, `bg-primary-50`, `border-primary-100`, v.v. thay vì `#27500A` hay `#EAF3DE`).
*   **Không xóa Token cũ:** Giữ nguyên vẹn tất cả định nghĩa hiện có trong `@theme inline` của `globals.css`. Chỉ thêm mới token bổ trợ nếu cần thiết, không xóa hoặc ghi đè làm hỏng các token cũ.

---

## 🧭 2. Bộ Icon
*   **Material Symbols:** Tiếp tục sử dụng bộ Material Symbols icon set. Không cài đặt, tích hợp hoặc sử dụng bất kỳ thư viện icon nào khác (như Lucide, FontAwesome, v.v.).
*   **Tính đồng nhất:** Đảm bảo sử dụng thẻ `<span className="material-symbols-outlined">icon_name</span>` với đúng style thống nhất.

---

## 🏠 3. Cấu Trúc Trang Chủ (Homepage)
*   **Tách biệt Hero và Banner Carousel:**
    *   Trang chủ bắt buộc phải giữ nguyên cấu trúc hai khối riêng biệt:
        1.  `HeroSection.tsx`: Gọi endpoint `GET /hero-banner` (trả về 1 đối tượng duy nhất, không dùng slide/carousel).
        2.  `BannerCarousel.tsx`: Gọi endpoint `GET /banners` (trả về danh sách banner, hiển thị dạng slide trượt).
    *   **TUYỆT ĐỐI không gộp** hoặc hợp nhất 2 khối này hoặc 2 endpoint này thành một. Việc tải lỗi một trong hai khối không được làm ảnh hưởng đến khối còn lại.

---

## 👤 4. Cấu Trúc Trang Tài Khoản (Account)
*   **Sidebar Navigation Pattern:** Giữ nguyên cấu trúc sidebar dạng tab điều hướng với các pill button.
    *   Trạng thái hoạt động (active state) của pill button phải sử dụng đúng các class background/text từ token (ví dụ: `bg-primary-100 text-primary-700` hoặc tương đương).
*   **Mini-stat Strip:** Giữ nguyên phần thống kê nhanh (mini-stat strip) hiển thị số lượng đơn hàng, địa chỉ, trạng thái tài khoản.
*   **Bảo toàn nghiệp vụ:** Việc thay đổi giao diện không được phép làm ảnh hưởng hoặc làm biến mất các tính năng nghiệp vụ quan trọng:
    *   Form cập nhật thông tin cá nhân.
    *   Quản lý danh sách địa chỉ giao hàng và modal thêm/sửa địa chỉ.
    *   Danh sách đơn hàng cùng thẻ hiển thị trạng thái đơn hàng.
    *   Chức năng đổi mật khẩu (phải hoạt động đúng và tự động logout/revoke session cũ khi đổi thành công).

---

## ⚙️ 5. Kiểm soát Hiệu năng & Quy trình Kiểm thử (Verification)
*   **Giới hạn Performance:** Điểm hiệu năng Lighthouse (Performance score) trên môi trường local sau khi thiết kế lại không được giảm quá **5 điểm** so với baseline hiện tại.
*   **Quy trình xác minh:**
    1.  Chạy `git diff` để đảm bảo không dòng nào trong `globals.css` `@theme` bị xóa.
    2.  Đo Lighthouse.
    3.  Chụp ảnh màn hình kiểm chứng giao diện.
    4.  Chạy Playwright test suite để đảm bảo 100% test case hoạt động chính xác (`01-homepage.spec.ts`, `00-public.spec.ts` cho Trang chủ; `e2e/08-account-redesign.spec.ts` cho Trang Account).
