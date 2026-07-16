# AGENTS.md — Chỉ dẫn bắt buộc cho mọi AI Agent làm việc trong project này

> Đây là file Roo/Cursor/Windsurf/Copilot tự động đọc khi mở project.
> KHÔNG bỏ qua file này. Đọc TOÀN BỘ trước khi làm bất cứ việc gì.

---

## 1. Đọc theo thứ tự này trước khi nhận task

```
Bước 1: Đọc file này (AGENTS.md) — đang đọc
Bước 2: Đọc PROJECT_CONTEXT.md — trạng thái thật của dự án
Bước 3: Đọc .agent-rules/RULES.md — quy tắc bắt buộc không được vi phạm
Bước 4: Đọc .agent-rules/skills/ — skill liên quan đến task đang làm
Bước 5: Làm task
```

Nếu bỏ qua bất kỳ bước nào → khả năng cao sẽ làm sai kiến trúc,
tạo code trùng lặp, vi phạm quyết định đã chốt → mất thời gian sửa.

---

## 2. Tổng quan dự án (đọc nhanh)

**Tên:** LocHerbal — Nền tảng thương mại điện tử sản phẩm sức khỏe/thảo dược Việt Nam

**Cấu trúc repo:**
```
/LOCPROJECT/              ← Backend (NestJS)
  src/modules/            ← 8 modules nghiệp vụ
  schema.prisma           ← Nguồn sự thật duy nhất về DB schema
  PROJECT_CONTEXT.md      ← Trạng thái dự án (luôn đọc trước)
  .agent-rules/           ← Rules + Skills (copy từ bộ skill đã thiết lập)

/locproject-frontend/     ← Frontend (Next.js 16)
  src/app/                ← App Router
  src/components/         ← UI components
  src/lib/                ← API client, Zustand stores
  stitch-export/          ← HTML gốc từ Stitch (nguồn tham khảo UI)
  PROJECT_CONTEXT.md      ← Trạng thái frontend (đọc trước)
  .agent-rules/           ← Rules + Skills (copy từ backend)
```

**Stack đã chốt — KHÔNG được thay đổi:**
- Backend: NestJS + TypeScript + Prisma 6.19.3 + PostgreSQL + Redis
- Frontend: Next.js 16 App Router + TypeScript + Tailwind v4 + Zustand + React Query
- DB: PostgreSQL (primary port 5434) + PgBouncer (port 6432) + Redis (port 6379)
- Auth: JWT access token in-memory + Refresh token httpOnly cookie

---

## 3. Cách làm việc đúng với project này

### Chế độ làm việc
| Loại task | Chế độ |
|---|---|
| Kiến trúc, schema DB, auth, thanh toán, tồn kho | **Plan Mode** — đề xuất plan, chờ duyệt |
| UI components, CRUD đơn giản, fix lỗi nhỏ | **Fast Mode** — làm luôn |
| Deploy, migration production | **Plan Mode** — bắt buộc |

### Quy tắc báo cáo
- KHÔNG nói "đã xong" nếu chưa chạy lệnh và thấy output thật
- Mọi task quan trọng: dán output thật (build log, test result, migration log)
- Nếu không chắc → hỏi, không tự đoán rồi làm

### Quy tắc module (Backend)
- Mỗi module NestJS là 1 bounded context độc lập
- Giao tiếp giữa module CHỈ qua Domain Event (@nestjs/event-emitter)
- KHÔNG import Service của module khác trực tiếp

---

## 4. Danh sách file cần đọc khi làm task cụ thể

| Task | File cần đọc thêm |
|---|---|
| Bất kỳ task nào | PROJECT_CONTEXT.md + file này |
| Sửa DB schema | .agent-rules/skills/db-schema-review/SKILL.md |
| Viết API endpoint | .agent-rules/skills/api-contract/SKILL.md |
| Viết code TS/NestJS | .agent-rules/skills/coding-standards/SKILL.md |
| Auth/Payment/Security | .agent-rules/skills/security-checklist/SKILL.md |
| Viết/chạy test | .agent-rules/skills/testing-policy/SKILL.md |
| Commit/PR | .agent-rules/skills/git-commit-convention/SKILL.md |
| Bắt đầu phiên mới | .agent-rules/skills/anti-hallucination/SKILL.md |
