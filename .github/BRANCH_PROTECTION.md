# Branch Protection Rules — LocHerbal

## Cách setup trên GitHub
Settings → Branches → Add branch protection rule

## Rule cho branch `main`
Branch name pattern: main

Cấu hình:
- [x] Require a pull request before merging
  - [x] Require approvals: 1
- [x] Require status checks to pass before merging
  Status checks bắt buộc (thêm sau khi workflow chạy lần đầu):
  - Backend CI / test (từ backend-ci.yml)
  - Frontend CI / build (từ frontend-ci.yml)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

## Rule cho branch `develop`
Branch name pattern: develop

Cấu hình:
- [x] Require status checks to pass before merging
  - Backend CI / test
  - Frontend CI / build
- [ ] Require approvals (không bắt buộc cho develop)

## Workflow làm việc khuyến nghị
feature/xxx → develop (CI chạy tự động)
develop → main (CI + 1 review + deploy staging tự động)