/**
 * BotanicalBackground — nền toàn trang bằng ảnh lá thật
 * Tăng độ đậm, giảm độ chói lóa, hòa sắc xanh thảo dược tự nhiên (herbal sage sâu lắng).
 */

export default function BotanicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{
        zIndex: 0,
        backgroundColor: '#cbd8ce',
        backgroundImage:
          'linear-gradient(180deg, rgba(200,218,204,0.72) 0%, rgba(142,173,150,0.55) 45%, rgba(195,214,199,0.75) 100%), url(/images/decor/home-bg-soft.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
