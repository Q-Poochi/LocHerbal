---
name: git-commit-convention
description: Dùng cho mọi commit và Pull Request trong dự án.
---

# Quy ước Git

## Commit message (Conventional Commits)
Format: `<type>(<module>): <mô tả ngắn>`

Type hợp lệ: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`

Ví dụ:
- `feat(sales): thêm API tạo đơn hàng`
- `fix(warehouse): sửa lỗi trừ tồn kho âm khi hủy đơn`
- `security(core): thêm rate limit cho endpoint login`

## Branch naming
`<type>/<module>-<mô-tả-ngắn>` — ví dụ: `feat/sales-order-checkout`, `fix/warehouse-stock-race-condition`

## Nguyên tắc
- Một commit chỉ chứa một thay đổi logic — không gộp nhiều việc không liên quan vào một commit.
- Mỗi Pull Request phải ghi rõ đang thuộc **module nào** và **phase nào** trong lộ trình (đối chiếu tài liệu kiến trúc) ở phần mô tả PR.
- Không commit trực tiếp vào `main` — mọi thay đổi qua PR, tối thiểu 1 review trước khi merge (kể cả khi làm một mình, tự dùng Antigravity Plan Mode review lại trước khi merge).
- Không commit file `.env`, file build (`dist/`, `node_modules/`), hoặc secrets dưới mọi hình thức.
