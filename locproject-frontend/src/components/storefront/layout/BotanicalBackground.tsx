/**
 * BotanicalBackground — Premium Editorial Sage (DESIGN.md)
 * - Nền toàn trang dùng ảnh botanical vẽ tay (public/images/botanical-bg.webp, ~59KB)
 * - Ảnh phủ kín viewport (cover), nền dự phòng #f8faf9 khớp palette DESIGN.md
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
        backgroundImage: 'url(/images/botanical-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
