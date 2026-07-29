# Security Checklist Skill

> Placeholder skill file.

## Purpose
Ensure security best practices for auth, payment, and data protection.

## Checklist
- [ ] JWT access token in-memory only
- [ ] Refresh token httpOnly cookie with rotation
- [ ] bcrypt hash for refresh tokens (no raw)
- [ ] Replay attack detection implemented
- [ ] No hardcoded secrets
- [ ] Fail-fast on missing env vars
- [ ] JwtAuthGuard on protected routes
- [ ] VNPay IPN: Public + SecureHash verification
- [ ] Payment amount from DB, not client

## References
- `PROJECT_CONTEXT.md`
- `RULES.md` NHÓM 2 — Bảo mật