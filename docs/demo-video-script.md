# Kịch bản quay Demo Video (tối đa 5 phút)

> Lưu ý: mình (AI) không thể tự tạo ra file video trong môi trường này — bạn hãy dùng kịch bản dưới
> đây để tự quay màn hình (OBS Studio / Loom / QuickTime đều được), vừa quay vừa đọc theo lời thoại
> gợi ý. Toàn bộ nội dung nói trong video đều trỏ thẳng vào các file có thật trong bộ nộp bài, không
> cần dựng thêm gì.

## Cảnh 1 (0:00–0:40) — Giới thiệu vấn đề & requirement
**Hiện trên màn hình:** mở `README.md`, phần "1. Problem".
**Lời thoại gợi ý:**
> "QA phải lặp lại 5 việc mỗi ngày: đọc requirement, viết test case, chạy regression, viết bug
> report, phân tích lỗi. Mình xây một AI Testing Assistant tự làm cả 5 bước này, đầu vào chỉ là một
> user story: 'As a user, I can register using email and password.'"

## Cảnh 2 (0:40–1:20) — Vì sao chọn sample app
**Hiện trên màn hình:** mở `app/register.html` bằng trình duyệt thật, chỉ tay vào form.
**Lời thoại gợi ý:**
> "Mình tự dựng app đăng ký nhỏ này thay vì dùng site công khai, vì cần dữ liệu ổn định để test được
> case 'email đã tồn tại' một cách lặp lại được — và mình đã cài 2 lỗi thật vào code để chứng minh
> pipeline phát hiện lỗi hoạt động, thay vì demo toàn PASS."

## Cảnh 3 (1:20–2:10) — AI sinh test case
**Hiện trên màn hình:** mở `test-cases/test-cases.md`, cuộn qua 4 nhóm case.
**Lời thoại gợi ý:**
> "Từ requirement đó, AI sinh ra 21 test case, chia đủ 4 nhóm: Positive, Negative, Boundary,
> Validation — ví dụ TC-13 test password đúng 8 ký tự (biên dưới theo spec), TC-09 test đăng ký với
> email đã tồn tại."

## Cảnh 4 (2:10–2:40) — Bonus: AI tự khám phá site
**Hiện trên màn hình:** chạy lệnh `node tools/ai-explorer.js` trong terminal, sau đó mở
`docs/ai-explorer-report.md` và ảnh `test-results/screenshots/ai-explorer-annotated.png`.
**Lời thoại gợi ý:**
> "Phần bonus: một AI Explorer tự quét DOM của trang, khoanh đỏ từng field tìm được, và tự gợi ý nên
> test gì dựa trên thuộc tính của field — ví dụ nó tự nhận ra ô email và gợi ý ngay 'phải test
> trường hợp email trùng lặp', đúng chỗ có bug thật."

## Cảnh 5 (2:40–3:40) — Chạy test tự động & xem kết quả
**Hiện trên màn hình:** chạy `node tests/register.spec.js`, để lộ toàn bộ log chạy qua 21 dòng
PASS/FAIL trên terminal.
**Lời thoại gợi ý:**
> "Toàn bộ 21 test case được tự động hoá 100% bằng Playwright, chạy thật trên Chromium headless.
> Kết quả: 19 pass, 2 fail — TC-09 và TC-13."

## Cảnh 6 (3:40–4:30) — Phân tích lỗi & bằng chứng
**Hiện trên màn hình:** mở lần lượt `test-results/screenshots/TC-09.png` và `TC-13.png`, rồi mở
đoạn code tương ứng trong `app/register.html` (dòng bị comment và dòng `<=` sai).
**Lời thoại gợi ý:**
> "Với mỗi lỗi, hệ thống tự chụp màn hình bằng chứng, rồi mình cho AI đọc lại source code để tìm
> nguyên nhân thật — TC-09 là do đoạn check email trùng bị comment out, TC-13 là lỗi off-by-one,
> `<=` thay vì `<` ở điều kiện độ dài tối thiểu."

## Cảnh 7 (4:30–5:00) — Bug report & tổng kết
**Hiện trên màn hình:** mở `bug-reports/BUG-002-password-min-length-off-by-one.md`, cuộn qua đủ 6
mục.
**Lời thoại gợi ý:**
> "Mỗi lỗi được viết thành bug report đầy đủ: test case, expected, actual, evidence, severity, và
> possible cause trỏ thẳng vào dòng code. Toàn bộ quy trình này — từ requirement đến bug report —
> được tự động hoá, có bằng chứng thật, không phải mô tả suông."

---

### Ghi chú kỹ thuật khi quay
- Quay theo thứ tự trên là tối ưu để đúng 5 phút; nếu thiếu thời gian, có thể gộp Cảnh 4 (bonus) vào
  cuối video dưới dạng "extra" 20 giây.
- Nên bật terminal font to (≥16px) để log dễ đọc khi quay màn hình.
- File `DEMO.md` là bản văn bản đầy đủ của đúng kịch bản này, dùng để đọc lại nhanh trước khi quay.
