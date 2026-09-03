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
        backgroundColor: '#e7f0e9',
        backgroundImage:
          'linear-gradient(180deg, rgba(219,233,222,0.88) 0%, rgba(171,196,177,0.66) 45%, rgba(214,229,217,0.88) 100%), url(/images/decor/home-bg-soft.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
