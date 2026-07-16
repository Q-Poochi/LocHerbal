# Prompt mồi cho Roo — dán vào đầu MỌI phiên làm việc mới

Sao chép toàn bộ nội dung dưới đây và dán vào Roo khi bắt đầu:

---

```
Trước khi làm bất cứ việc gì, đọc các file sau theo thứ tự:
1. AGENTS.md (tại gốc project)
2. PROJECT_CONTEXT.md (tại gốc project)
3. .agent-rules/RULES.md

Sau khi đọc xong, tóm tắt lại cho tôi:
- Trạng thái hiện tại của dự án là gì?
- Việc đang làm dở là gì?
- Bước tiếp theo cần làm là gì?
- Có quyết định kiến trúc nào quan trọng cần lưu ý không?

Đừng bắt đầu code cho đến khi tôi xác nhận tóm tắt của bạn là đúng.
```

---

## Tại sao cần prompt mồi này

Roo (và mọi AI agent) không có trí nhớ giữa các phiên.
Mỗi phiên mới = agent "mới hoàn toàn", không biết gì về dự án.

Prompt mồi này buộc Roo:
1. Đọc tài liệu thật thay vì tự bịa context
2. Tóm tắt lại để bạn kiểm tra agent đã hiểu đúng chưa
3. Không code ngay khi chưa được xác nhận

## Dấu hiệu Roo đã đọc đúng

Nếu Roo tóm tắt đúng, bạn sẽ thấy:
- Nhắc đến "36 unit test pass", "Prisma 6.19.3", "Phase B đang làm"
- Biết rằng Sales module đang chờ VNPay sandbox
- Biết rằng Phase B đang ở File 2 (trang chủ)
- Nhắc đến quy tắc "không import Service module khác"

Nếu Roo tóm tắt sai hoặc không nhắc đến những điều này:
→ Yêu cầu Roo đọc lại file cụ thể bị bỏ qua trước khi tiếp tục.
