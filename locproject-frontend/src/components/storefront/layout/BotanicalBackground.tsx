/**
 * BotanicalBackground — nền toàn trang bằng ảnh lá thật (Home.jpg do người dùng cung cấp)
 * - public/images/decor/home-bg.webp (1920×2560, ~406KB, tối ưu từ ảnh gốc 3456×4608)
 * - CSS layers: overlay sage sáng (để chữ trên section trong suốt vẫn dễ đọc)
 *   đè lên ảnh lá (cover) — ảnh chỉ hiện như texture nhẹ
 * - Fixed, z-0, pointer-events-none — không che nội dung (nội dung z-10 ở layout.tsx)
 */

export default function BotanicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{
        zIndex: 0,
        backgroundColor: '#f8faf9',
        backgroundImage:
          'linear-gradient(180deg, rgba(248,250,249,0.88) 0%, rgba(211,222,212,0.55) 45%, rgba(248,250,249,0.90) 100%), url(/images/decor/home-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
